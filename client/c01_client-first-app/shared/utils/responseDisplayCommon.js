// Common response display functionality for both search and multi-mode pages

window.responseDisplayCommon = {
    // Render search results using multi-mode format
    renderSearchResults(container, searchResult, collection = null) {
        if (!searchResult.results || searchResult.results.length === 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            noResultsDiv.textContent = 'No results found';
            container.textContent = '';
            container.appendChild(noResultsDiv);
            return;
        }
        
        container.textContent = '';
        
        // Use existing formatters for specific search types
        if (searchResult.method === 'line-search') {
            const formattedElement = window.lineSearchFormatter.formatLineSearchResults(searchResult.results);
            container.appendChild(formattedElement);
            return;
        }
        
        if (searchResult.method === 'document-search') {
            const formattedElement = window.documentSearchCommon.formatDocumentSearchResults(searchResult.results);
            container.appendChild(formattedElement);
            return;
        }
        
        if (searchResult.method === 'document-index') {
            const formattedElement = window.documentIndexSearchCommon.formatDocumentIndexSearchResults(searchResult.results, collection);
            container.appendChild(formattedElement);
            return;
        }
        
        // Format other search types with consistent styling
        searchResult.results.forEach((result) => {
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
            
            const excerpt = document.createElement('div');
            excerpt.className = 'result-excerpt';
            
            // Handle markdown conversion for vector and hybrid searches
            if (searchResult.method === 'smart-search' || searchResult.method === 'hybrid-search') {
                const sanitizedHTML = window.lineSearchFormatter.convertMarkdownToHTML(result.excerpt);
                const parser = new DOMParser();
                const doc = parser.parseFromString(sanitizedHTML, 'text/html');
                while (doc.body.firstChild) {
                    excerpt.appendChild(doc.body.firstChild);
                }
            } else {
                excerpt.textContent = result.excerpt;
            }
            
            div.appendChild(header);
            div.appendChild(excerpt);
            
            // Add metadata section with View Document link
            const meta = document.createElement('div');
            meta.className = 'result-meta';
            
            // Add View Document link
            if (result.source && collection) {
                const linkHtml = window.documentViewerCommon.createViewDocumentLink(collection, result.source);
                const parser = new DOMParser();
                const doc = parser.parseFromString(linkHtml, 'text/html');
                meta.appendChild(doc.body.firstElementChild);
            } else if (result.documentPath) {
                const link = document.createElement('a');
                link.href = result.documentPath.startsWith('http') ? result.documentPath : `http://localhost:3001${result.documentPath}`;
                link.textContent = 'View Document';
                link.target = '_blank';
                link.className = 'view-document-link';
                meta.appendChild(link);
            }
            
            div.appendChild(meta);
            container.appendChild(div);
        });
    },

    // Convert search result to multi-mode format
    convertToMultiModeFormat(result, searchType) {
        if (!result.response) return { results: [], method: searchType };
        
        // Parse markdown-formatted responses into result objects
        if (result.response.includes('**Result ') && result.response.includes('---')) {
            const sections = result.response.split('---').filter(s => s.trim());
            const results = sections.map((section, index) => {
                const lines = section.trim().split('\n');
                const titleLine = lines.find(line => line.startsWith('**Result '));
                const title = titleLine ? titleLine.replace(/\*\*Result \d+: /, '').replace(/\*\*/, '') : `Result ${index + 1}`;
                const excerpt = lines.slice(1).join('\n').trim();
                
                return {
                    title,
                    excerpt,
                    score: 1.0,
                    source: title + '.md'
                };
            });
            
            return { results, method: searchType };
        }
        
        // Handle single response
        return {
            results: [{
                title: 'Response',
                excerpt: result.response,
                score: 1.0,
                source: 'AI Response'
            }],
            method: searchType
        };
    }
};