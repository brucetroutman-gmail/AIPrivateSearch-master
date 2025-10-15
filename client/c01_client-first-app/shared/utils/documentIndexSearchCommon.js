// Common document index search functionality for both search and multi-mode pages

window.documentIndexSearchCommon = {
    // Perform document index search
    async performDocumentIndexSearch(query, collection) {
        const startTime = Date.now();
        
        try {
            const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/document-index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, options: { collection } })
            });
            
            const data = await response.json();
            return { 
                results: data.results || [], 
                time: Date.now() - startTime, 
                method: 'document-index' 
            };
        } catch (error) {
            console.error('Document index search error:', error);
            return { results: [], time: Date.now() - startTime, method: 'document-index' };
        }
    },

    // Format document index search results for display
    formatDocumentIndexSearchResults(results, collection = 'default') {
        if (!results || results.length === 0) {
            return '<div class="no-results">No results found</div>';
        }

        let html = '<div class="search-results">';
        
        results.forEach((result, index) => {
            html += `
                <div class="result-item">
                    <div class="result-header">
                        <h4>Result ${index + 1}: ${result.title}</h4>
                        <span class="score">${Math.round(result.score * 100)}%</span>
                    </div>
                    <div class="result-excerpt">${result.excerpt}</div>
                    <div class="result-meta">
                        ${window.documentViewerCommon.createViewDocumentLink(collection, result.source)}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
};