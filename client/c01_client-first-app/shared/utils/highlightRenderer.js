// Common client-side utility for rendering highlighted search results

class HighlightRenderer {
  // Check if content contains highlighting markup
  static hasHighlighting(content) {
    return content && (
      content.includes('<mark class="search-highlight">') || 
      content.includes('<mark>')
    );
  }

  // Safely render highlighted content in DOM element
  static renderHighlightedContent(element, content) {
    if (!element || !content) return;
    
    // Format line numbers with content on separate lines
    let formattedContent = content;
    if (typeof content === 'string') {
      // Replace spaces between line numbers with line breaks, but keep line number with its content
      formattedContent = content.replace(/(\d+:\s[^}]+[},])\s+(\d+:)/g, '$1\n$2');
    }
    
    if (this.hasHighlighting(formattedContent)) {
      // Use sanitized HTML for highlighted content, convert newlines to <br>
      const htmlContent = DOMSanitizer.sanitizeHTML(formattedContent).replace(/\n/g, '<br>');
      element.innerHTML = htmlContent;
    } else {
      // Use safe text content for non-highlighted content, convert newlines to <br>
      const htmlContent = formattedContent.replace(/\n/g, '<br>');
      element.innerHTML = htmlContent;
    }
  }

  // Create element with highlighted content
  static createHighlightedElement(tagName, content, className = '') {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    
    this.renderHighlightedContent(element, content);
    return element;
  }
}

// Make globally available
window.HighlightRenderer = HighlightRenderer;