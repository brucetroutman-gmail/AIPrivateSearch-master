// Common Hybrid Search functionality for both search and multi-mode pages

window.hybridSearchCommon = {
    // Perform Hybrid Search combining keyword and semantic methods.
    // When a model is supplied, the server runs a RAG generation step over the
    // reranked results and returns a grounded answer plus fullPrompt.
    async performHybridSearch(query, collection, topK = 5, extraOptions = {}) {
        const startTime = Date.now();

        try {
            const options = {
                collection,
                topK,
                ...(extraOptions.model !== undefined && { model: extraOptions.model }),
                ...(extraOptions.temperature !== undefined && { temperature: extraOptions.temperature }),
                ...(extraOptions.contextSize !== undefined && { contextSize: extraOptions.contextSize }),
                ...(extraOptions.tokenLimit !== undefined && { tokenLimit: extraOptions.tokenLimit })
            };
            const response = await window.csrfManager.fetch(`${window.API_BASE_URL}/api/multi-search/hybrid-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, options })
            });

            const data = await response.json();
            return {
                results: data.results || [],
                time: Date.now() - startTime,
                method: 'hybrid-search',
                ...(data.fullPrompt && { fullPrompt: data.fullPrompt })
            };
        } catch (error) {
            console.error('Hybrid Search error:', error);
            return { results: [], time: Date.now() - startTime, method: 'hybrid-search' };
        }
    },

    // Convert Hybrid Search results to search page format
    convertToSearchPageFormat(searchResult, collection) {
        if (!searchResult.results || searchResult.results.length === 0) {
            return {
                response: 'No relevant documents found using Hybrid Search.',
                searchType: 'hybrid',
                collection
            };
        }

        // Format results as markdown with score breakdowns
        const responseText = searchResult.results.map((result, index) => {
            const score = result.score || 0.5;
            const percentage = Math.round(score * 100);
            const title = result.title || `Result ${index + 1}`;
            
            // Extract score breakdown from excerpt if present
            let scoreBreakdown = '';
            let cleanExcerpt = result.excerpt;
            
            if (result.excerpt && result.excerpt.includes('**Hybrid Score:') && result.excerpt.includes('Keyword:')) {
                const parts = result.excerpt.split('\n\n');
                if (parts.length >= 2) {
                    scoreBreakdown = parts[0] + '\n' + parts[1]; // Include both score lines
                    cleanExcerpt = parts.slice(2).join('\n\n');
                }
            } else {
                // Create score breakdown if not present
                scoreBreakdown = `**Hybrid Score: ${percentage}%**\nCombined keyword and semantic similarity`;
            }
            
            let formattedResult = `**Result ${index + 1}: ${title}**\n`;
            if (scoreBreakdown) {
                formattedResult += `${scoreBreakdown}\n\n`;
            }
            formattedResult += `${cleanExcerpt}`;
            
            return formattedResult;
        }).join('\n\n---\n\n');

        return {
            response: responseText,
            searchType: 'hybrid',
            collection,
            results: searchResult.results.map(r => ({ ...r, score: r.score || 0.5 }))
        };
    }
};