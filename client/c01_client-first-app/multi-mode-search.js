
// Security: HTML sanitization function
function sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}




 
// Multi-mode search functionality

// DOM elements
const searchQueryEl = document.getElementById('searchQuery');
const searchAllBtn = document.getElementById('searchAllBtn');

const performanceSection = document.getElementById('performanceSection');
const performanceTableBody = document.getElementById('performanceTableBody');
const selectAllCheckbox = document.getElementById('selectAll');
const methodCheckboxes = document.querySelectorAll('.method-checkbox');

// Search methods configuration
const searchMethods = {
    'exact-match': {
        name: 'Exact Match Search',
        endpoint: '/api/search/exact-match',
        description: 'File-based grep-like search for exact matches'
    },
    'ai-direct': {
        name: 'AI Direct',
        endpoint: '/api/search/ai-direct',
        description: 'Question-answering models for contextual understanding'
    },
    rag: {
        name: 'RAG Search',
        endpoint: '/api/search/rag',
        description: 'Chunked documents with AI retrieval'
    },

    vector: {
        name: 'Vector Database',
        endpoint: '/api/search/vector',
        description: 'Semantic similarity using embeddings'
    },
    hybrid: {
        name: 'Hybrid',
        endpoint: '/api/search/hybrid',
        description: 'Combined traditional and vector methods'
    },
    metadata: {
        name: 'Metadata',
        endpoint: '/api/search/metadata',
        description: 'Structured queries using document metadata'
    },
    fulltext: {
        name: 'Full-Text',
        endpoint: '/api/search/fulltext',
        description: 'Indexed search with ranking and stemming'
    }
};

// Real API search functions
async function performExactMatchSearch(query, collection = null) {
    const startTime = Date.now();
    
    try {
        const options = { query };
        if (collection) options.collection = collection;
        
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/exact-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'exact-match' 
        };
    } catch (error) {
        console.error('Exact match search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'exact-match' };
    }
}

async function performAIDirectSearch(query, collection, model, temperature, contextSize, tokenLimit) {
    const startTime = Date.now();
    
    try {
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/ai-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection, model, temperature, contextSize, tokenLimit } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'ai-direct' 
        };
    } catch (error) {
        console.error('AI Direct search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'ai-direct' };
    }
}

async function performRAGSearch(query, collection, model, temperature, contextSize, tokenLimit) {
    const startTime = Date.now();
    
    try {
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection, model, topK: 3, temperature, contextSize, tokenLimit } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'rag' 
        };
    } catch (error) {
        console.error('RAG search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'rag' };
    }
}



async function performVectorSearch(query, collection) {
    const startTime = Date.now();
    
    try {
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/vector', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection, topK: 5 } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'vector' 
        };
    } catch (error) {
        console.error('Vector search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'vector' };
    }
}

async function performHybridSearch(query, collection) {
    const startTime = Date.now();
    
    try {
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/hybrid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'hybrid' 
        };
    } catch (error) {
        console.error('Hybrid search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'hybrid' };
    }
}

async function performMetadataSearch(query, collection = null) {
    const startTime = Date.now();
    
    try {
        const options = { query };
        if (collection) options.collection = collection;
        
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'metadata' 
        };
    } catch (error) {
        console.error('Metadata search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'metadata' };
    }
}

async function performFullTextSearch(query, collection) {
    const startTime = Date.now();
    
    try {
        const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/fulltext', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, options: { collection } })
        });
        
        const data = await response.json();
        return { 
            results: data.results || [], 
            time: Date.now() - startTime, 
            method: 'fulltext' 
        };
    } catch (error) {
        console.error('Full-text search error:', error);
        return { results: [], time: Date.now() - startTime, method: 'fulltext' };
    }
}

// Render results for a specific method
function renderResults(containerId, searchResult) {
    const container = document.getElementById(containerId);
    
    if (!searchResult.results || searchResult.results.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.textContent = 'No results found';
        container.innerHTML = '';
        container.appendChild(noResultsDiv);
        return;
    }
    
    container.innerHTML = '';
    searchResult.results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        const header = document.createElement('div');
        header.className = 'result-header';
        
        const title = document.createElement('h4');
        title.textContent = result.title;
        
        const score = document.createElement('span');
        score.className = 'score';
        score.textContent = `${Math.round(result.score * 100)}%`;
        
        header.appendChild(title);
        header.appendChild(score);
        
        const excerpt = document.createElement('p');
        excerpt.className = 'result-excerpt';
        excerpt.textContent = result.excerpt;
        
        const meta = document.createElement('div');
        meta.className = 'result-meta';
        
        const source = document.createElement('span');
        source.className = 'source';
        source.textContent = result.source;
        
        meta.appendChild(source);
        
        // Add document link if available
        if (result.documentPath) {
            const link = document.createElement('a');
            // Handle both full URLs and relative paths
            link.href = result.documentPath.startsWith('http') ? result.documentPath : `http://localhost:3001${result.documentPath}`;
            link.textContent = ' [View Document]';
            link.target = '_blank';
            link.style.marginLeft = '10px';
            link.style.color = '#007bff';
            meta.appendChild(link);
        }
        
        div.appendChild(header);
        div.appendChild(excerpt);
        div.appendChild(meta);
        
        container.appendChild(div);
    });
}

// Update performance table
function updatePerformanceTable(results) {
    performanceTableBody.innerHTML = '';
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
    
    console.log('Temperature element:', temperatureEl, temperatureEl?.value);
    console.log('Context element:', contextEl, contextEl?.value);
    console.log('Tokens element:', tokensEl, tokensEl?.value);
    
    const temperature = parseFloat(temperatureEl?.value || '0.3');
    const contextSize = parseInt(contextEl?.value || '1024');
    const tokenLimit = tokensEl?.value || 'No Limit';
    
    console.log('Final values:', { temperature, contextSize, tokenLimit });
    
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
    
    // Get selected methods
    const selectedMethods = getSelectedMethods();
    
    if (selectedMethods.length === 0) {
        window.showUserMessage('Please select at least one search method', 'error');
        return;
    }
    
    // Clear previous results for all containers
    ['exact-match-container', 'ai-direct-container', 'rag-container', 'vector-container', 'hybrid-container', 'metadata-container', 'fulltext-container'].forEach(id => {
        const container = document.getElementById(id);
        const notSelectedDiv = document.createElement('div');
        notSelectedDiv.className = 'no-results';
        notSelectedDiv.textContent = 'Not selected';
        container.innerHTML = '';
        container.appendChild(notSelectedDiv);
    });
    
    // Show loading for selected methods only
    selectedMethods.forEach(method => {
        const container = document.getElementById(`${method}-container`);
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Searching...';
        container.innerHTML = '';
        container.appendChild(loadingDiv);
    });
    
    try {
        // Perform only selected searches
        const searchPromises = [];
        const methodMap = {};
        
        if (selectedMethods.includes('exact-match')) {
            searchPromises.push(performExactMatchSearch(query, collection));
            methodMap['exact-match'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('ai-direct')) {
            searchPromises.push(performAIDirectSearch(query, collection, model, temperature, contextSize, tokenLimit));
            methodMap['ai-direct'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('rag')) {
            searchPromises.push(performRAGSearch(query, collection, model, temperature, contextSize, tokenLimit));
            methodMap['rag'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('vector')) {
            searchPromises.push(performVectorSearch(query, collection));
            methodMap['vector'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('hybrid')) {
            searchPromises.push(performHybridSearch(query, collection));
            methodMap['hybrid'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('metadata')) {
            searchPromises.push(performMetadataSearch(query, collection));
            methodMap['metadata'] = searchPromises.length - 1;
        }
        if (selectedMethods.includes('fulltext')) {
            searchPromises.push(performFullTextSearch(query, collection));
            methodMap['fulltext'] = searchPromises.length - 1;
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
    methodCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selected.push(checkbox.dataset.method);
        }
    });
    return selected;
}

// Select All functionality
selectAllCheckbox.addEventListener('change', function() {
    methodCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    updateResultColumnVisibility();
});

// Individual checkbox change handler
methodCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        // Update Select All checkbox state
        const allChecked = Array.from(methodCheckboxes).every(cb => cb.checked);
        const noneChecked = Array.from(methodCheckboxes).every(cb => !cb.checked);
        
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
        
        // Update column visibility
        updateResultColumnVisibility();
    });
});

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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
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