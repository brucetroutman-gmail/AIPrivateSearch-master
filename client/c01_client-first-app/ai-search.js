
import { DOMSanitizer } from './shared/utils/domSanitizer.js';

// AI search methods only
const AI_METHODS = ['smart-search', 'hybrid-search', 'ai-direct', 'ai-document-chat'];

const searchQueryEl = document.getElementById('searchQuery');
const userPromptsEl = document.getElementById('userPrompts');
const searchAllBtn = document.getElementById('searchAllBtn');
const performanceSection = document.getElementById('performanceSection');
const performanceTableBody = document.getElementById('performanceTableBody');
const selectAllAICheckbox = document.getElementById('selectAllAI');

// Query Intelligence Layer elements
const modeAutoRadio = document.getElementById('modeAuto');
const modeManualRadio = document.getElementById('modeManual');
const manualControlsSection = document.getElementById('manualControlsSection');
const autoControlsSection = document.getElementById('autoControlsSection');
const autoSearchBtn = document.getElementById('autoSearchBtn');
const smartSearchInfo = document.getElementById('smartSearchInfo');
const detectedTypeEl = document.getElementById('detectedType');
const selectedMethodEl = document.getElementById('selectedMethod');
const queryImprovedSection = document.getElementById('queryImprovedSection');
const improvedQueryEl = document.getElementById('improvedQuery');

const searchMethods = {
    'smart-search': { name: 'Smart Search' },
    'hybrid-search': { name: 'Hybrid Search' },
    'ai-direct': { name: 'AI Direct' },
    'ai-document-chat': { name: 'AI Document Chat' }
};

let performanceData = [];
let currentSort = { column: null, direction: 'asc' };

// Value of the "Recommended Model List" entry in the Model(s) dropdown (see
// recommendationManager.js). Choosing it runs each recommended model in turn.
const RECOMMENDED_MODELS_VALUE = '__recommended__';

function renderResultsInto(element, searchResult) {
    const collection = document.getElementById('collectionSelect').value;
    window.responseDisplayCommon.renderSearchResults(element, searchResult, collection);
}

// Resolve the Model(s) dropdown into the models to run. A real model runs alone; the
// recommended-list entry expands to the current recommendation for the collection. It is
// fetched fresh, so it reflects any benchmark run since the dropdown was last refreshed.
async function resolveModelsToRun(collection, selectedValue) {
    if (selectedValue !== RECOMMENDED_MODELS_VALUE) {
        return { models: [selectedValue], recommended: false };
    }
    const rec = window.recommendationManager
        ? await window.recommendationManager.fetchModelRecommendation(collection)
        : null;
    const models = rec && Array.isArray(rec.best) ? rec.best.map(m => m.model).filter(Boolean) : [];
    return { models, recommended: true };
}

function setStatus(element, text) {
    while (element.firstChild) element.removeChild(element.firstChild);
    const status = document.createElement('div');
    status.className = 'loading';
    status.textContent = text;
    element.appendChild(status);
}

// Prepare each selected method's result column for the models about to run. With several
// models each gets its own headed section so every result stays attributable to a model;
// with a single model the container is used directly, exactly as before.
function prepareModelSections(methods, models, multi) {
    const sections = {}; // method -> Map(model -> element to render into)
    methods.forEach(method => {
        const container = document.getElementById(`${method}-container`);
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);
        const byModel = new Map();
        models.forEach((model, i) => {
            let body = container;
            if (multi) {
                const section = document.createElement('div');
                section.className = 'model-result-section';
                const heading = document.createElement('h4');
                heading.className = 'model-result-heading';
                heading.textContent = `Model: ${model}`;
                body = document.createElement('div');
                section.appendChild(heading);
                section.appendChild(body);
                container.appendChild(section);
            }
            setStatus(body, i === 0 ? 'Searching...' : 'Waiting...');
            byModel.set(model, body);
        });
        sections[method] = byModel;
    });
    return sections;
}

// Run the models ONE AFTER ANOTHER, never in parallel: on a 16 GB machine two large models
// resident at once would evict each other and thrash memory. The selected methods for a
// single model still run together, as before. Returns the rows for the performance table.
async function runModels({ models, multi, methods, query, baseOptions, sections }) {
    const rows = [];
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        if (i > 0) {
            methods.forEach(method => {
                const body = sections[method] && sections[method].get(model);
                if (body) setStatus(body, 'Searching...');
            });
        }
        const results = await Promise.all(methods.map(method =>
            window.searchManager.executeSearch(method, query, { ...baseOptions, model })));
        methods.forEach((method, idx) => {
            const body = sections[method] && sections[method].get(model);
            if (body) renderResultsInto(body, results[idx]);
            rows.push({
                label: multi ? `${searchMethods[method].name} · ${model}` : searchMethods[method].name,
                data: results[idx]
            });
        });
    }
    return rows;
}

// rows: [{ label, data }] where data is a search result ({ results, time }).
function updatePerformanceTableRows(rows) {
    performanceData = rows.map(({ label, data }) => ({
        method: label,
        results: data.results.length,
        time: data.time / 1000,
        score: data.results.length > 0
            ? (data.results.reduce((sum, r) => sum + r.score, 0) / data.results.length)
            : 0
    }));
    renderPerformanceTable();
    performanceSection.classList.remove('hidden');
    performanceSection.style.display = 'block';
}

function renderPerformanceTable() {
    while (performanceTableBody.firstChild) {
        performanceTableBody.removeChild(performanceTableBody.firstChild);
    }
    performanceData.forEach(data => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td'); nameCell.textContent = data.method;
        const countCell = document.createElement('td'); countCell.textContent = data.results;
        const timeCell = document.createElement('td'); timeCell.textContent = `${data.time.toFixed(2)}s`;
        const scoreCell = document.createElement('td'); scoreCell.textContent = data.score.toFixed(2);
        row.appendChild(nameCell); row.appendChild(countCell);
        row.appendChild(timeCell); row.appendChild(scoreCell);
        performanceTableBody.appendChild(row);
    });
}

function sortPerformanceTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    document.querySelectorAll('.sortable').forEach(th => th.classList.remove('asc', 'desc'));
    document.querySelector(`[data-sort="${column}"]`).classList.add(currentSort.direction);
    performanceData.sort((a, b) => {
        let aVal = a[column], bVal = b[column];
        if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
        return currentSort.direction === 'asc'
            ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
            : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    });
    renderPerformanceTable();
}

async function performAllSearches() {
    const query = DOMSanitizer.sanitizeText(searchQueryEl.value.trim());
    const collection = DOMSanitizer.sanitizeText(document.getElementById('collectionSelect').value);
    const rawModel = document.getElementById('modelSelect').value;
    // The recommended-list entry is compared on its raw value; real models are sanitized as before.
    const model = rawModel === RECOMMENDED_MODELS_VALUE ? rawModel : DOMSanitizer.sanitizeText(rawModel);
    const temperatureEl = document.getElementById('temperatureSelect');
    const contextEl = document.getElementById('contextSelect');
    const tokensEl = document.getElementById('tokensSelect');
    const topK = parseInt(document.getElementById('topKSelect')?.value || '10');
    const temperature = parseFloat(temperatureEl?.value || '0.3');
    const contextSize = parseInt(contextEl?.value || '4096');
    const tokenLimit = DOMSanitizer.sanitizeText(tokensEl?.value || 'No Limit');

    if (!query) { window.showUserMessage('Please enter a search query', 'error'); return; }
    if (!collection) { window.showUserMessage('Please select a collection', 'error'); return; }
    if (!model) { window.showUserMessage('Please select a model', 'error'); return; }

    window._lastSearchQuery = query;
    if (window.logger) window.logger.crumb('search_submitted', { methods: getSelectedMethods().join(','), collection, model, temperature, contextSize });

    searchAllBtn.textContent = 'Searching...';
    searchAllBtn.disabled = true;

    const restoreButton = () => {
        searchAllBtn.textContent = 'Search Selected Methods';
        searchAllBtn.disabled = false;
    };

    const selectedMethods = getSelectedMethods();
    if (selectedMethods.length === 0) {
        window.showUserMessage('Please select at least one search method', 'error');
        restoreButton();
        return;
    }

    try {
        const plan = await resolveModelsToRun(collection, model);
        if (plan.models.length === 0) {
            window.showUserMessage('No recommended models yet for this collection. Run a benchmark from the collection editor, or choose a model.', 'error');
            return;
        }

        // Clear containers
        AI_METHODS.forEach(method => {
            const container = document.getElementById(`${method}-container`);
            while (container.firstChild) container.removeChild(container.firstChild);
            const notSelected = document.createElement('div');
            notSelected.className = 'no-results';
            notSelected.textContent = 'Not selected';
            container.appendChild(notSelected);
        });

        // Show loading for the selected methods (one section per model when running several)
        const sections = prepareModelSections(selectedMethods, plan.models, plan.recommended);

        const rows = await runModels({
            models: plan.models,
            multi: plan.recommended,
            methods: selectedMethods,
            query,
            baseOptions: { collection, temperature, contextSize, tokenLimit, topK },
            sections
        });
        updatePerformanceTableRows(rows);
    } catch (err) {
        if (window.logger) window.logger.crumb('search_error', { error: err?.message || 'unknown' });
        window.showUserMessage('Search failed. Please try again.', 'error');
    } finally {
        restoreButton();
    }
}
// Handle search mode toggle (Auto vs Advanced)
function handleModeChange() {
    const isAutoMode = modeAutoRadio && modeAutoRadio.checked;

    if (manualControlsSection) {
        manualControlsSection.classList.toggle('hidden', isAutoMode);
    }
    if (autoControlsSection) {
        autoControlsSection.classList.toggle('hidden', !isAutoMode);
    }
    // Hide the multi-method comparison table when switching to Auto mode
    if (performanceSection && isAutoMode) {
        performanceSection.classList.add('hidden');
        performanceSection.style.display = 'none';
    }
    if (window.logger) window.logger.log(`[Mode] Switched to ${isAutoMode ? 'Auto' : 'Advanced'} mode`);
}

// Display query intelligence metadata in the Smart Search Details panel
function displayQueryMetadata(metadata, resolvedMethod) {
    if (!metadata || !smartSearchInfo) return;

    if (metadata.intelligenceUsed && !metadata.testMode) {
        smartSearchInfo.classList.remove('hidden');

        // Detected query type badge
        if (detectedTypeEl && metadata.detectedType) {
            const badge = document.createElement('span');
            badge.className = `badge badge-${metadata.detectedType}`;
            badge.textContent = metadata.detectedType;
            detectedTypeEl.textContent = '';
            detectedTypeEl.appendChild(badge);
        }

        // Selected method
        if (selectedMethodEl) {
            selectedMethodEl.textContent = '';
            const methodName = (searchMethods[resolvedMethod] && searchMethods[resolvedMethod].name) || resolvedMethod || 'unknown';
            selectedMethodEl.appendChild(document.createTextNode(`${methodName} `));
            if (metadata.autoSelectedMethod) {
                const methodBadge = document.createElement('span');
                methodBadge.className = 'badge badge-auto';
                methodBadge.textContent = 'auto-selected';
                selectedMethodEl.appendChild(methodBadge);
            }
        }

        // Query improvement
        if (metadata.wasImproved && queryImprovedSection && improvedQueryEl) {
            queryImprovedSection.classList.remove('hidden');
            improvedQueryEl.textContent = metadata.improvedQuery || '';
        } else if (queryImprovedSection) {
            queryImprovedSection.classList.add('hidden');
        }
    } else {
        smartSearchInfo.classList.add('hidden');
    }
}

// Auto mode: analyze the query, then run the single recommended method
async function performAutoSearch() {
    const query = DOMSanitizer.sanitizeText(searchQueryEl.value.trim());
    const collection = DOMSanitizer.sanitizeText(document.getElementById('collectionSelect').value);
    const rawModel = document.getElementById('modelSelect').value;
    // The recommended-list entry is compared on its raw value; real models are sanitized as before.
    const model = rawModel === RECOMMENDED_MODELS_VALUE ? rawModel : DOMSanitizer.sanitizeText(rawModel);
    const temperatureEl = document.getElementById('temperatureSelect');
    const contextEl = document.getElementById('contextSelect');
    const tokensEl = document.getElementById('tokensSelect');
    const topK = parseInt(document.getElementById('topKSelect')?.value || '10');
    const temperature = parseFloat(temperatureEl?.value || '0.3');
    const contextSize = parseInt(contextEl?.value || '4096');
    const tokenLimit = DOMSanitizer.sanitizeText(tokensEl?.value || 'No Limit');

    if (!query) { window.showUserMessage('Please enter a search query', 'error'); return; }
    if (!collection) { window.showUserMessage('Please select a collection', 'error'); return; }
    if (!model) { window.showUserMessage('Please select a model', 'error'); return; }

    window._lastSearchQuery = query;
    if (window.logger) window.logger.crumb('auto_search_submitted', { collection, model, temperature, contextSize });

    autoSearchBtn.textContent = 'Analyzing...';
    autoSearchBtn.disabled = true;
    if (smartSearchInfo) smartSearchInfo.classList.add('hidden');

    try {
        // Resolve the model(s) first so an empty recommendation fails fast, before any work.
        const plan = await resolveModelsToRun(collection, model);
        if (plan.models.length === 0) {
            window.showUserMessage('No recommended models yet for this collection. Run a benchmark from the collection editor, or choose a model.', 'error');
            return;
        }

        // Step 1: Analyze query via intelligence endpoint
        const analyzeRes = await window.csrfManager.fetch(`${window.API_BASE_URL}/api/search/analyze-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        if (!analyzeRes.ok) throw new Error(`Analysis failed (${analyzeRes.status})`);
        const analysis = await analyzeRes.json();

        // Resolve method and effective query
        let method = analysis.recommendedMethod;
        if (!AI_METHODS.includes(method)) {
            // Intelligence may recommend a non-AI method; on the AI page fall back to hybrid-search
            method = 'hybrid-search';
        }
        const wasImproved = analysis.improved && analysis.improved.wasImproved;
        const effectiveQuery = wasImproved ? analysis.improved.enhanced : query;

        // Build metadata for display (mirrors the main search route's queryMetadata shape)
        const metadata = {
            intelligenceUsed: true,
            testMode: false,
            detectedType: analysis.analysis ? analysis.analysis.type : null,
            autoSelectedMethod: true,
            wasImproved: !!wasImproved,
            improvedQuery: wasImproved ? analysis.improved.enhanced : null
        };
        displayQueryMetadata(metadata, method);

        // Step 2: Run only the recommended method (once per model)
        autoSearchBtn.textContent = 'Searching...';

        // Show only the selected method's result column
        document.querySelectorAll('.result-column').forEach(col => { col.style.display = 'none'; });
        const activeCol = document.getElementById(`${method}-results`);
        if (activeCol) activeCol.style.display = 'block';

        const sections = prepareModelSections([method], plan.models, plan.recommended);

        const rows = await runModels({
            models: plan.models,
            multi: plan.recommended,
            methods: [method],
            query: effectiveQuery,
            baseOptions: { collection, temperature, contextSize, tokenLimit, topK },
            sections
        });
        updatePerformanceTableRows(rows);
    } catch (err) {
        if (window.logger) window.logger.crumb('auto_search_error', { error: err?.message || 'unknown' });
        window.showUserMessage('Auto search failed. Please try again.', 'error');
    } finally {
        autoSearchBtn.textContent = 'Search';
        autoSearchBtn.disabled = false;
    }
}

function getSelectedMethods() {
    const selected = [];
    document.querySelectorAll('.method-checkbox').forEach(cb => {
        if (cb.checked) selected.push(cb.dataset.method);
    });
    return selected;
}

selectAllAICheckbox.addEventListener('change', function() {
    document.querySelectorAll('#aiCheckboxes .method-checkbox').forEach(cb => {
        cb.checked = this.checked;
    });
    updateResultColumnVisibility();
    saveSelectedMethods();
});

function saveSelectedMethods() {
    localStorage.setItem('selectedAIMethods', JSON.stringify(getSelectedMethods()));
}

function restoreSelectedMethods() {
    const saved = localStorage.getItem('selectedAIMethods');
    if (saved) {
        try {
            const selectedMethods = JSON.parse(saved);
            document.querySelectorAll('.method-checkbox').forEach(cb => {
                cb.checked = selectedMethods.includes(cb.dataset.method);
            });
            updateSelectAllState();
            updateResultColumnVisibility();
        } catch (e) {
            console.error('Failed to restore selected methods:', e);
        }
    }
}

function updateResultColumnVisibility() {
    const selectedMethods = getSelectedMethods();
    document.querySelectorAll('.result-column').forEach(col => col.style.display = 'none');
    selectedMethods.forEach(method => {
        const col = document.getElementById(`${method}-results`);
        if (col) col.style.display = 'block';
    });
}

function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('#aiCheckboxes .method-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const noneChecked = Array.from(checkboxes).every(cb => !cb.checked);
    selectAllAICheckbox.checked = allChecked;
    selectAllAICheckbox.indeterminate = !allChecked && !noneChecked;
}

searchAllBtn.addEventListener('click', performAllSearches);
searchQueryEl.addEventListener('keypress', e => {
    if (e.key === 'Enter' && (!modeAutoRadio || !modeAutoRadio.checked)) performAllSearches();
});
searchQueryEl.addEventListener('input', e => {
    const val = DOMSanitizer.sanitizeText(e.target.value);
    localStorage.setItem('aiSearchQuery', val);
});

async function loadCollections() {
    const collections = await window.searchManager.loadCollections();
    window.searchManager.populateSelect('collectionSelect', collections, 'selectedCollection');
    const collectionSelect = document.getElementById('collectionSelect');
    if (collectionSelect && !collectionSelect.hasAttribute('data-prompt-listener')) {
        collectionSelect.addEventListener('change', loadUserPrompts);
        collectionSelect.addEventListener('change', async () => {
            // Auto-fill params first, then recompute recommendations so the context-fit
            // note reads the freshly auto-filled context value, not the previous one.
            await window.parameterManager.onCollectionChange(collectionSelect.value);
            refreshRecommendations();
        });
        collectionSelect.setAttribute('data-prompt-listener', 'true');
    }
    await loadUserPrompts();
    // Apply collection settings for initially selected collection
    if (collectionSelect.value) {
        await window.parameterManager.onCollectionChange(collectionSelect.value);
    }
    refreshRecommendations();
}

async function loadModels() {
    const models = await window.searchManager.loadModels('search');
    window.searchManager.populateSelect('modelSelect', models, 'selectedSearchModel');
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect && !modelSelect.hasAttribute('data-fit-listener')) {
        // populateSelect saves every selection, including the recommended-list entry. Keep the
        // last REAL model in storage instead, so a reload restores a model that exists.
        let lastRealModel = modelSelect.value && modelSelect.value !== RECOMMENDED_MODELS_VALUE ? modelSelect.value : null;
        modelSelect.addEventListener('change', () => {
            if (modelSelect.value === RECOMMENDED_MODELS_VALUE) {
                if (lastRealModel) localStorage.setItem('selectedSearchModel', lastRealModel);
            } else {
                lastRealModel = modelSelect.value;
            }
        });
        modelSelect.addEventListener('change', refreshContextFit);
        modelSelect.setAttribute('data-fit-listener', 'true');
    }
    const contextSelect = document.getElementById('contextSelect');
    if (contextSelect && !contextSelect.hasAttribute('data-fit-listener')) {
        contextSelect.addEventListener('change', refreshContextFit);
        contextSelect.setAttribute('data-fit-listener', 'true');
    }
    // populateSelect rebuilt the options, so (re)add the Recommended Model List entry.
    refreshRecommendations();
}

// Model/PC-aware recommender: keeps the "Recommended Model List" dropdown entry and the
// context-fit note current. Best-effort; never blocks the user.
async function refreshRecommendations() {
    const collection = document.getElementById('collectionSelect')?.value;
    if (window.recommendationManager) {
        await window.recommendationManager.updateRecommendedOption(collection);
    }
    refreshContextFit();
}

function refreshContextFit() {
    if (!window.recommendationManager) return;
    const model = document.getElementById('modelSelect')?.value;
    const context = parseInt(document.getElementById('contextSelect')?.value || '0', 10);
    window.recommendationManager.renderContextFit(model, context || null);
}

async function loadUserPrompts() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/config/user-prompts.json`);
        const data = await response.json();
        userPromptsEl.innerHTML = '<option value="">Select a prompt...</option>';
        const collection = document.getElementById('collectionSelect').value;
        if (collection && data.local_documents && data.local_documents[collection]) {
            data.local_documents[collection].forEach(prompt => {
                const option = document.createElement('option');
                option.value = prompt.prompt;
                option.textContent = prompt.name;
                userPromptsEl.appendChild(option);
            });
        }
        if (!userPromptsEl.hasAttribute('data-listener-added')) {
            userPromptsEl.addEventListener('change', function() {
                if (this.value) {
                    searchQueryEl.value = this.value;
                    localStorage.setItem('aiSearchQuery', this.value);
                }
            });
            userPromptsEl.setAttribute('data-listener-added', 'true');
        }
    } catch (e) {
        userPromptsEl.innerHTML = '<option value="">Failed to load prompts</option>';
    }
}

function setupParameterPersistence() {
    // Dropdowns are loaded and persisted by parameterManager.loadAllDropdowns()
}

function buildCheckboxes() {
    const container = document.getElementById('aiCheckboxes');
    container.innerHTML = '';
    AI_METHODS.forEach(method => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'method-checkbox';
        checkbox.dataset.method = method;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + searchMethods[method].name));
        container.appendChild(label);
        checkbox.addEventListener('change', () => {
            updateSelectAllState();
            updateResultColumnVisibility();
            saveSelectedMethods();
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    buildCheckboxes();
    restoreSelectedMethods();
    updateResultColumnVisibility();

    const savedQuery = localStorage.getItem('aiSearchQuery');
    if (savedQuery) searchQueryEl.value = DOMSanitizer.sanitizeText(savedQuery);

    await loadCollections();
    loadModels();
    await window.parameterManager.loadAllDropdowns({
      temperature: 'temperatureSelect',
      context: 'contextSelect',
      tokens: 'tokensSelect',
      topk: 'topKSelect'
    });
    setupParameterPersistence();

    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortPerformanceTable(th.dataset.sort));
    });

    // Query Intelligence: wire mode toggle and auto search
    if (modeAutoRadio && modeManualRadio) {
        modeAutoRadio.addEventListener('change', handleModeChange);
        modeManualRadio.addEventListener('change', handleModeChange);
        handleModeChange();
    }
    if (autoSearchBtn) {
        autoSearchBtn.addEventListener('click', performAutoSearch);
    }
    searchQueryEl.addEventListener('keypress', e => {
        if (e.key === 'Enter' && modeAutoRadio && modeAutoRadio.checked) {
            e.preventDefault();
            performAutoSearch();
        }
    });
});
