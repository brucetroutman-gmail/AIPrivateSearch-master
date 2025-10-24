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
    
    if (this.hasHighlighting(content)) {
      // Use sanitized HTML for highlighted content
      element.innerHTML = DOMSanitizer.sanitizeHTML(content);
    } else {
      // Use safe text content for non-highlighted content
      element.textContent = content;
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