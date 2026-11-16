// Client surface for the model/PC-aware recommender (step iii). Calls the read-only
// /api/recommender endpoints and drives two things on the AI Search page:
//
//   1. fetchModelRecommendation(): the best models for a collection, ranked by observed
//      weighted score on this machine and filtered to models that fit RAM. The Models
//      checkbox list (modelSelector.js) uses it to star and pre-check those models.
//
//   2. a context-fit note under the Context dropdown, refreshed when the checked models or
//      the context changes. It warns when the chosen context exceeds the largest value we
//      have actually observed to fit a model on this machine, surfacing the clamp that
//      otherwise happens silently server-side. With several models checked it names each
//      model that would be clamped.
//
// Everything here is advisory and best-effort: the recommender has no bearing on whether a
// search can run, so any fetch failure or cold-start ("unknown") hides the hint rather
// than blocking the user. All DOM is built with textContent (no innerHTML) to satisfy the
// security lint.

class RecommendationManager {
  constructor() {
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

  // Render the context-fit note into #contextFitNote for one model or a list of models.
  async renderContextFit(modelOrModels, requestedContext, elementId = 'contextFitNote') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const seq = ++this._fitSeq;
    const stale = () => seq !== this._fitSeq;

    const reset = () => {
      this._clear(el);
      el.classList.remove('fit-warn', 'fit-ok', 'fit-unknown');
    };
    reset();

    const models = (Array.isArray(modelOrModels) ? modelOrModels : [modelOrModels]).filter(Boolean);
    if (models.length === 0 || !requestedContext) {
      el.classList.add('hidden');
      return;
    }

    const advice = await Promise.all(models.map(m => this.fetchContextAdvice(m, requestedContext)));
    if (stale()) return;

    // Only models we have actually observed can be judged; never-seen models are skipped.
    const known = advice
      .map((a, i) => ({ model: models[i], a }))
      .filter(x => x.a && x.a.status === 'ok');
    if (known.length === 0) {
      el.classList.add('hidden');
      return;
    }

    reset();
    const clamped = known.filter(x => x.a.clamped);
    if (models.length === 1) {
      const { model, a } = known[0];
      if (a.clamped) {
        el.classList.add('fit-warn');
        el.textContent = `⚠ ${model} has only been observed to fit ${a.advisedContext} tokens on this machine; `
          + `${requestedContext} will be clamped down. Lower Context to ${a.advisedContext} to match.`;
      } else {
        el.classList.add('fit-ok');
        el.textContent = `✓ Context ${requestedContext} fits ${model} (proven to ${a.maxFitContext} on this machine).`;
      }
    } else if (clamped.length > 0) {
      el.classList.add('fit-warn');
      el.textContent = `⚠ Context ${requestedContext} will be clamped on this machine: `
        + clamped.map(x => `${x.model} → ${x.a.advisedContext}`).join(', ') + '.';
    } else {
      el.classList.add('fit-ok');
      el.textContent = `✓ Context ${requestedContext} fits every selected model.`;
    }
    el.classList.remove('hidden');
  }

  _clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
}

window.recommendationManager = new RecommendationManager();
