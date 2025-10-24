// Common result formatter for Line Search, Document Search, and Document Index Search

class CommonResultFormatter {
  // Format search results with consistent structure
  static formatSearchResults(results, options = {}) {
    const { 
      resultType = 'search',
      showScore = true,
      defaultCollection = 'default'
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
      title.textContent = result.title ? 
        `Result ${index + 1}: ${result.title}` : 
        `Result ${index + 1}`;
      
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
      
      const meta = document.createElement('div');
      meta.className = 'result-meta';
      
      // Add View Document link if available
      if (window.documentViewerCommon) {
        const collection = result.collection || defaultCollection;
        let filename = result.source || result.filename || result.title;
        
        // For Line Search results, extract filename from source (removes :lineNumber)
        if (filename && filename.includes(':')) {
          filename = filename.split(':')[0];
        }
        
        // Create link if we have a filename
        if (filename) {
          const link = window.documentViewerCommon.createViewDocumentLink(collection, filename);
          if (link) meta.appendChild(link);
        }
      }
      
      item.appendChild(header);
      item.appendChild(excerpt);
      item.appendChild(meta);
      container.appendChild(item);
    });
    
    return container;
  }
}

// Make globally available
window.CommonResultFormatter = CommonResultFormatter;