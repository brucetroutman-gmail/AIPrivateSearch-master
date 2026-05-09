// Common result formatter for Line Search, Document Search, and Document Index Search

class CommonResultFormatter {
  // Format search results with consistent structure
  static formatSearchResults(results, options = {}) {
    const { 
      resultType = 'search',
      showScore = true,
      defaultCollection = 'unknown'
    } = options;
    
    const container = document.createElement('div');
    
    if (!results || results.length === 0) {
      container.className = 'no-results';
      container.textContent = 'No results found';
      return container;
    }

    container.className = `${resultType}-results`;
    
    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'result-item';
      
      const header = document.createElement('div');
      header.className = 'result-header';
      
      const title = document.createElement('h4');
      
      // Create filename link if available
      if (result.title && window.documentViewerCommon) {
        const collection = result.collection || defaultCollection;
        let filename = result.source || result.filename || result.title;
        
        // For smart-search and hybrid-search, use source as the actual filename
        if ((resultType === 'smart-search' || resultType === 'hybrid-search') && result.source) {
          filename = result.source;
        }
        
        // Extract line number from excerpt or source
        let lineNumber = null;
        
        // For Line Search results, extract filename from source (removes :lineNumber)
        if (filename && filename.includes(':')) {
          const parts = filename.split(':');
          filename = parts[0];
          lineNumber = parts[1];
        }
        
        // Try to extract line number from excerpt (format: "123: content")
        if (!lineNumber && result.excerpt) {
          const lineMatch = result.excerpt.match(/^(\d+):\s/);
          if (lineMatch) {
            lineNumber = lineMatch[1];
          }
        }
        
        // Get search term from the current query for document viewer highlighting
        const searchTerm = result.searchTerm || window._lastSearchQuery || null;
        
        // Use documentPath if available (from line-search results)
        if (result.documentPath) {
          const resultText = document.createTextNode(`Result ${index + 1}: `);
          title.appendChild(resultText);
          
          const filenameLink = document.createElement('a');
          // Append search term to existing documentPath if not already present
          let docUrl = result.documentPath;
          // Prepend API base URL if path is relative
          if (docUrl.startsWith('/api/')) {
            docUrl = window.API_BASE_URL + docUrl;
          }
          if (searchTerm && !docUrl.includes('search=')) {
            docUrl += (docUrl.includes('?') ? '&' : '?') + 'search=' + encodeURIComponent(searchTerm);
          }
          filenameLink.href = docUrl;
          filenameLink.target = '_blank';
          filenameLink.className = 'filename-link';
          filenameLink.textContent = result.title;
          title.appendChild(filenameLink);
        } else {
          const resultText = document.createTextNode(`Result ${index + 1}: `);
          title.appendChild(resultText);
          
          const linkOptions = {};
          if (lineNumber) linkOptions.lineNumber = parseInt(lineNumber);
          if (searchTerm) linkOptions.searchTerm = searchTerm;
          const filenameLink = window.documentViewerCommon.createViewDocumentLink(collection, filename, linkOptions);
          filenameLink.textContent = filename; // Use filename instead of result.title
          filenameLink.className = 'filename-link';
          title.appendChild(filenameLink);
        }
      } else {
        title.textContent = result.title ? 
          `Result ${index + 1}: ${result.title}` : 
          `Result ${index + 1}`;
      }
      
      header.appendChild(title);
      
      if (showScore && result.score !== undefined) {
        const score = document.createElement('span');
        score.className = 'score';
        score.textContent = `${Math.round((result.score || 0) * 100)}%`;
        header.appendChild(score);
      }
      
      const excerpt = document.createElement('div');
      excerpt.className = 'result-excerpt';
      // Use common highlight renderer
      HighlightRenderer.renderHighlightedContent(excerpt, result.excerpt || '');
      
      item.appendChild(header);
      item.appendChild(excerpt);
      container.appendChild(item);
    });
    
    return container;
  }
}

// Make globally available
window.CommonResultFormatter = CommonResultFormatter;