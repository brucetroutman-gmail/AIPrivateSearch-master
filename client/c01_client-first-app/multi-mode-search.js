// Multi-mode search functionality

// DOM elements
const searchQueryEl = document.getElementById('searchQuery');
const searchAllBtn = document.getElementById('searchAllBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const performanceSection = document.getElementById('performanceSection');
const performanceTableBody = document.getElementById('performanceTableBody');

// Search methods configuration
const searchMethods = {
    fuzzy: {
        name: 'Fuzzy Search',
        endpoint: '/api/search/fuzzy',
        description: 'Fast text matching with flexible keyword search'
    },
    exact: {
        name: 'Exact Match', 
        endpoint: '/api/search/exact',
        description: 'Precise string matching for specific queries'
    },
    semantic: {
        name: 'AI Semantic',
        endpoint: '/api/search/semantic', 
        description: 'AI-powered contextual understanding'
    },
    hybrid: {
        name: 'Hybrid',
        endpoint: '/api/search/hybrid',
        description: 'Combined approach with weighted scoring'
    }
};

// Mock search functions for demonstration
async function performFuzzySearch() {
    const startTime = Date.now();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const mockResults = [
        {
            id: 1,
            title: 'France Geography',
            excerpt: 'France is located in Western Europe. Paris is the capital city.',
            score: 0.85,
            source: 'geography.md'
        },
        {
            id: 2,
            title: 'European Capitals',
            excerpt: 'Major European capitals include Paris, London, Berlin, and Rome.',
            score: 0.72,
            source: 'capitals.md'
        }
    ];
    
    // Return all mock results for fuzzy search
    const results = mockResults;
    
    return {
        results,
        time: Date.now() - startTime,
        method: 'fuzzy'
    };
}

async function performExactSearch() {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const mockResults = [
        {
            id: 1,
            title: 'France Information',
            excerpt: 'The capital of France is Paris.',
            score: 1.0,
            source: 'france-facts.md'
        }
    ];
    
    const results = mockResults.filter(r => 
        r.excerpt.toLowerCase().includes('capital')
    );
    
    return {
        results,
        time: Date.now() - startTime,
        method: 'exact'
    };
}

async function performSemanticSearch() {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockResults = [
        {
            id: 1,
            title: 'French Culture and History',
            excerpt: 'Paris, the City of Light, serves as the political and cultural center of France.',
            score: 0.92,
            source: 'french-culture.md'
        },
        {
            id: 2,
            title: 'European Union Overview',
            excerpt: 'France plays a central role in the EU, with Paris hosting many international organizations.',
            score: 0.78,
            source: 'eu-overview.md'
        }
    ];
    
    const results = mockResults;
    
    return {
        results,
        time: Date.now() - startTime,
        method: 'semantic'
    };
}

async function performHybridSearch(query) {
    const startTime = Date.now();
    
    // Simulate combining results from multiple methods
    const fuzzyResults = await performFuzzySearch();
    const semanticResults = await performSemanticSearch(query);
    
    // Combine and re-score results
    const combinedResults = [
        ...fuzzyResults.results.map(r => ({...r, score: r.score * 0.7})),
        ...semanticResults.results.map(r => ({...r, score: r.score * 0.9}))
    ];
    
    // Remove duplicates and sort by score
    const uniqueResults = combinedResults
        .filter((result, index, self) => 
            index === self.findIndex(r => r.id === result.id)
        )
        .sort((a, b) => b.score - a.score);
    
    return {
        results: uniqueResults,
        time: Date.now() - startTime,
        method: 'hybrid'
    };
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
    
    const resultsHtml = searchResult.results.map(result => `
        <div class="result-item">
            <div class="result-header">
                <h4>${result.title}</h4>
                <span class="score">${Math.round(result.score * 100)}%</span>
            </div>
            <p class="result-excerpt">${result.excerpt}</p>
            <div class="result-meta">
                <span class="source">${result.source}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = '';
    container.insertAdjacentHTML('beforeend', resultsHtml);
}

// Update performance table
function updatePerformanceTable(results) {
    const tableRows = Object.entries(results).map(([method, data]) => {
        const avgScore = data.results.length > 0 
            ? (data.results.reduce((sum, r) => sum + r.score, 0) / data.results.length).toFixed(2)
            : '0.00';
            
        return `
            <tr>
                <td>${searchMethods[method].name}</td>
                <td>${data.results.length}</td>
                <td>${data.time}ms</td>
                <td>${avgScore}</td>
            </tr>
        `;
    }).join('');
    
    performanceTableBody.innerHTML = '';
    performanceTableBody.insertAdjacentHTML('beforeend', tableRows);
    performanceSection.style.display = 'block';
}

// Main search function
async function performAllSearches() {
    const query = searchQueryEl.value.trim();
    
    if (!query) {
        alert('Please enter a search query');
        return;
    }
    
    // Show loading state
    searchAllBtn.textContent = 'Searching...';
    searchAllBtn.disabled = true;
    
    // Clear previous results
    ['fuzzy-container', 'exact-container', 'semantic-container', 'hybrid-container'].forEach(id => {
        const container = document.getElementById(id);
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Searching...';
        container.innerHTML = '';
        container.appendChild(loadingDiv);
    });
    
    try {
        // Perform all searches
        const [fuzzyResult, exactResult, semanticResult, hybridResult] = await Promise.all([
            performFuzzySearch(),
            performExactSearch(),
            performSemanticSearch(),
            performHybridSearch(query)
        ]);
        
        // Render results
        renderResults('fuzzy-container', fuzzyResult);
        renderResults('exact-container', exactResult);
        renderResults('semantic-container', semanticResult);
        renderResults('hybrid-container', hybridResult);
        
        // Update performance comparison
        updatePerformanceTable({
            fuzzy: fuzzyResult,
            exact: exactResult,
            semantic: semanticResult,
            hybrid: hybridResult
        });
        
    } catch {
        // Log error silently
        alert('Search failed. Please try again.');
    } finally {
        searchAllBtn.textContent = 'Search All Methods';
        searchAllBtn.disabled = false;
    }
}

// Tab switching functionality
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all tabs
        tabButtons.forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked tab
        button.classList.add('active');
        
        // Show/hide corresponding result column
        const method = button.dataset.method;
        document.querySelectorAll('.result-column').forEach(col => {
            col.style.display = col.id === `${method}-results` ? 'block' : 'none';
        });
    });
});

// Event listeners
searchAllBtn.addEventListener('click', performAllSearches);

searchQueryEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performAllSearches();
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Show all columns by default
    document.querySelectorAll('.result-column').forEach(col => {
        col.style.display = 'block';
    });
});