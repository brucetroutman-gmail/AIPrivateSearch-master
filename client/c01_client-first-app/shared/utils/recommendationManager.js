// Client surface for the model/PC-aware recommender (step iii). Calls the read-only
// /api/recommender endpoints and drives two things on the AI Search page:
//
//   1. a "Recommended Model List" entry in the Model(s) dropdown. It is refreshed when the
//      collection changes and is labelled with the models it stands for (ranked by observed
//      weighted score on this machine, filtered to models that fit RAM). Choosing it runs
//      each of those models in turn (the run loop lives in ai-search.js).
//
//   2. a context-fit note under the Context dropdown, refreshed when the model or context
//      changes, that warns when the chosen context exceeds the largest value we have
//      actually observed to fit a model on this machine — surfacing the clamp that
//      otherwise happens silently server-side. When "Recommended Model List" is chosen it
//      checks every model in that list.
//
// Everything here is advisory and best-effort: the recommender has no bearing on whether a
// search can run, so any fetch failure or cold-start ("unknown") disables/hides the hint
// rather than blocking the user. All DOM is built with createElement/textContent (no
// innerHTML) to satisfy the security lint.

// Value of the dropdown entry that stands for "the recommended models for this collection".
// It can never collide with a real model name (those contain no leading underscores).
const RECOMMENDED_VALUE = '__recommended__';

class RecommendationManager {
  constructor() {
    this.RECOMMENDED_VALUE = RECOMMENDED_VALUE;
    // Models the dropdown entry currently stands for (set by updateRecommendedOption).
    this.recommendedModels = [];
    // Guards against a slow response for an older selection overwriting a newer note.
    this._fitSeq = 0;
  }

  _qs(params) {
    const pairs = Object.entries(params).filter(([, v]) => v != null && v !== '');
    return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }

  // Fetch best-N models for a collection. The server answers from this machine's local
  // recommender store, so no machine identifier is needed.
  async fetchModelRecommendation(collection, topN = 2) {
    if (!collection) return null;
    const qs = this._qs({ collection, topN });
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/recommender/models?${qs}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Fetch context advice for a model + requested context.
  async fetchContextAdvice(model, requestedContext) {
    if (!model) return null;
    const qs = this._qs({ model, requestedContext });
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/recommender/context?${qs}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Pure: turn a /models response into the dropdown entry (label, models, disabled).
  describeRecommendedOption(rec) {
    const models = rec && Array.isArray(rec.best) ? rec.best.map(m => m.model).filter(Boolean) : [];
    if (models.length === 0) {
      return { models: [], disabled: true, label: 'Recommended Model List (none yet — run a benchmark)' };
    }
    // When this collection has no data of its own the server falls back to a machine-wide
    // ranking; say so rather than imply collection-specific evidence.
    const scope = rec.fallback === 'all-collections' ? ' (all collections)' : '';
    return { models, disabled: false, label: `Recommended Model List${scope}: ${models.join(', ')}` };
  }

  // Ensure the "Recommended Model List" entry exists in the Model(s) dropdown and reflects
  // the given collection. The entry is first in the list. If it is currently selected but
  // no longer has any models (e.g. the collection changed), the selection falls back to the
  // first real model so the dropdown never sits on a disabled entry.
  async updateRecommendedOption(collection, selectId = 'modelSelect') {
    const sel = document.getElementById(selectId);
    if (!sel) return null;

    const rec = collection ? await this.fetchModelRecommendation(collection) : null;
    const desc = this.describeRecommendedOption(rec);
    this.recommendedModels = desc.models;

    let opt = Array.from(sel.options).find(o => o.value === RECOMMENDED_VALUE);
    if (!opt) {
      opt = document.createElement('option');
      opt.value = RECOMMENDED_VALUE;
      sel.insertBefore(opt, sel.firstChild);
    }
    opt.textContent = desc.label;
    opt.disabled = desc.disabled;

    if (desc.disabled && sel.value === RECOMMENDED_VALUE) {
      const firstReal = Array.from(sel.options).find(o => o.value && o.value !== RECOMMENDED_VALUE && !o.disabled);
      sel.value = firstReal ? firstReal.value : '';
      sel.dispatchEvent(new Event('change'));
    }
    return desc;
  }

  // Render the context-fit note into #contextFitNote for the given model (or the
  // recommended list) + context.
  async renderContextFit(model, requestedContext, elementId = 'contextFitNote') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const seq = ++this._fitSeq;
    const stale = () => seq !== this._fitSeq;

    const reset = () => {
      this._clear(el);
      el.classList.remove('fit-warn', 'fit-ok', 'fit-unknown');
    };
    reset();

    if (!model || !requestedContext) {
      el.classList.add('hidden');
      return;
    }

    if (model === RECOMMENDED_VALUE) {
      await this._renderContextFitForList(el, this.recommendedModels, requestedContext, stale, reset);
      return;
    }

    const advice = await this.fetchContextAdvice(model, requestedContext);
    if (stale()) return;
    if (!advice || advice.status === 'unknown') {
      // No observed data for this model yet: cold start, stay silent.
      el.classList.add('hidden');
      return;
    }

    reset();
    if (advice.clamped) {
      el.classList.add('fit-warn');
      el.textContent = `⚠ ${model} has only been observed to fit ${advice.advisedContext} tokens on this machine; `
        + `${requestedContext} will be clamped down. Lower Context to ${advice.advisedContext} to match.`;
    } else {
      el.classList.add('fit-ok');
      el.textContent = `✓ Context ${requestedContext} fits ${model} (proven to ${advice.maxFitContext} on this machine).`;
    }
    el.classList.remove('hidden');
  }

  // Context-fit for every model in the recommended list: warn if any would be clamped.
  async _renderContextFitForList(el, models, requestedContext, stale, reset) {
    if (!models || models.length === 0) {
      el.classList.add('hidden');
      return;
    }
    const advice = await Promise.all(models.map(m => this.fetchContextAdvice(m, requestedContext)));
    if (stale()) return;

    const known = advice
      .map((a, i) => ({ model: models[i], a }))
      .filter(x => x.a && x.a.status === 'ok');
    if (known.length === 0) {
      el.classList.add('hidden');
      return;
    }

    reset();
    const clamped = known.filter(x => x.a.clamped);
    if (clamped.length > 0) {
      el.classList.add('fit-warn');
      el.textContent = `⚠ Context ${requestedContext} will be clamped on this machine: `
        + clamped.map(x => `${x.model} → ${x.a.advisedContext}`).join(', ') + '.';
    } else {
      el.classList.add('fit-ok');
      el.textContent = `✓ Context ${requestedContext} fits every recommended model.`;
    }
    el.classList.remove('hidden');
  }

  _clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
}

window.recommendationManager = new RecommendationManager();
