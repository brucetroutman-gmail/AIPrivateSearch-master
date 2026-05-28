// Unified parameter management for AI search dropdowns
class ParameterManager {
  constructor() {}

  async loadConfig(configFile) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/config/${configFile}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to load ${configFile}:`, error);
      return {};
    }
  }

  // Load and populate all 4 dropdowns from config JSON files
  // elementIds allows pages with different ID conventions to use the same loader
  async loadAllDropdowns(elementIds = {}) {
    const ids = {
      temperature: elementIds.temperature || 'temperatureSelect',
      context:     elementIds.context     || 'contextSelect',
      tokens:      elementIds.tokens      || 'tokensSelect',
      topk:        elementIds.topk        || 'topKSelect'
    };

    const [tempData, contextData, tokensData, topkData] = await Promise.all([
      this.loadConfig('temperature.json'),
      this.loadConfig('context.json'),
      this.loadConfig('tokens.json'),
      this.loadConfig('topk.json')
    ]);

    this._populate(ids.temperature, tempData.temperature || [], 'value', 'name', 'lastTemperature');
    this._populate(ids.context,     contextData.context   || [], 'name',  'name', 'lastContext');
    this._populate(ids.tokens,      tokensData.tokens     || [], 'value', 'name', 'lastTokens');
    this._populate(ids.topk,        topkData.topk         || [], 'value', 'name', 'lastTopK');

    // Store current IDs for applyCollectionSettings
    this._currentIds = ids;
  }

  _populate(elementId, options, valueKey, textKey, storageKey) {
    const el = document.getElementById(elementId);
    if (!el || !options.length) return;

    el.textContent = '';
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt[valueKey] ?? opt;
      o.textContent = opt[textKey] ?? opt;
      el.appendChild(o);
    });

    const saved = localStorage.getItem(storageKey);
    if (saved) el.value = saved;

    el.addEventListener('change', () => localStorage.setItem(storageKey, el.value));
  }

  // Apply collection searchSettings to all 4 dropdowns, overwriting user's last value
  applyCollectionSettings(settings) {
    if (!settings) return;
    const ids = this._currentIds || {
      temperature: 'temperatureSelect', context: 'contextSelect',
      tokens: 'tokensSelect', topk: 'topKSelect'
    };
    const map = [
      { id: ids.temperature, value: settings.temperature,                    key: 'lastTemperature' },
      { id: ids.context,     value: settings.contextSize,                    key: 'lastContext' },
      { id: ids.tokens,      value: settings.tokenLimit ?? '1024',          key: 'lastTokens' },
      { id: ids.topk,        value: settings.topK,                           key: 'lastTopK' }
    ];
    map.forEach(({ id, value, key }) => {
      if (value == null) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.value = String(value);
      localStorage.setItem(key, String(value));
    });
  }

  // Fetch collection searchSettings and apply to dropdowns
  async onCollectionChange(collection) {
    if (!collection) return;
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/documents/collections/${encodeURIComponent(collection)}/files`);
      const data = await response.json();
      if (data.searchSettings) {
        this.applyCollectionSettings(data.searchSettings);
        console.log(`[parameterManager] Applied settings for ${collection}:`, data.searchSettings);
      }
    } catch (error) {
      console.warn(`[parameterManager] Could not load settings for ${collection}:`, error.message);
    }
  }

  // Legacy: keep setupPersistence for any existing callers
  setupPersistence(elementConfigs) {
    elementConfigs.forEach(({ elementId, storageKey }) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      const saved = localStorage.getItem(storageKey);
      if (saved) el.value = saved;
      el.addEventListener('change', () => localStorage.setItem(storageKey, el.value));
    });
  }
}

window.parameterManager = new ParameterManager();
