// Common search result formatting utility

class SearchResultFormatter {
  constructor() {
    this.name = 'SearchResultFormatter';
  }

  // Format search results for text-based display (search page)
  formatResultsAsText(results, searchType) {
    if (!results || results.length === 0) {
      return 'No results found.';
    }

    return results.map((result, index) => {
      const docLink = result.documentPath ? `[View Document](${result.documentPath})` : '';
      // Preserve HTML for fulltext to maintain highlighting
      const excerpt = searchType === 'fulltext' ? result.excerpt : result.excerpt;
      return `**Result ${index + 1}: ${result.title}**\n${excerpt}\n${docLink}\n`;
    }).join('\n---\n\n');
  }

  // Format search results for HTML display (multi-mode page)
  formatResultsAsHTML(results, searchType) {
    if (!results || results.length === 0) {
      return '<div class="no-results">No results found</div>';
    }

    if (searchType === 'exact-match') {
      return window.lineSearchFormatter.formatLineSearchResults(results);
    }

    if (searchType === 'fulltext') {
      return window.documentSearchCommon.formatDocumentSearchResults(results);
    }

    // Standard formatting for other search types
    let html = '<div class="search-results">';
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

  // Utility function to escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
window.searchResultFormatter = new SearchResultFormatter();