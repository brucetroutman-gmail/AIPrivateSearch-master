// Model/PC-aware recommender (step iii).
//
// Steps i and ii gave us a model-aware context clamp (native max from /api/show) and a
// per-run resource capture (real resident MB, loaded context, digest written to the
// `searches` row). This module is the consumer of that observational data. It answers two
// questions, both grounded ONLY in what has actually been measured on the target machine
// — never an analytical KV-cache estimate, which was shown to be wrong for gemma4
// (interleaved attention) and qwen3.5:
//
//   1. advise context per model: given a machine's RAM budget and the resident-MB-vs-
//      context curve we have observed for a model, what is the largest context we have
//      evidence will fit, and should a requested context be clamped?
//
//   2. recommend best-2 models per collection: rank models by their observed weighted
//      score on that collection, keeping only models that fit the machine, and return the
//      top two.
//
// Cold start is honest: a model/context we have never observed returns "unknown" rather
// than a guess. The data is self-healing — new rows accrue as the machine runs, and a
// re-quantized model gets a new digest so stale rows are not reused for a different build.

import pool from '../db.mjs';

// Fraction of total RAM we are willing to let a single resident model occupy. The OS, the
// Node server, the embedding store and Ollama's own overhead all need headroom, so we do
// not budget the whole machine. 0.65 of 16 GB ~= 10.6 GB, which comfortably covers every
// model/context combination observed so far (peak ~9.2 GB) while leaving margin.
const DEFAULT_RAM_BUDGET_FRACTION = 0.65;

// A model needs at least this many observed runs at a given context before we treat that
// context as "proven to fit". One lucky run is not evidence.
const MIN_OBSERVATIONS_FOR_FIT = 2;

// A model needs at least this many scored runs on a collection before we rank it, so a
// single outlier score does not win or lose a recommendation.
const MIN_OBSERVATIONS_FOR_SCORE = 2;

// Parse a PcRAM string such as "16 GB" / "16GB" / "16384 MB" into megabytes. Returns null
// when it cannot be parsed, so the caller can fall back rather than trust a bad budget.
export function parseRamToMB(pcRam) {
  if (pcRam == null) return null;
  const s = String(pcRam).trim();
  const match = s.match(/([\d.]+)\s*(gb|mb|g|m)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = (match[2] || 'gb').toLowerCase();
  if (unit === 'mb' || unit === 'm') return Math.round(value);
  return Math.round(value * 1024); // gb
}

// Pull the observed resident-MB-vs-context curve for every model seen on a machine.
// Keyed on model + loaded context; we take the MAX resident MB at each point (the
// worst case we must budget for), plus the run count and the most recent digest.
async function fetchResourceCurves(connection, pcCode) {
  const where = pcCode ? 'WHERE `ResidentMB-search` IS NOT NULL AND PcCode = ?' : 'WHERE `ResidentMB-search` IS NOT NULL';
  const params = pcCode ? [pcCode] : [];
  const [rows] = await connection.execute(
    `SELECT \`ModelName-search\` AS model,
            \`LoadedContext-search\` AS ctx,
            COUNT(*) AS runs,
            MAX(\`ResidentMB-search\`) AS maxResidentMB,
            ROUND(AVG(\`ResidentMB-search\`)) AS avgResidentMB,
            MAX(\`ModelDigest-search\`) AS digest
       FROM \`searches\`
       ${where}
       GROUP BY model, ctx
       ORDER BY model, ctx`,
    params
  );
  return rows;
}

// Observed weighted score per model per collection on a machine.
async function fetchScoreCurves(connection, pcCode) {
  const where = pcCode
    ? 'WHERE `WeightedScore-pct` IS NOT NULL AND CollectionName IS NOT NULL AND PcCode = ?'
    : 'WHERE `WeightedScore-pct` IS NOT NULL AND CollectionName IS NOT NULL';
  const params = pcCode ? [pcCode] : [];
  const [rows] = await connection.execute(
    `SELECT CollectionName AS collection,
            \`ModelName-search\` AS model,
            COUNT(*) AS runs,
            ROUND(AVG(\`WeightedScore-pct\`), 1) AS avgScore,
            MIN(\`WeightedScore-pct\`) AS minScore,
            MAX(\`WeightedScore-pct\`) AS maxScore
       FROM \`searches\`
       ${where}
       GROUP BY collection, model
       ORDER BY collection, avgScore DESC`,
    params
  );
  return rows;
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

// Public: advise a context for a model against a RAM budget.
//   - If we have proven a context >= requested fits, approve the requested value.
//   - If requested exceeds the largest proven-fit context, advise clamping down to it.
//   - If we have never observed this model at all, return status "unknown" (no guess).
export async function adviseContext({ model, requestedContext, pcCode = null, ramBudgetMB = null } = {}) {
  if (!model) return { status: 'unknown', reason: 'no model specified' };
  const connection = await pool.getConnection();
  try {
    const resourceRows = await fetchResourceCurves(connection, pcCode);
    const budget = resolveBudget(ramBudgetMB, await fetchPcRamMB(connection, pcCode));
    const byModel = buildFitByModel(resourceRows, budget.ramBudgetMB);
    const m = byModel.get(model);
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
  } finally {
    connection.release();
  }
}

// Public: recommend the best-2 models for a collection (or all collections when none is
// given). A model is eligible only if it has >= MIN_OBSERVATIONS_FOR_SCORE scored runs on
// the collection and at least one context proven to fit the RAM budget.
export async function recommendModels({ collection = null, pcCode = null, ramBudgetMB = null, topN = 2 } = {}) {
  const connection = await pool.getConnection();
  try {
    const [resourceRows, scoreRows] = await Promise.all([
      fetchResourceCurves(connection, pcCode),
      fetchScoreCurves(connection, pcCode)
    ]);
    const budget = resolveBudget(ramBudgetMB, await fetchPcRamMB(connection, pcCode));
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

    return collection ? (recommendations[0] || { collection, best: [], allRanked: [], note: 'no scored runs for this collection on this machine', budget }) : recommendations;
  } finally {
    connection.release();
  }
}

// Resolve the RAM budget: an explicit override wins; otherwise take a fraction of the
// machine's total RAM (from the PcRAM observed in the data). Returns the budget plus how
// it was derived, so callers can show the basis.
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

// Read the machine's total RAM (in MB) from the most recent row that has a PcRAM value.
async function fetchPcRamMB(connection, pcCode) {
  const where = pcCode ? 'WHERE PcRAM IS NOT NULL AND PcCode = ?' : 'WHERE PcRAM IS NOT NULL';
  const params = pcCode ? [pcCode] : [];
  const [rows] = await connection.execute(
    `SELECT PcRAM FROM \`searches\` ${where} ORDER BY Id DESC LIMIT 1`,
    params
  );
  if (!rows.length) return null;
  return parseRamToMB(rows[0].PcRAM);
}
