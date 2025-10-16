
// Multi-mode search functionality

// DOM elements
const searchQueryEl = document.getElementById('searchQuery');
const searchAllBtn = document.getElementById('searchAllBtn');

const performanceSection = document.getElementById('performanceSection');
const performanceTableBody = document.getElementById('performanceTableBody');
const selectAllCheckbox = document.getElementById('selectAll');
const methodCheckboxes = document.querySelectorAll('.method-checkbox');
const wildcardOption = document.getElementById('wildcardOption');
const useWildcardsMulti = document.getElementById('useWildcardsMulti');

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



// Update performance table
function updatePerformanceTable(results) {
    while (performanceTableBody.firstChild) {
        performanceTableBody.removeChild(performanceTableBody.firstChild);
    }
    
    // Maintain the correct order based on searchMethods object
    const orderedMethods = Object.keys(searchMethods);
    orderedMethods.forEach(method => {
        if (results[method]) {
            const data = results[method];
            const row = document.createElement('tr');
            const avgScore = data.results.length > 0 
                ? (data.results.reduce((sum, r) => sum + r.score, 0) / data.results.length).toFixed(2)
                : '0.00';
            
            const nameCell = document.createElement('td');
            nameCell.textContent = searchMethods[method].name;
            
            const countCell = document.createElement('td');
            countCell.textContent = data.results.length;
            
            const timeCell = document.createElement('td');
            timeCell.textContent = `${(data.time / 1000).toFixed(2)}s`;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = avgScore;
            
            row.appendChild(nameCell);
            row.appendChild(countCell);
            row.appendChild(timeCell);
            row.appendChild(scoreCell);
            
            performanceTableBody.appendChild(row);
        }
    });
    performanceSection.classList.remove('hidden');
    performanceSection.style.display = 'block';
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
    
    // Get selected methods and wildcard setting
    const selectedMethods = getSelectedMethods();
    const useWildcards = useWildcardsMulti ? useWildcardsMulti.checked : false;
    
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
            const options = { collection, useWildcards, model, temperature, contextSize, tokenLimit };
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

// Select All functionality
selectAllCheckbox.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.method-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    updateResultColumnVisibility();
    updateWildcardVisibility();
});

// Function to show/hide wildcard option based on selected methods
function updateWildcardVisibility() {
    const selectedMethods = getSelectedMethods();
    const hasSearchMethods = selectedMethods.includes('line-search') || selectedMethods.includes('document-search');
    
    if (wildcardOption) {
        wildcardOption.style.display = hasSearchMethods ? 'block' : 'none';
        if (!hasSearchMethods && useWildcardsMulti) {
            useWildcardsMulti.checked = false;
        }
    }
}

// Save wildcard setting
if (useWildcardsMulti) {
    useWildcardsMulti.addEventListener('change', () => {
        localStorage.setItem('useWildcardsMulti', useWildcardsMulti.checked);
    });
    
    // Restore wildcard setting
    const wildcardSetting = localStorage.getItem('useWildcardsMulti');
    if (wildcardSetting === 'true') {
        useWildcardsMulti.checked = true;
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
    if (e.target.value !== sanitizedValue) {
        e.target.value = sanitizedValue;
    }
});

// Load available collections and models using shared utilities
async function loadCollections() {
    const collections = await window.searchManager.loadCollections();
    window.searchManager.populateSelect('collectionSelect', collections, 'selectedCollection');
}

async function loadModels() {
    const models = await window.searchManager.loadModels('search');
    window.searchManager.populateSelect('modelSelect', models, 'selectedSearchModel');
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
        const container = document.getElementById('methodCheckboxes');
        
        // Keep the Select All checkbox
        const selectAllLabel = container.querySelector('label');
        
        // Clear existing checkboxes except Select All
        while (container.children.length > 1) {
            container.removeChild(container.lastChild);
        }
        
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
            container.appendChild(label);
            
            // Add event listener for the new checkbox
            checkbox.addEventListener('change', function() {
                const allChecked = Array.from(document.querySelectorAll('.method-checkbox')).every(cb => cb.checked);
                const noneChecked = Array.from(document.querySelectorAll('.method-checkbox')).every(cb => !cb.checked);
                
                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
                
                updateResultColumnVisibility();
                updateWildcardVisibility();
            });
        });
        
    } catch (error) {
        console.error('Failed to load search types:', error);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Load search types first
    await loadSearchTypes();
    
    // Hide all columns initially (show only when methods are selected)
    updateResultColumnVisibility();
    
    // Load saved query
    const savedQuery = localStorage.getItem('multiModeSearchQuery');
    if (savedQuery) {
        searchQueryEl.value = DOMSanitizer.sanitizeText(savedQuery);
    }
    
    // Load collections and models
    loadCollections();
    loadModels();
    
    // Setup parameter persistence
    setupParameterPersistence();
});