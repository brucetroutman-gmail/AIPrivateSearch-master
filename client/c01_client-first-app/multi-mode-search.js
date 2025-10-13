
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
    'line-search': { name: 'Line Search' },
    'ai-direct': { name: 'AI Direct' },
    'ai-document-chat': { name: 'AI Document Chat' },
    'smart-search': { name: 'Smart Search' },
    'hybrid-search': { name: 'Hybrid Search' },
    'document-index': { name: 'Document Index' },
    'document-search': { name: 'Document Search' }
};

// Real API search functions
async function performExactMatchSearch(query, collection = null, useWildcards = false) {
    const startTime = Date.now();
    
    try {
        const options = { query, useWildcards };
        if (collection) options.collection = collection;
        
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/line-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'line-search' 
        };
    } catch (error) {
        console.error('Exact match search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'line-search' };
    }
}

async function performAIDirectSearch(query, collection, model, temperature, contextSize, tokenLimit) {
    const startTime = Date.now();
    
    try {
        const searchResult = await window.aiDirectCommon.performAIDirectSearch(query, collection, {
            model, temperature, contextSize, tokenLimit
        });
        return { 
            results: searchResult.results || [], 
            time: Date.now() - startTime, 
            method: 'ai-direct' 
        };
    } catch (error) {
        console.error('AI Direct search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'ai-direct' };
    }
}

async function performAIDocumentChatSearch(query, collection, model, temperature, contextSize, tokenLimit) {
    const startTime = Date.now();
    
    try {
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/ai-document-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection, model, topK: 3, temperature, contextSize, tokenLimit } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'ai-document-chat' 
        };
    } catch (error) {
        console.error('AI Document Chat search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'ai-document-chat' };
    }
}



async function performVectorSearch(query, collection) {
    return await window.smartSearchCommon.performSmartSearch(query, collection, 5);
}

async function performHybridSearch(query, collection) {
    return await window.hybridSearchCommon.performHybridSearch(query, collection, 5);
}

async function performDocumentIndexSearch(query, collection = null) {
    return await window.documentIndexSearchCommon.performDocumentIndexSearch(query, collection);
}

async function performFullTextSearch(query, collection, useWildcards = false) {
    return await window.documentSearchCommon.performDocumentSearch(query, collection, useWildcards);
}

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
    Object.entries(results).forEach(([method, data]) => {
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
    });
    performanceSection.style.display = 'block';
}

// Main search function
async function performAllSearches() {
    const query = searchQueryEl.value.trim();
    const collection = document.getElementById('collectionSelect').value;
    const model = document.getElementById('modelSelect').value;
    const temperatureEl = document.getElementById('temperatureSelect');
    const contextEl = document.getElementById('contextSelect');
    const tokensEl = document.getElementById('tokensSelect');
    
    const temperature = parseFloat(temperatureEl?.value || '0.3');
    const contextSize = parseInt(contextEl?.value || '1024');
    const tokenLimit = tokensEl?.value || 'No Limit';
    
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
        
        if (selectedMethods.includes('line-search')) {
            searchPromises.push(performExactMatchSearch(query, collection, useWildcards));
            methodMap['line-search'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('ai-direct')) {
            searchPromises.push(performAIDirectSearch(query, collection, model, temperature, contextSize, tokenLimit));
            methodMap['ai-direct'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('ai-document-chat')) {
            searchPromises.push(performAIDocumentChatSearch(query, collection, model, temperature, contextSize, tokenLimit));
            methodMap['ai-document-chat'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('smart-search')) {
            searchPromises.push(performVectorSearch(query, collection));
            methodMap['smart-search'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('hybrid-search')) {
            searchPromises.push(performHybridSearch(query, collection));
            methodMap['hybrid-search'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('document-index')) {
            searchPromises.push(performDocumentIndexSearch(query, collection));
            methodMap['document-index'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('document-search')) {
            searchPromises.push(performFullTextSearch(query, collection, useWildcards));
            methodMap['document-search'] = searchPromises.length - 1;
        }
        
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
    localStorage.setItem('multiModeSearchQuery', e.target.value);
});

// Load available collections and models
function loadCollections() {
    window.collectionsUtils.populateCollectionSelect('collectionSelect', false);
}

async function loadModels() {
    try {
        const response = await fetch('http://localhost:3001/config/models-list.json');
        const data = await response.json();
        const select = document.getElementById('modelSelect');
        
        const models = data.models.filter(m => m.category === 'search').map(m => m.modelName).sort();
        const savedModel = localStorage.getItem('selectedSearchModel');
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === savedModel) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        select.addEventListener('change', function() {
            localStorage.setItem('selectedSearchModel', this.value);
        });
    } catch (error) {
        console.error('Failed to load models:', error);
    }
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
            label.appendChild(document.createTextNode(' ' + searchType.name));
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
        searchQueryEl.value = savedQuery;
    }
    
    // Load collections and models
    loadCollections();
    loadModels();
});