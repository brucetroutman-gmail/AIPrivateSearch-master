// Model/PC-aware recommender (step iii).
//
// Steps i and ii gave us a model-aware context clamp (native max from /api/show) and a
// per-run resource capture (real resident MB, loaded context, digest). This module consumes
// that observational data to answer two questions, grounded ONLY in what has actually been
// measured on THIS machine — never an analytical KV-cache estimate, which was shown to be
// wrong for gemma4 (interleaved attention) and qwen3.5:
//
//   1. advise context per model: given this machine's RAM budget and the resident-MB-vs-
//      context curve observed for a model, what is the largest context with evidence of
//      fitting, and should a requested context be clamped?
//
//   2. recommend best-2 models per collection: rank models by observed weighted score on that
//      collection, keeping only models that fit the machine, and return the top two.
//
// DATA SOURCE: the machine-local recommender store (recommenderStore.mjs). The remote MySQL
// DB is a testing sink only and is NOT used here; in normal use it is unavailable. Each
// machine stands on its own observations — nothing is seeded from test data.
//
// Cold start is honest: a model/context never observed returns "unknown" rather than a guess.

import { getObservations, parseRamToMB } from './recommenderStore.mjs';

export { parseRamToMB };

const OLLAMA_HOST = 'http://localhost:11434';

// Fraction of total RAM we are willing to let a single resident model occupy. The OS, the
// Node server, the embedding store and Ollama's own overhead all need headroom, so we do
// not budget the whole machine. 0.65 of 16 GB ~= 10.6 GB.
const DEFAULT_RAM_BUDGET_FRACTION = 0.65;

// A model needs at least this many observed runs at a given context before we treat that
// context as "proven to fit". One lucky run is not evidence.
const MIN_OBSERVATIONS_FOR_FIT = 2;

// A model needs at least this many scored runs on a collection before we rank it, so a
// single outlier score does not win or lose a recommendation.
const MIN_OBSERVATIONS_FOR_SCORE = 2;

// Models Ollama currently has installed, so a model the user has since deleted stops being
// recommended. Best-effort: null (= do not filter) when Ollama is unreachable or reports none.
async function getInstalledModels() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    const names = new Set();
    for (const m of data.models || []) {
      if (m.name) names.add(m.name);
      if (m.model) names.add(m.model);
    }
    return names.size > 0 ? names : null;
  } catch {
    return null;
  }
}

// Load this machine's observations, restricted to still-installed models.
async function loadObservations() {
  const [obs, installed] = await Promise.all([getObservations(), getInstalledModels()]);
  const keep = m => !installed || installed.has(m);
  return {
    pcRamMB: obs.pcRamMB,
    resourceRows: obs.resourceRows.filter(r => keep(r.model)),
    scoreRows: obs.scoreRows.filter(r => keep(r.model))
  };
}

// Build, per model, the list of contexts observed and the largest context proven to fit
// the RAM budget. "Proven" means: observed >= MIN_OBSERVATIONS_FOR_FIT times AND its worst
// observed resident MB is within budget.
function buildFitByModel(resourceRows, ramBudgetMB) {
  const byModel = new Map();
  for (const r of resourceRows) {
    const ctx = Number(r.ctx);
    const maxMB = Number(r.maxResidentMB);
    const runs = Number(r.runs);
    if (!byModel.has(r.model)) {
      byModel.set(r.model, { model: r.model, digest: r.digest, observations: [], maxFitContext: null, maxFitResidentMB: null });
    }
    const m = byModel.get(r.model);
    const fits = maxMB <= ramBudgetMB && runs >= MIN_OBSERVATIONS_FOR_FIT;
    m.observations.push({ context: ctx, runs, maxResidentMB: maxMB, avgResidentMB: Number(r.avgResidentMB), fits });
    if (fits && (m.maxFitContext == null || ctx > m.maxFitContext)) {
      m.maxFitContext = ctx;
      m.maxFitResidentMB = maxMB;
    }
  }
  return byModel;
}

// Resolve the RAM budget: an explicit override wins; otherwise take a fraction of the
// machine's total RAM. Returns the budget plus how it was derived, so callers can show the basis.
function resolveBudget(explicitBudgetMB, pcRamMB) {
  if (Number.isFinite(explicitBudgetMB) && explicitBudgetMB > 0) {
    return { ramBudgetMB: Math.round(explicitBudgetMB), totalRamMB: pcRamMB, source: 'explicit' };
  }
  if (Number.isFinite(pcRamMB) && pcRamMB > 0) {
    return {
      ramBudgetMB: Math.round(pcRamMB * DEFAULT_RAM_BUDGET_FRACTION),
      totalRamMB: pcRamMB,
      fraction: DEFAULT_RAM_BUDGET_FRACTION,
      source: 'fraction-of-total'
    };
  }
  // No RAM info at all: fall back to a conservative 8 GB budget so "fit" still means
  // something rather than admitting everything.
  return { ramBudgetMB: 8192, totalRamMB: null, source: 'fallback' };
}

// Public: advise a context for a model against a RAM budget.
//   - If we have proven a context >= requested fits, approve the requested value.
//   - If requested exceeds the largest proven-fit context, advise clamping down to it.
//   - If we have never observed this model at all, return status "unknown" (no guess).
export async function adviseContext({ model, requestedContext, ramBudgetMB = null } = {}) {
  if (!model) return { status: 'unknown', reason: 'no model specified' };
  const { resourceRows, pcRamMB } = await loadObservations();
  const budget = resolveBudget(ramBudgetMB, pcRamMB);
  const m = buildFitByModel(resourceRows, budget.ramBudgetMB).get(model);
  if (!m || m.observations.length === 0) {
    return { status: 'unknown', model, reason: 'no observed runs for this model on this machine', budget };
  }
  const requested = Number(requestedContext) || null;
  const result = {
    status: 'ok',
    model,
    digest: m.digest,
    budget,
    observations: m.observations.sort((a, b) => a.context - b.context),
    maxFitContext: m.maxFitContext,
    maxFitResidentMB: m.maxFitResidentMB,
    requestedContext: requested
  };
  if (requested == null) {
    result.advisedContext = m.maxFitContext;
    result.clamped = false;
  } else if (m.maxFitContext != null && requested > m.maxFitContext) {
    result.advisedContext = m.maxFitContext;
    result.clamped = true;
    result.reason = `requested ${requested} exceeds largest context proven to fit (${m.maxFitContext}) within RAM budget ${budget.ramBudgetMB} MB`;
  } else {
    result.advisedContext = requested;
    result.clamped = false;
  }
  return result;
}

// Public: recommend the best-N models for a collection (or all collections when none is
// given). A model is eligible only if it has >= MIN_OBSERVATIONS_FOR_SCORE scored runs on
// the collection and at least one context proven to fit the RAM budget.
export async function recommendModels({ collection = null, ramBudgetMB = null, topN = 2 } = {}) {
  const { resourceRows, scoreRows, pcRamMB } = await loadObservations();
  const budget = resolveBudget(ramBudgetMB, pcRamMB);
  const fitByModel = buildFitByModel(resourceRows, budget.ramBudgetMB);

  // Group scores by collection.
  const byCollection = new Map();
  for (const r of scoreRows) {
    if (collection && r.collection !== collection) continue;
    if (!byCollection.has(r.collection)) byCollection.set(r.collection, []);
    byCollection.get(r.collection).push(r);
  }

  const recommendations = [];
  for (const [coll, rows] of byCollection) {
    const ranked = rows
      .map(r => {
        const fit = fitByModel.get(r.model);
        const eligible = Number(r.runs) >= MIN_OBSERVATIONS_FOR_SCORE && !!fit && fit.maxFitContext != null;
        return {
          model: r.model,
          avgScore: Number(r.avgScore),
          minScore: Number(r.minScore),
          maxScore: Number(r.maxScore),
          runs: Number(r.runs),
          maxFitContext: fit ? fit.maxFitContext : null,
          maxFitResidentMB: fit ? fit.maxFitResidentMB : null,
          eligible,
          fitKnown: !!fit
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    const eligible = ranked.filter(r => r.eligible);
    recommendations.push({
      collection: coll,
      budget,
      best: eligible.slice(0, topN),
      allRanked: ranked,
      note: eligible.length < topN
        ? `only ${eligible.length} model(s) have both enough scored runs and a proven-fit context; others are still cold-start or unfit`
        : null
    });
  }

  return collection
    ? (recommendations[0] || { collection, best: [], allRanked: [], note: 'no scored runs for this collection on this machine', budget })
    : recommendations;
}

// Public: recommend models for a single collection, falling back to a global (all-
// collection) ranking on this machine when the collection has no eligible models yet.
// Rather than showing nothing for a freshly added collection, the UI can show "no data for
// this collection yet; across all collections, these models rank highest" — a zero-compute
// hint that is clearly labelled as a fallback so it is not mistaken for collection-specific
// evidence.
export async function recommendModelsForCollection({ collection, ramBudgetMB = null, topN = 2 } = {}) {
  const primary = await recommendModels({ collection, ramBudgetMB, topN });
  // recommendModels with a collection returns a single object (not an array).
  if (primary && Array.isArray(primary.best) && primary.best.length > 0) {
    return { ...primary, fallback: null };
  }

  const global = await recommendGlobal({ ramBudgetMB, topN });
  return {
    collection,
    budget: global.budget,
    best: global.best,
    allRanked: global.allRanked,
    fallback: 'all-collections',
    note: global.best.length > 0
      ? 'no data for this collection yet; showing models that rank highest across all collections on this machine'
      : 'no benchmark data yet on this machine'
  };
}

// Compute a machine-wide model ranking by averaging each model's observed weighted score
// across every collection, filtered to models with a proven-fit context. Used as the
// cold-start fallback for a collection with no history of its own.
export async function recommendGlobal({ ramBudgetMB = null, topN = 2 } = {}) {
  const { resourceRows, scoreRows, pcRamMB } = await loadObservations();
  const budget = resolveBudget(ramBudgetMB, pcRamMB);
  const fitByModel = buildFitByModel(resourceRows, budget.ramBudgetMB);

  // Aggregate score rows (per collection+model) up to per model, weighting each collection's
  // average by its run count so a heavily-run collection is not drowned out by a lightly-run one.
  const agg = new Map();
  for (const r of scoreRows) {
    const runs = Number(r.runs);
    const avg = Number(r.avgScore);
    if (!agg.has(r.model)) agg.set(r.model, { model: r.model, weightedSum: 0, totalRuns: 0, collections: 0 });
    const a = agg.get(r.model);
    a.weightedSum += avg * runs;
    a.totalRuns += runs;
    a.collections += 1;
  }

  const ranked = Array.from(agg.values())
    .map(a => {
      const fit = fitByModel.get(a.model);
      const avgScore = a.totalRuns > 0 ? Math.round((a.weightedSum / a.totalRuns) * 10) / 10 : 0;
      const eligible = a.totalRuns >= MIN_OBSERVATIONS_FOR_SCORE && !!fit && fit.maxFitContext != null;
      return {
        model: a.model,
        avgScore,
        runs: a.totalRuns,
        collections: a.collections,
        maxFitContext: fit ? fit.maxFitContext : null,
        maxFitResidentMB: fit ? fit.maxFitResidentMB : null,
        eligible,
        fitKnown: !!fit
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  const eligible = ranked.filter(r => r.eligible);
  return { budget, best: eligible.slice(0, topN), allRanked: ranked };
}
