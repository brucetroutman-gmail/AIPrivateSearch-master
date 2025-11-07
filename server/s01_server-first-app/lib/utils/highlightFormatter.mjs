 
 
// Common highlighting utility for search results across all search types

export class HighlightFormatter {
  // Standard highlight function using consistent markup
  static highlightMatches(text, query, useWildcards = false) {
    if (!query || !text) return text;
    
    // Escape regex special characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    if (useWildcards) {
      // For wildcards, highlight any word containing the query
      const regex = new RegExp(`\\b(\\w*${escapedQuery}\\w*)\\b`, 'gi');
      return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    } else {
      // For exact matching, use word boundaries
      const regex = new RegExp(`\\b(${escapedQuery})\\b`, 'gi');
      return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
  }

  // Highlight multiple terms (for OR queries)
  static highlightMultipleTerms(text, terms, useWildcards = false) {
    if (!terms || terms.length === 0 || !text) return text;
    
    let highlightedText = text;
    
    terms.forEach(term => {
      if (term && term.length > 0) {
        highlightedText = this.highlightMatches(highlightedText, term, useWildcards);
      }
    });
    
    return highlightedText;
  }

  // Format line with highlighting and line number
  static formatLineWithHighlight(line, lineNumber, query, useWildcards = false) {
    const highlightedLine = this.highlightMatches(line, query, useWildcards);
    return `${lineNumber}: ${highlightedLine}`;
  }

  // Find and highlight matches in document content
  static findAndHighlightMatches(content, query, useWildcards = false, maxLines = 5) {
    if (!content || !query) return content;
    
    const lines = content.split('\n');
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    // Find lines containing any query term
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineContainsMatch = queryTerms.some(term => 
        line.toLowerCase().includes(term)
      );
      
      if (lineContainsMatch) {
        // Return highlighted line with context
        const startIdx = Math.max(0, i - 1);
        const endIdx = Math.min(lines.length - 1, i + Math.min(maxLines - 1, 2));
        
        const contextLines = [];
        for (let j = startIdx; j <= endIdx; j++) {
          const contextLine = lines[j];
          const highlighted = this.highlightMultipleTerms(contextLine, queryTerms, useWildcards);
          contextLines.push(`${j + 1}: ${highlighted}`);
        }
        
        return contextLines.join('\n');
      }
    }
    
    // If no match found, return first few lines without highlighting
    return lines.slice(0, maxLines).map((line, idx) => `${idx + 1}: ${line}`).join('\n');
  }

  // Extract actual matched word from line (for scoring/metadata)
  static extractMatchedWord(line, query, useWildcards = false) {
    if (!line || !query) return null;
    
    const words = line.match(/\b\w+\b/g) || [];
    const queryLower = query.toLowerCase();
    
    if (useWildcards) {
      return words.find(word => word.toLowerCase().includes(queryLower)) || null;
    } else {
      return words.find(word => word.toLowerCase() === queryLower) || null;
    }
  }
}