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

  // Format document search results for display
  formatDocumentSearchResults(results) {
    if (!results || results.length === 0) {
      return '<div class="no-results">No documents found</div>';
    }

    let html = '<div class="document-search-results">';
    
    results.forEach((result, index) => {
      html += `
        <div class="result-item">
          <div class="result-header">
            <h4>${this.escapeHtml(result.title)}</h4>
            <span class="score">${Math.round(result.score * 100)}%</span>
          </div>
          <div class="result-excerpt">
            ${result.excerpt}
          </div>
          <div class="result-meta">
            <span class="source">${this.escapeHtml(result.source)}</span>
            ${result.documentPath ? `<a href="${result.documentPath}" target="_blank" style="margin-left: 10px; color: #007bff;">[View Document]</a>` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
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

  // Utility function to escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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