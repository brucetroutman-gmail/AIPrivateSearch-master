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
  constructor() {
    this._pcCode = undefined; // undefined = not yet fetched; null = unavailable
  }

  // Resolve this machine's PcCode once so recommendations are scoped to the PC the user is
  // actually on. If it cannot be determined, requests omit pcCode and the server falls
  // back to all-machine data rather than failing.
  async _getPcCode() {
    if (this._pcCode !== undefined) return this._pcCode;
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/system-info`);
      if (res.ok) {
        const data = await res.json();
        // Treat the server's 'Unknown' sentinel as "no PcCode" so requests fall back to
        // all-machine data rather than querying for a PcCode that never appears in rows.
        this._pcCode = data.pcCode && data.pcCode !== 'Unknown' ? data.pcCode : null;
      } else {
        this._pcCode = null;
      }
    } catch {
      this._pcCode = null;
    }
    return this._pcCode;
  }

  _qs(params) {
    const pairs = Object.entries(params).filter(([, v]) => v != null && v !== '');
    return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }

  // Fetch best-N models for a collection, scoped to this PC.
  async fetchModelRecommendation(collection, topN = 2) {
    if (!collection) return null;
    const pcCode = await this._getPcCode();
    const qs = this._qs({ collection, pcCode, topN });
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/recommender/models?${qs}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Fetch context advice for a model + requested context, scoped to this PC.
  async fetchContextAdvice(model, requestedContext) {
    if (!model) return null;
    const pcCode = await this._getPcCode();
    const qs = this._qs({ model, requestedContext, pcCode });
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
      // Cold start or no data: say so quietly rather than showing a misleading hint.
      el.classList.add('hidden');
      return;
    }

    const label = document.createElement('span');
    label.className = 'rec-label';
    label.textContent = 'Recommended for this collection: ';
    el.appendChild(label);

    best.forEach((m, i) => {
      if (i > 0) el.appendChild(document.createTextNode(', '));
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'rec-model-chip';
      chip.textContent = `${m.model} (${Math.round(m.avgScore)})`;
      chip.title = `Avg score ${m.avgScore} over ${m.runs} run(s); proven-fit context ${m.maxFitContext}`;
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
    note.textContent = ' (by observed score on this machine)';
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
