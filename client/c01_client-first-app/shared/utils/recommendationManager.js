// Client surface for the model/PC-aware recommender (step iii). Calls the read-only
// /api/recommender endpoints and renders two unobtrusive hints on the search page:
//
//   1. a "best models for this collection" line under the model dropdown, refreshed when
//      the collection changes, so the user has an evidence-based starting point for which
//      model to run (ranked by observed weighted score, filtered to models that fit RAM).
//
//   2. a context-fit note under the Context dropdown, refreshed when the model or context
//      changes, that warns when the chosen context exceeds the largest value we have
//      actually observed to fit this model on this machine — surfacing the clamp that
//      otherwise happens silently server-side.
//
// Everything here is advisory and best-effort: the recommender has no bearing on whether a
// search can run, so any fetch failure or cold-start ("unknown") hides the hint rather
// than blocking the user. All DOM is built with createElement/textContent (no innerHTML)
// to satisfy the security lint.

class RecommendationManager {
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

  // Render the collection model recommendation into #modelRecommendation.
  async renderModelRecommendation(collection, elementId = 'modelRecommendation') {
    const el = document.getElementById(elementId);
    if (!el) return;
    this._clear(el);

    const rec = await this.fetchModelRecommendation(collection);
    const best = rec && Array.isArray(rec.best) ? rec.best : [];
    if (!collection || best.length === 0) {
      // No data anywhere yet: stay silent rather than show a misleading hint.
      el.classList.add('hidden');
      return;
    }

    const isFallback = rec.fallback === 'all-collections';
    const label = document.createElement('span');
    label.className = 'rec-label';
    label.textContent = isFallback
      ? 'No data for this collection yet. Top models across all collections: '
      : 'Recommended for this collection: ';
    el.appendChild(label);

    best.forEach((m, i) => {
      if (i > 0) el.appendChild(document.createTextNode(', '));
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'rec-model-chip';
      chip.textContent = `${m.model} (${Math.round(m.avgScore)})`;
      chip.title = `Avg score ${m.avgScore} over ${m.runs} run(s)`
        + (m.collections ? ` across ${m.collections} collection(s)` : '')
        + (m.maxFitContext ? `; proven-fit context ${m.maxFitContext}` : '');
      // Clicking a chip selects that model in the dropdown and re-checks the context fit.
      chip.addEventListener('click', () => {
        const modelSel = document.getElementById('modelSelect');
        if (modelSel) {
          modelSel.value = m.model;
          modelSel.dispatchEvent(new Event('change'));
        }
      });
      el.appendChild(chip);
    });

    const note = document.createElement('span');
    note.className = 'rec-note';
    note.textContent = isFallback
      ? ' (benchmark this collection for a specific recommendation)'
      : ' (by observed score on this machine)';
    el.appendChild(note);

    el.classList.remove('hidden');
  }

  // Render the context-fit note into #contextFitNote for the given model + context.
  async renderContextFit(model, requestedContext, elementId = 'contextFitNote') {
    const el = document.getElementById(elementId);
    if (!el) return;
    this._clear(el);
    el.classList.remove('fit-warn', 'fit-ok', 'fit-unknown');

    if (!model) {
      el.classList.add('hidden');
      return;
    }

    const advice = await this.fetchContextAdvice(model, requestedContext);
    if (!advice || advice.status === 'unknown') {
      // No observed data for this model yet: cold start, stay silent.
      el.classList.add('hidden');
      return;
    }

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

  _clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
}

window.recommendationManager = new RecommendationManager();
