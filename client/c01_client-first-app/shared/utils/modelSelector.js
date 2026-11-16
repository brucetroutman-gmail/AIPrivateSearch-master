// "Models" checkbox list for the AI Search page.
//
// One checkbox per installed search model. The models the recommender ranks best for the
// selected collection are PRE-CHECKED and marked with a star and their observed score
// (e.g. "gemma4:12b ★ 97"), so the recommendation is the starting state of the control the
// user already has to look at, not a separate hint. Any model can be checked or unchecked;
// the checked models are run one after another by ai-search.js (one model = one box).
//
// Pre-selection rules:
//   - collection has recommendations   -> those models are checked
//   - only a machine-wide ranking      -> those models are checked, labelled "all collections"
//   - no recommendation at all         -> the user's last saved choice, else the first model
// Boxes are re-applied whenever the collection changes. A recommendation that arrives after
// the user has already changed a box is shown (stars) but does not override their choice.
// Only the user's own edits are saved, and they are saved under their own key so the older
// single-model dropdown on other pages is not disturbed.
//
// All DOM is built with createElement/textContent (no innerHTML).

class ModelSelector {
  constructor() {
    this.containerId = 'modelCheckboxes';
    this.noteId = 'modelSelectionNote';
    this.buttonId = 'useRecommendedBtn';
    this.storageKey = 'selectedSearchModels';
    this.legacyKey = 'selectedSearchModel'; // read-only fallback (the old single dropdown)
    this.models = [];
    this._items = new Map();     // model -> { cb, badge }
    this.recommendation = null;  // { models, fallback } for the current collection, or null
    this._listeners = [];
    this._edits = 0;             // user edits so far (guards against late recommendations)
    this._seq = 0;               // guards against out-of-order recommendation responses
  }

  // Build the checkbox list from the installed search models.
  build(models) {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    this.models = Array.isArray(models) ? models.slice() : [];
    this._items = new Map();
    while (container.firstChild) container.removeChild(container.firstChild);

    if (this.models.length === 0) {
      const none = document.createElement('span');
      none.className = 'model-note';
      none.textContent = 'No search models are configured.';
      container.appendChild(none);
      this._updateNote();
      return;
    }

    const saved = this._loadSaved();
    const initial = saved.length ? saved : [this.models[0]];

    this.models.forEach(name => {
      const label = document.createElement('label');
      label.className = 'model-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'model-checkbox';
      cb.value = name;
      cb.checked = initial.includes(name);
      cb.addEventListener('change', () => {
        this._edits += 1;
        this._save();
        this._afterChange();
      });
      const text = document.createElement('span');
      text.className = 'model-name';
      text.textContent = name;
      const badge = document.createElement('span');
      badge.className = 'model-badge hidden';
      label.appendChild(cb);
      label.appendChild(text);
      label.appendChild(badge);
      container.appendChild(label);
      this._items.set(name, { cb, badge });
    });

    const btn = document.getElementById(this.buttonId);
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => this.useRecommended());
    }
    this._afterChange();
  }

  // Checked models, in list order.
  getSelected() {
    return this.models.filter(m => this._items.has(m) && this._items.get(m).cb.checked);
  }

  // Register a callback fired (with the checked models) whenever the selection changes.
  onChange(fn) {
    if (typeof fn === 'function') this._listeners.push(fn);
  }

  // Fetch the recommendation for a collection, mark the recommended models with a star and
  // score, and (unless the user has just edited the boxes) pre-check them.
  async applyRecommendation(collection) {
    const seq = ++this._seq;
    const editsAtStart = this._edits;
    const rm = window.recommendationManager;
    const rec = collection && rm ? await rm.fetchModelRecommendation(collection) : null;
    if (seq !== this._seq) return { applied: false, stale: true };

    const best = rec && Array.isArray(rec.best) ? rec.best : [];
    const usable = best.filter(b => this._items.has(b.model));
    this.recommendation = usable.length
      ? { models: usable.map(b => b.model), fallback: rec.fallback === 'all-collections' }
      : null;
    this._renderBadges(usable, rec && rec.fallback === 'all-collections');

    const untouched = this._edits === editsAtStart;
    if (untouched) {
      if (this.recommendation) {
        this._setChecks(this.recommendation.models);
      } else {
        const saved = this._loadSaved();
        this._setChecks(saved.length ? saved : (this.models.length ? [this.models[0]] : []));
      }
    }
    this._afterChange();
    return { applied: untouched, models: this.recommendation ? this.recommendation.models : [] };
  }

  // Re-check exactly the recommended models (after the user has changed the boxes).
  useRecommended() {
    if (!this.recommendation) return;
    this._setChecks(this.recommendation.models);
    this._afterChange();
  }

  // ---- internals ----
  _setChecks(list) {
    const want = new Set(list);
    this._items.forEach((item, name) => { item.cb.checked = want.has(name); });
  }

  _renderBadges(usable, isFallback) {
    const byModel = new Map(usable.map(b => [b.model, b]));
    this._items.forEach((item, name) => {
      const b = byModel.get(name);
      if (!b) {
        item.badge.textContent = '';
        item.badge.title = '';
        item.badge.classList.add('hidden');
        return;
      }
      item.badge.textContent = `★ ${Math.round(Number(b.avgScore))}`;
      item.badge.title = isFallback
        ? `Average score ${b.avgScore} across all collections (${b.runs} runs)`
        : `Average score ${b.avgScore} over ${b.runs} run(s) on this collection`;
      item.badge.classList.remove('hidden');
    });
  }

  _afterChange() {
    this._updateNote();
    const selected = this.getSelected();
    this._listeners.forEach(fn => { try { fn(selected); } catch (e) { console.error('[modelSelector] listener failed:', e); } });
  }

  _updateNote() {
    const note = document.getElementById(this.noteId);
    const btn = document.getElementById(this.buttonId);
    const selected = this.getSelected();

    if (note) {
      const parts = [];
      if (this.recommendation) {
        parts.push(this.recommendation.fallback
          ? '★ top models across all collections (no data for this collection yet).'
          : '★ recommended for this collection by observed score on this machine.');
      } else if (this.models.length) {
        parts.push('No benchmark data for recommendations yet.');
      }
      if (selected.length === 0) parts.push('Select at least one model.');
      else if (selected.length > 1) parts.push(`${selected.length} models selected; they run one after another.`);
      note.textContent = parts.join(' ');
    }

    if (btn) {
      const rec = this.recommendation ? this.recommendation.models : [];
      const same = rec.length === selected.length && rec.every(m => selected.includes(m));
      btn.classList.toggle('hidden', !(rec.length && !same));
    }
  }

  _save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.getSelected())); } catch { /* storage unavailable */ }
  }

  _loadSaved() {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(this.storageKey) || '[]'); } catch { arr = []; }
    if (!Array.isArray(arr) || arr.length === 0) {
      let legacy = null;
      try { legacy = localStorage.getItem(this.legacyKey); } catch { legacy = null; }
      arr = legacy ? [legacy] : [];
    }
    return arr.filter(m => this.models.includes(m));
  }
}

window.modelSelector = new ModelSelector();
