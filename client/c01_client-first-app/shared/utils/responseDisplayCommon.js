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
            const formattedElement = window.lineSearchFormatter.formatLineSearchResults(searchResult.results, collection);
            container.appendChild(formattedElement);
            return;
        }
        
        if (searchResult.method === 'document-search') {
            const formattedElement = window.documentSearchCommon.formatDocumentSearchResults(searchResult.results, collection);
            container.appendChild(formattedElement);
            return;
        }
        
        if (searchResult.method === 'document-index') {
            const formattedElement = window.documentIndexSearchCommon.formatDocumentIndexSearchResults(searchResult.results, collection);
            container.appendChild(formattedElement);
            return;
        }

        // AI Document Chat — render as a full answer, not a result card
        if (searchResult.method === 'ai-document-chat') {
            const firstResult = searchResult.results[0];
            const answerDiv = document.createElement('div');
            answerDiv.className = 'ai-chat-answer';
            const sanitizedHTML = window.lineSearchFormatter.convertMarkdownToHTML(firstResult.excerpt);
            const parser = new DOMParser();
            const doc = parser.parseFromString(sanitizedHTML, 'text/html');
            while (doc.body.firstChild) answerDiv.appendChild(doc.body.firstChild);
            container.appendChild(answerDiv);

            // Feedback buttons
            if (searchResult.feedbackToken) {
                const feedbackDiv = document.createElement('div');
                feedbackDiv.style.cssText = 'margin-top:0.75rem;display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:var(--text-muted);';
                feedbackDiv.innerHTML = `
                  <span>Was this helpful?</span>
                  <button class="feedback-btn" data-token="${searchResult.feedbackToken}" data-rating="1"
                    style="background:none;border:1px solid var(--border-color);border-radius:4px;padding:2px 8px;cursor:pointer;font-size:1rem;" title="Good response">
                    👍
                  </button>
                  <button class="feedback-btn" data-token="${searchResult.feedbackToken}" data-rating="0"
                    style="background:none;border:1px solid var(--border-color);border-radius:4px;padding:2px 8px;cursor:pointer;font-size:1rem;" title="Poor response">
                    👎
                  </button>
                  <span class="feedback-thanks" style="display:none;color:var(--success-color);">Thanks for your feedback!</span>`;

                feedbackDiv.querySelectorAll('.feedback-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const rating = parseInt(btn.dataset.rating);
                        const token = btn.dataset.token;
                        const meta = searchResult.feedbackMeta || {};
                        try {
                            await window.csrfManager.fetch(`${window.API_BASE_URL}/api/search-feedback`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ feedbackToken: token, rating, ...meta })
                            });
                        } catch (e) { /* silent — feedback is best-effort */ }
                        feedbackDiv.querySelectorAll('.feedback-btn').forEach(b => b.disabled = true);
                        feedbackDiv.querySelector('.feedback-thanks').style.display = 'inline';
                    });
                });
                container.appendChild(feedbackDiv);
            }
            return;
        }
        
        // Use common formatter for search types that need document links
        if (searchResult.method === 'ai-direct' || searchResult.method === 'smart-search' || searchResult.method === 'hybrid-search') {
            const formattedElement = window.CommonResultFormatter.formatSearchResults(searchResult.results, {
                resultType: searchResult.method,
                showScore: true,
                defaultCollection: collection || searchResult.collection || 'unknown'
            });
            container.appendChild(formattedElement);
            return;
        }
        
        // Format other search types with consistent styling
        const totalResults = searchResult.results.length;
        const INITIAL_COUNT = 5;
        
        searchResult.results.forEach((result, index) => {
            const div = document.createElement('div');
            div.className = 'result-item';
            if (index >= INITIAL_COUNT) {
                div.classList.add('hidden-result');
                div.style.display = 'none';
            }
            
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
            
            // Handle markdown conversion for AI-based searches
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
            
            // Add metadata section (no View Document links since filenames are clickable)
            const meta = document.createElement('div');
            meta.className = 'result-meta';
            
            div.appendChild(meta);
            container.appendChild(div);
        });
        
        // Add "Show all" link if there are more results
        if (totalResults > INITIAL_COUNT) {
            const showAllLink = document.createElement('a');
            showAllLink.href = '#';
            showAllLink.className = 'show-all-results-link';
            showAllLink.textContent = `Show all ${totalResults} results`;
            showAllLink.addEventListener('click', (e) => {
                e.preventDefault();
                container.querySelectorAll('.hidden-result').forEach(item => {
                    item.classList.remove('hidden-result');
                    item.style.display = '';
                });
                showAllLink.style.display = 'none';
            });
            container.appendChild(showAllLink);
        }
    },

    // Convert search result to multi-mode format
    convertToMultiModeFormat(result, searchType) {
        if (!result.response) return { results: [], method: searchType };
        
        // Preserve feedback token if present
        const feedbackToken = result.feedbackToken || null;
        const feedbackMeta = result.feedbackMeta || null;
        
        // Parse markdown-formatted responses into result objects
        if (result.response.includes('**Result ') && result.response.includes('---')) {
            const sections = result.response.split('---').filter(s => s.trim());
            const results = sections.map((section, index) => {
                const lines = section.trim().split('\n');
                const titleLine = lines.find(line => line.startsWith('**Result '));
                
                let title = `Result ${index + 1}`;
                let source = 'AI Response';
                
                if (titleLine) {
                    const cleanTitle = titleLine.replace(/\*\*Result \d+: /, '').replace(/\*\*$/, '');
                    // Extract filename from markdown link if present
                    const linkMatch = cleanTitle.match(/\[([^\]]+)\]\(([^\)]+)\)/);
                    if (linkMatch) {
                        title = linkMatch[1]; // Link text becomes title
                        // Extract filename from URL path
                        const urlPath = linkMatch[2];
                        const pathParts = urlPath.split('/');
                        source = decodeURIComponent(pathParts[pathParts.length - 2]); // Filename before /view
                    } else {
                        title = cleanTitle;
                        source = cleanTitle; // Use title as source when no link found
                    }
                } else {
                    // Look for markdown links in the excerpt to extract document name
                    const excerpt = lines.slice(1).join('\n').trim();
                    const linkMatch = excerpt.match(/\[View Document\]\(([^\)]+)\)/);
                    if (linkMatch) {
                        const urlPath = linkMatch[1];
                        const pathParts = urlPath.split('/');
                        const filename = decodeURIComponent(pathParts[pathParts.length - 2]);
                        title = filename; // Use actual filename as title
                        source = filename;
                    }
                }
                
                let excerpt = lines.slice(1).join('\n').trim();
                // Remove markdown links from excerpt
                excerpt = excerpt.replace(/\[View Document\]\([^\)]+\)/g, '');
                
                return {
                    title,
                    excerpt,
                    score: 1.0,
                    source
                };
            });
            
            return { results, method: searchType, ...(feedbackToken && { feedbackToken, feedbackMeta }) };
        }
        
        // Handle single response
        return {
            results: [{
                title: 'Response',
                excerpt: result.response,
                score: 1.0,
                source: 'AI Response'
            }],
            method: searchType,
            ...(feedbackToken && { feedbackToken, feedbackMeta })
        };
    }
};