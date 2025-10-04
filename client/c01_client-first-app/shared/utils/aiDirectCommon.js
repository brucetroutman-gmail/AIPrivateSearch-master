// Common AI Direct search functionality

const aiDirectCommon = {
  // Perform AI Direct search
  async performAIDirectSearch(query, collection, options = {}) {
    const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/ai-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        options: { 
          collection, 
          model: options.model,
          temperature: options.temperature,
          contextSize: options.contextSize,
          tokenLimit: options.tokenLimit
        } 
      })
    });
    
    const data = await response.json();
    return {
      results: data.results || [],
      searchType: 'ai-direct',
      query,
      collection
    };
  },

  // Format AI Direct results for display
  formatAIDirectResults(results) {
    if (!results || results.length === 0) {
      return 'No AI Direct results found';
    }

    return results.map((result, index) => {
      return `**Result ${index + 1}: ${result.title}**\n${result.excerpt}\n\n*Source: ${result.source}*\n---`;
    }).join('\n\n');
  },

  // Handle AI Direct search for search page
  async handleSearchPageAIDirectSearch(query, collection, options = {}) {
    try {
      const searchResult = await this.performAIDirectSearch(query, collection, options);
      const formattedResults = this.formatAIDirectResults(searchResult.results);
      
      return {
        response: formattedResults,
        searchType: 'ai-direct',
        query: searchResult.query,
        collection: searchResult.collection,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`AI Direct search failed: ${error.message}`);
    }
  }
};

// Make available globally
window.aiDirectCommon = aiDirectCommon;