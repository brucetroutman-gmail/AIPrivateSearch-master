// Common document search functionality for both search and multi-mode pages

class DocumentSearchCommon {
  constructor() {
    this.name = 'DocumentSearchCommon';
  }

  // Perform document search using the document-search endpoint
  async performDocumentSearch(query, collection, useWildcards = false) {
    const startTime = Date.now();
    
    try {
      const response = await window.csrfManager.fetch('http://localhost:3001/api/multi-search/document-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          options: { 
            collection, 
            useWildcards 
          } 
        })
      });
      
      const data = await response.json();
      return { 
        results: data.results || [], 
        time: Date.now() - startTime, 
        method: 'document-search' 
      };
    } catch (error) {
      console.error('Document search error:', error);
      return { results: [], time: Date.now() - startTime, method: 'document-search' };
    }
  }

  // Format document search results for display (safe DOM creation)
  formatDocumentSearchResults(results) {
    const container = document.createElement('div');
    
    if (!results || results.length === 0) {
      container.className = 'no-results';
      container.textContent = 'No documents found';
      return container;
    }

    container.className = 'document-search-results';
    
    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'result-item';
      
      const header = document.createElement('div');
      header.className = 'result-header';
      
      const title = document.createElement('h4');
      title.textContent = result.title || '';
      
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
      if (result.documentPath && window.documentViewerCommon) {
        const link = window.documentViewerCommon.createViewDocumentLink(result.collection || 'default', result.filename || result.title);
        if (link) meta.appendChild(link);
      }
      
      item.appendChild(header);
      item.appendChild(excerpt);
      item.appendChild(meta);
      container.appendChild(item);
    });
    
    return container;
  }

  // Add document search option to search type dropdown
  addDocumentSearchOption(searchTypeElement) {
    if (!searchTypeElement) return;
    
    // Check if option already exists
    const existingOption = Array.from(searchTypeElement.options).find(opt => opt.value === 'document-search');
    if (existingOption) return;
    
    const option = document.createElement('option');
    option.value = 'document-search';
    option.textContent = 'Document Search';
    searchTypeElement.appendChild(option);
  }

  // Handle document search in search page context
  async handleSearchPageDocumentSearch(query, collection, useWildcards = false) {
    const searchResult = await this.performDocumentSearch(query, collection, useWildcards);
    
    if (!searchResult.results || searchResult.results.length === 0) {
      return 'No relevant documents found using Document Search.';
    }

    // For search page, return formatted text response
    return searchResult.results.map((result, index) => {
      const docLink = result.documentPath ? `[View Document](${result.documentPath})` : '';
      return `**Result ${index + 1}: ${result.title}**\n${result.excerpt.replace(/<[^>]*>/g, '')}\n${docLink}\n`;
    }).join('\n---\n\n');
  }



  // Check if document search is available for current source type
  isDocumentSearchAvailable(sourceType) {
    return sourceType && sourceType.includes('Docu');
  }

  // Get document search display name
  getDisplayName() {
    return 'Document Search';
  }

  // Get document search description
  getDescription() {
    return 'Document-wide search with ranking and Boolean logic';
  }
}

// Create global instance
window.documentSearchCommon = new DocumentSearchCommon();