
import { DOMSanitizer } from './shared/utils/domSanitizer.js';

// Exact search methods only
const EXACT_METHODS = ['line-search', 'document-search'];

const searchQueryEl = document.getElementById('searchQuery');
const userPromptsEl = document.getElementById('userPrompts');
const searchAllBtn = document.getElementById('searchAllBtn');
const performanceSection = document.getElementById('performanceSection');
const performanceTableBody = document.getElementById('performanceTableBody');
const selectAllExactCheckbox = document.getElementById('selectAllExact');

const searchMethods = {
    'line-search': { name: 'Line Search' },
    'document-search': { name: 'Document Search' }
};

let performanceData = [];
let currentSort = { column: null, direction: 'asc' };

function renderResults(containerId, searchResult) {
    const container = document.getElementById(containerId);
    const collection = document.getElementById('collectionSelect').value;
    window.responseDisplayCommon.renderSearchResults(container, searchResult, collection);
}

function updatePerformanceTable(results) {
    performanceData = [];
    EXACT_METHODS.forEach(method => {
        if (results[method]) {
            const data = results[method];
            const avgScore = data.results.length > 0
                ? (data.results.reduce((sum, r) => sum + r.score, 0) / data.results.length)
                : 0;
            performanceData.push({
                method: searchMethods[method].name,
                results: data.results.length,
                time: data.time / 1000,
                score: avgScore
            });
        }
    });
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

    if (!query) { window.showUserMessage('Please enter a search query', 'error'); return; }
    if (!collection) { window.showUserMessage('Please select a collection', 'error'); return; }

    window._lastSearchQuery = query;
    if (window.logger) window.logger.crumb('search_submitted', { methods: getSelectedMethods().join(','), collection });

    searchAllBtn.textContent = 'Searching...';
    searchAllBtn.disabled = true;

    const selectedMethods = getSelectedMethods();
    if (selectedMethods.length === 0) {
        window.showUserMessage('Please select at least one search method', 'error');
        searchAllBtn.textContent = 'Search Selected Methods';
        searchAllBtn.disabled = false;
        return;
    }

    // Clear containers
    EXACT_METHODS.forEach(method => {
        const container = document.getElementById(`${method}-container`);
        while (container.firstChild) container.removeChild(container.firstChild);
        const notSelected = document.createElement('div');
        notSelected.className = 'no-results';
        notSelected.textContent = 'Not selected';
        container.appendChild(notSelected);
    });

    // Show loading for selected
    selectedMethods.forEach(method => {
        const container = document.getElementById(`${method}-container`);
        while (container.firstChild) container.removeChild(container.firstChild);
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.textContent = 'Searching...';
        container.appendChild(loading);
    });

    try {
        const searchPromises = [];
        const methodMap = {};
        selectedMethods.forEach(method => {
            const options = { collection, model: '', temperature: 0.3, contextSize: 1024, tokenLimit: 'No Limit' };
            searchPromises.push(window.searchManager.executeSearch(method, query, options));
            methodMap[method] = searchPromises.length - 1;
        });

        const results = await Promise.all(searchPromises);
        const perfData = {};
        Object.entries(methodMap).forEach(([method, index]) => {
            renderResults(`${method}-container`, results[index]);
            perfData[method] = results[index];
        });
        updatePerformanceTable(perfData);
    } catch (err) {
        if (window.logger) window.logger.crumb('search_error', { error: err?.message || 'unknown' });
        window.showUserMessage('Search failed. Please try again.', 'error');
    } finally {
        searchAllBtn.textContent = 'Search Selected Methods';
        searchAllBtn.disabled = false;
    }
}

function getSelectedMethods() {
    const selected = [];
    document.querySelectorAll('.method-checkbox').forEach(cb => {
        if (cb.checked) selected.push(cb.dataset.method);
    });
    return selected;
}

selectAllExactCheckbox.addEventListener('change', function() {
    document.querySelectorAll('#exactCheckboxes .method-checkbox').forEach(cb => {
        cb.checked = this.checked;
    });
    updateResultColumnVisibility();
    saveSelectedMethods();
});

function saveSelectedMethods() {
    localStorage.setItem('selectedExactMethods', JSON.stringify(getSelectedMethods()));
}

function restoreSelectedMethods() {
    const saved = localStorage.getItem('selectedExactMethods');
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
    const checkboxes = document.querySelectorAll('#exactCheckboxes .method-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const noneChecked = Array.from(checkboxes).every(cb => !cb.checked);
    selectAllExactCheckbox.checked = allChecked;
    selectAllExactCheckbox.indeterminate = !allChecked && !noneChecked;
}

searchAllBtn.addEventListener('click', performAllSearches);
searchQueryEl.addEventListener('keypress', e => { if (e.key === 'Enter') performAllSearches(); });
searchQueryEl.addEventListener('input', e => {
    const val = DOMSanitizer.sanitizeText(e.target.value);
    localStorage.setItem('exactSearchQuery', val);
});

async function loadCollections() {
    const collections = await window.searchManager.loadCollections();
    window.searchManager.populateSelect('collectionSelect', collections, 'selectedCollection');
    const collectionSelect = document.getElementById('collectionSelect');
    if (collectionSelect && !collectionSelect.hasAttribute('data-prompt-listener')) {
        collectionSelect.addEventListener('change', loadUserPrompts);
        collectionSelect.setAttribute('data-prompt-listener', 'true');
    }
    await loadUserPrompts();
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
                    localStorage.setItem('exactSearchQuery', this.value);
                }
            });
            userPromptsEl.setAttribute('data-listener-added', 'true');
        }
    } catch (e) {
        userPromptsEl.innerHTML = '<option value="">Failed to load prompts</option>';
    }
}

function buildCheckboxes() {
    const container = document.getElementById('exactCheckboxes');
    container.innerHTML = '';
    EXACT_METHODS.forEach(method => {
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

    const savedQuery = localStorage.getItem('exactSearchQuery');
    if (savedQuery) searchQueryEl.value = DOMSanitizer.sanitizeText(savedQuery);

    await loadCollections();

    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortPerformanceTable(th.dataset.sort));
    });
});
