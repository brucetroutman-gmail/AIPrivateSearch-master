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

    // Format document index search results for display (safe DOM creation)
    formatDocumentIndexSearchResults(results, collection = 'default') {
        const container = document.createElement('div');
        
        if (!results || results.length === 0) {
            container.className = 'no-results';
            container.textContent = 'No results found';
            return container;
        }

        container.className = 'search-results';
        
        results.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            const header = document.createElement('div');
            header.className = 'result-header';
            
            const title = document.createElement('h4');
            title.textContent = `Result ${index + 1}: ${result.title || ''}`;
            
            const score = document.createElement('span');
            score.className = 'score';
            score.textContent = `${Math.round((result.score || 0) * 100)}%`;
            
            header.appendChild(title);
            header.appendChild(score);
            
            const excerpt = document.createElement('div');
            excerpt.className = 'result-excerpt';
            excerpt.textContent = result.excerpt || '';
            
            const meta = document.createElement('div');
            meta.className = 'result-meta';
            if (window.documentViewerCommon) {
                const link = window.documentViewerCommon.createViewDocumentLink(collection, result.source);
                if (link) meta.appendChild(link);
            }
            
            item.appendChild(header);
            item.appendChild(excerpt);
            item.appendChild(meta);
            container.appendChild(item);
        });
        
        return container;
    }
};