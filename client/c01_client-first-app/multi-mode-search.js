
// Security: HTML sanitization function
function sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

import { DOMSanitizer } from './shared/utils/domSanitizer.js';

// Multi-mode search functionality

// DOM elements
const searchQueryEl = document.getElementById('searchQuery');
const userPromptsEl = document.getElementById('userPrompts');
const searchAllBtn = document.getElementById('searchAllBtn');

const performanceSection = document.getElementById('performanceSection');
const performanceTableBody = document.getElementById('performanceTableBody');
const selectAllNonAICheckbox = document.getElementById('selectAllNonAI');
const selectAllAICheckbox = document.getElementById('selectAllAI');
const methodCheckboxes = document.querySelectorAll('.method-checkbox');

// Search methods configuration (names only - endpoints are hardcoded in functions)
const searchMethods = {
    'document-index': { name: 'Document Index Cards' },
    'line-search': { name: 'Line Search' },
    'document-search': { name: 'Document Search' },
    'smart-search': { name: 'Smart Search' },
    'hybrid-search': { name: 'Hybrid Search' },
    'ai-direct': { name: 'AI Direct' },
    'ai-document-chat': { name: 'AI Document Chat' }
};

// Real API search functions
// All search functions now use the unified search manager

// Render results for a specific method using common utility
function renderResults(containerId, searchResult) {
    const container = document.getElementById(containerId);
    const collection = document.getElementById('collectionSelect').value;
    window.responseDisplayCommon.renderSearchResults(container, searchResult, collection);
}



// Store performance data for sorting
let performanceData = [];
let currentSort = { column: null, direction: 'asc' };

// Update performance table
function updatePerformanceTable(results) {
    // Store data for sorting
    performanceData = [];
    const orderedMethods = Object.keys(searchMethods);
    orderedMethods.forEach(method => {
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

// Render performance table
function renderPerformanceTable() {
    while (performanceTableBody.firstChild) {
        performanceTableBody.removeChild(performanceTableBody.firstChild);
    }
    
    performanceData.forEach(data => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = data.method;
        
        const countCell = document.createElement('td');
        countCell.textContent = data.results;
        
        const timeCell = document.createElement('td');
        timeCell.textContent = `${data.time.toFixed(2)}s`;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = data.score.toFixed(2);
        
        row.appendChild(nameCell);
        row.appendChild(countCell);
        row.appendChild(timeCell);
        row.appendChild(scoreCell);
        
        performanceTableBody.appendChild(row);
    });
}

// Sort performance table
function sortPerformanceTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Update header styles
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
    });
    document.querySelector(`[data-sort="${column}"]`).classList.add(currentSort.direction);
    
    // Sort data
    performanceData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (currentSort.direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });
    
    renderPerformanceTable();
}

// Main search function
async function performAllSearches() {
    const query = DOMSanitizer.sanitizeText(searchQueryEl.value.trim());
    const collection = DOMSanitizer.sanitizeText(document.getElementById('collectionSelect').value);
    const model = DOMSanitizer.sanitizeText(document.getElementById('modelSelect').value);
    const temperatureEl = document.getElementById('temperatureSelect');
    const contextEl = document.getElementById('contextSelect');
    const tokensEl = document.getElementById('tokensSelect');
    
    const temperature = parseFloat(temperatureEl?.value || '0.3');
    const contextSize = parseInt(contextEl?.value || '1024');
    const tokenLimit = DOMSanitizer.sanitizeText(tokensEl?.value || 'No Limit');
    
    if (!query) {
        window.showUserMessage('Please enter a search query', 'error');
        return;
    }
    
    // Store query globally for document viewer highlighting
    window._lastSearchQuery = query;
    
    if (!collection) {
        window.showUserMessage('Please select a collection', 'error');
        return;
    }
    
    if (!model) {
        window.showUserMessage('Please select a model', 'error');
        return;
    }
    
    // Show loading state
    searchAllBtn.textContent = 'Searching...';
    searchAllBtn.disabled = true;
    
    // Get selected methods
    const selectedMethods = getSelectedMethods();
    
    if (selectedMethods.length === 0) {
        window.showUserMessage('Please select at least one search method', 'error');
        return;
    }
    
    // Clear previous results for all containers
    ['document-index-container', 'line-search-container', 'document-search-container', 'smart-search-container', 'hybrid-search-container', 'ai-direct-container', 'ai-document-chat-container'].forEach(id => {
        const container = document.getElementById(id);
        const notSelectedDiv = document.createElement('div');
        notSelectedDiv.className = 'no-results';
        notSelectedDiv.textContent = 'Not selected';
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.appendChild(notSelectedDiv);
    });
    
    // Show loading for selected methods only
    selectedMethods.forEach(method => {
        const container = document.getElementById(`${method}-container`);
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Searching...';
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.appendChild(loadingDiv);
    });
    
    try {
        // Perform only selected searches
        const searchPromises = [];
        const methodMap = {};
        
        selectedMethods.forEach(method => {
            const options = { collection, model, temperature, contextSize, tokenLimit };
            searchPromises.push(window.searchManager.executeSearch(method, query, options));
            methodMap[method] = searchPromises.length - 1;
        });
        
        const results = await Promise.all(searchPromises);
        
        // Render results for selected methods
        const performanceData = {};
        Object.entries(methodMap).forEach(([method, index]) => {
            renderResults(`${method}-container`, results[index]);
            performanceData[method] = results[index];
        });
        
        // Update performance comparison
        updatePerformanceTable(performanceData);
        
    } catch {
        // Log error silently
        window.showUserMessage('Search failed. Please try again.', 'error');
    } finally {
        searchAllBtn.textContent = 'Search Selected Methods';
        searchAllBtn.disabled = false;
    }
}

// Get selected search methods
function getSelectedMethods() {
    const selected = [];
    const checkboxes = document.querySelectorAll('.method-checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selected.push(checkbox.dataset.method);
        }
    });
    return selected;
}

// Select All Non-AI functionality
selectAllNonAICheckbox.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#nonAICheckboxes .method-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    updateResultColumnVisibility();
    saveSelectedMethods();
});

// Select All AI functionality
selectAllAICheckbox.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#aiCheckboxes .method-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    updateResultColumnVisibility();
    saveSelectedMethods();
});

// Save selected methods to localStorage
function saveSelectedMethods() {
    const selectedMethods = getSelectedMethods();
    localStorage.setItem('selectedSearchMethods', JSON.stringify(selectedMethods));
}

// Restore selected methods from localStorage
function restoreSelectedMethods() {
    const saved = localStorage.getItem('selectedSearchMethods');
    if (saved) {
        try {
            const selectedMethods = JSON.parse(saved);
            const checkboxes = document.querySelectorAll('.method-checkbox');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectedMethods.includes(checkbox.dataset.method);
            });
            
            // Update group Select All checkbox states
            updateGroupSelectAllStates();
            
            updateResultColumnVisibility();
        } catch (error) {
            console.error('Failed to restore selected methods:', error);
        }
    }
}


// Update result column visibility based on selected methods
function updateResultColumnVisibility() {
    const selectedMethods = getSelectedMethods();
    
    // Hide all columns first
    document.querySelectorAll('.result-column').forEach(col => {
        col.style.display = 'none';
    });
    
    // Show only selected method columns
    selectedMethods.forEach(method => {
        const column = document.getElementById(`${method}-results`);
        if (column) {
            column.style.display = 'block';
        }
    });
}

// Event listeners
searchAllBtn.addEventListener('click', performAllSearches);

searchQueryEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performAllSearches();
    }
});

// Save query as user types
searchQueryEl.addEventListener('input', (e) => {
    const sanitizedValue = DOMSanitizer.sanitizeText(e.target.value);
    localStorage.setItem('multiModeSearchQuery', sanitizedValue);
    // Only update if sanitization actually changed something significant
    if (e.target.value !== sanitizedValue && sanitizedValue !== e.target.value) {
        e.target.value = sanitizedValue;
    }
});

// Load available collections and models using shared utilities
async function loadCollections() {
    const collections = await window.searchManager.loadCollections();
    window.searchManager.populateSelect('collectionSelect', collections, 'selectedCollection');
    
    // Add event listener to reload prompts when collection changes
    const collectionSelect = document.getElementById('collectionSelect');
    if (collectionSelect && !collectionSelect.hasAttribute('data-prompt-listener')) {
        collectionSelect.addEventListener('change', () => {
            loadUserPrompts();
        });
        collectionSelect.setAttribute('data-prompt-listener', 'true');
    }
    
    // Load user prompts after collections are loaded
    await loadUserPrompts();
}

async function loadModels() {
    const models = await window.searchManager.loadModels('search');
    window.searchManager.populateSelect('modelSelect', models, 'selectedSearchModel');
}

// Load user prompts
async function loadUserPrompts() {
    try {
        const response = await fetch('config/user-prompts.json');
        const data = await response.json();
        
        filterUserPrompts(data);
        
        // Add event listener for prompt selection (only once)
        if (!userPromptsEl.hasAttribute('data-listener-added')) {
            userPromptsEl.addEventListener('change', function() {
                if (this.value) {
                    searchQueryEl.value = this.value;
                    // Save to localStorage
                    localStorage.setItem('multiModeSearchQuery', this.value);
                }
            });
            userPromptsEl.setAttribute('data-listener-added', 'true');
        }
        
    } catch (error) {
        console.error('Failed to load user prompts:', error);
        userPromptsEl.innerHTML = '<option value="">Failed to load prompts</option>';
    }
}

// Filter user prompts based on collection (multi-mode only uses local documents)
function filterUserPrompts(data) {
    // Clear existing options
    userPromptsEl.innerHTML = '<option value="">Select a prompt...</option>';
    
    const collection = document.getElementById('collectionSelect').value;
    
    // Multi-mode search only uses local documents, so get collection-specific prompts
    if (collection && data.local_documents && data.local_documents[collection]) {
        data.local_documents[collection].forEach(prompt => {
            const option = document.createElement('option');
            option.value = prompt.prompt;
            option.textContent = prompt.name;
            userPromptsEl.appendChild(option);
        });
    }
}

// Setup parameter persistence using shared utility
function setupParameterPersistence() {
    window.parameterManager.setupPersistence([
        { elementId: 'temperatureSelect', storageKey: 'multiModeTemperature' },
        { elementId: 'contextSelect', storageKey: 'multiModeContext' },
        { elementId: 'tokensSelect', storageKey: 'multiModeTokens' }
    ]);
}

// Load search types and generate checkboxes
async function loadSearchTypes() {
    try {
        const response = await fetch('config/search-types.json');
        const data = await response.json();
        
        const nonAIContainer = document.getElementById('nonAICheckboxes');
        const aiContainer = document.getElementById('aiCheckboxes');
        
        // Define which methods are AI vs Non-AI
        const aiMethods = ['ai-direct', 'ai-document-chat'];
        
        // Clear existing checkboxes
        nonAIContainer.innerHTML = '';
        aiContainer.innerHTML = '';
        
        // Generate checkboxes from search-types.json
        data.search_types.forEach(searchType => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'method-checkbox';
            checkbox.dataset.method = searchType.value;
            
            label.appendChild(checkbox);
            const textNode = document.createTextNode(' ' + DOMSanitizer.sanitizeText(searchType.name || ''));
            label.appendChild(textNode);
            
            // Add to appropriate container
            if (aiMethods.includes(searchType.value)) {
                aiContainer.appendChild(label);
            } else {
                nonAIContainer.appendChild(label);
            }
            
            // Add event listener for the new checkbox
            checkbox.addEventListener('change', function() {
                updateGroupSelectAllStates();
                updateResultColumnVisibility();
                saveSelectedMethods();
            });
        });
        
    } catch (error) {
        console.error('Failed to load search types:', error);
    }
}

// Update group Select All checkbox states
function updateGroupSelectAllStates() {
    const nonAICheckboxes = document.querySelectorAll('#nonAICheckboxes .method-checkbox');
    const aiCheckboxes = document.querySelectorAll('#aiCheckboxes .method-checkbox');
    
    // Update Non-AI Select All
    const allNonAIChecked = Array.from(nonAICheckboxes).every(cb => cb.checked);
    const noneNonAIChecked = Array.from(nonAICheckboxes).every(cb => !cb.checked);
    selectAllNonAICheckbox.checked = allNonAIChecked;
    selectAllNonAICheckbox.indeterminate = !allNonAIChecked && !noneNonAIChecked;
    
    // Update AI Select All
    const allAIChecked = Array.from(aiCheckboxes).every(cb => cb.checked);
    const noneAIChecked = Array.from(aiCheckboxes).every(cb => !cb.checked);
    selectAllAICheckbox.checked = allAIChecked;
    selectAllAICheckbox.indeterminate = !allAIChecked && !noneAIChecked;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Load search types first
    await loadSearchTypes();
    
    // Restore selected methods
    restoreSelectedMethods();
    
    // Hide all columns initially (show only when methods are selected)
    updateResultColumnVisibility();
    
    // Load saved query
    const savedQuery = localStorage.getItem('multiModeSearchQuery');
    if (savedQuery) {
        searchQueryEl.value = DOMSanitizer.sanitizeText(savedQuery);
    }
    
    // Load collections (which will load user prompts) and models
    await loadCollections();
    loadModels();
    
    // Setup parameter persistence
    setupParameterPersistence();
    
    // Add sort event listeners to table headers
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            sortPerformanceTable(column);
        });
    });
});