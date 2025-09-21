// Multi-mode search functionality

// DOM elements
const searchQueryEl = document.getElementById('searchQuery');
const searchAllBtn = document.getElementById('searchAllBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const performanceSection = document.getElementById('performanceSection');
const performanceTableBody = document.getElementById('performanceTableBody');

// Search methods configuration
const searchMethods = {
    traditional: {
        name: 'Traditional Text',
        endpoint: '/api/search/traditional',
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

// Mock search functions for all 7 methods
async function performTraditionalSearch() {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const results = [
        {
            id: 1,
            title: 'france-facts.txt',
            excerpt: 'Line 15: The capital of France is Paris.',
            score: 1.0,
            source: 'france-facts.txt:15'
        }
    ];
    
    return { results, time: Date.now() - startTime, method: 'traditional' };
}

async function performAIDirectSearch() {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const results = [
        {
            id: 1,
            title: 'AI Answer',
            excerpt: 'Based on the document content, Paris is the capital of France. It is located in the north-central part of the country.',
            score: 0.94,
            source: 'AI Model Response'
        }
    ];
    
    return { results, time: Date.now() - startTime, method: 'ai-direct' };
}

async function performRAGSearch() {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const results = [
        {
            id: 1,
            title: 'Chunk: French Geography',
            excerpt: 'Paris, the capital city of France, is situated on the Seine River in northern France.',
            score: 0.89,
            source: 'geography.md (chunk 3)'
        },
        {
            id: 2,
            title: 'Chunk: Political Centers',
            excerpt: 'As the capital, Paris houses the French government and major political institutions.',
            score: 0.76,
            source: 'politics.md (chunk 1)'
        }
    ];
    
    return { results, time: Date.now() - startTime, method: 'rag' };
}

async function performVectorSearch() {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const results = [
        {
            id: 1,
            title: 'Similar: Capital Cities',
            excerpt: 'Paris serves as the capital and largest city of France, similar to how London serves the UK.',
            score: 0.87,
            source: 'capitals-comparison.md'
        },
        {
            id: 2,
            title: 'Similar: European Centers',
            excerpt: 'Major European capitals like Paris, Berlin, and Rome serve as political and cultural hubs.',
            score: 0.73,
            source: 'european-cities.md'
        }
    ];
    
    return { results, time: Date.now() - startTime, method: 'vector' };
}

async function performHybridSearch() {
    const startTime = Date.now();
    
    // Simulate combining multiple methods
    const traditionalResults = await performTraditionalSearch();
    const vectorResults = await performVectorSearch();
    
    const combinedResults = [
        ...traditionalResults.results.map(r => ({...r, score: r.score * 0.8, method: 'traditional'})),
        ...vectorResults.results.map(r => ({...r, score: r.score * 0.6, method: 'vector'}))
    ].sort((a, b) => b.score - a.score);
    
    return { results: combinedResults, time: Date.now() - startTime, method: 'hybrid' };
}

async function performMetadataSearch() {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const results = [
        {
            id: 1,
            title: 'Document: France Overview',
            excerpt: 'Category: Geography, Tags: ["europe", "capital", "france"], Author: Encyclopedia',
            score: 0.95,
            source: 'META_france-overview.md'
        },
        {
            id: 2,
            title: 'Document: European Capitals',
            excerpt: 'Category: Reference, Tags: ["capitals", "cities", "europe"], Modified: 2024-01-15',
            score: 0.82,
            source: 'META_european-capitals.md'
        }
    ];
    
    return { results, time: Date.now() - startTime, method: 'metadata' };
}

async function performFullTextSearch() {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const results = [
        {
            id: 1,
            title: 'Indexed: France Capital',
            excerpt: 'Paris (capital) - The capital and most populous city of France, located in the north-central part.',
            score: 0.91,
            source: 'search-index (rank: 1)'
        },
        {
            id: 2,
            title: 'Indexed: French Cities',
            excerpt: 'Major French cities include Paris (capital), Lyon, Marseille, and Toulouse.',
            score: 0.79,
            source: 'search-index (rank: 2)'
        }
    ];
    
    return { results, time: Date.now() - startTime, method: 'fulltext' };
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
    ['traditional-container', 'ai-direct-container', 'rag-container', 'vector-container', 'hybrid-container', 'metadata-container', 'fulltext-container'].forEach(id => {
        const container = document.getElementById(id);
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Searching...';
        container.innerHTML = '';
        container.appendChild(loadingDiv);
    });
    
    try {
        // Perform all searches
        const [traditionalResult, aiDirectResult, ragResult, vectorResult, hybridResult, metadataResult, fulltextResult] = await Promise.all([
            performTraditionalSearch(),
            performAIDirectSearch(),
            performRAGSearch(),
            performVectorSearch(),
            performHybridSearch(),
            performMetadataSearch(),
            performFullTextSearch()
        ]);
        
        // Render results
        renderResults('traditional-container', traditionalResult);
        renderResults('ai-direct-container', aiDirectResult);
        renderResults('rag-container', ragResult);
        renderResults('vector-container', vectorResult);
        renderResults('hybrid-container', hybridResult);
        renderResults('metadata-container', metadataResult);
        renderResults('fulltext-container', fulltextResult);
        
        // Update performance comparison
        updatePerformanceTable({
            traditional: traditionalResult,
            'ai-direct': aiDirectResult,
            rag: ragResult,
            vector: vectorResult,
            hybrid: hybridResult,
            metadata: metadataResult,
            fulltext: fulltextResult
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