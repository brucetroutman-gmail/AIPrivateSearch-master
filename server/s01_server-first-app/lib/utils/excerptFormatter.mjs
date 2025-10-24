// Common excerpt formatting utility for search results
import { HighlightFormatter } from './highlightFormatter.mjs';

export class ExcerptFormatter {
  // Format excerpt with line numbers and highlighting
  static formatExcerptWithLineNumbers(content, query, maxLines = 5) {
    if (!content) return '';
    return HighlightFormatter.findAndHighlightMatches(content, query, false, maxLines);
  }

  // Simple highlight function - delegates to common utility
  static highlightMatches(text, query) {
    return HighlightFormatter.highlightMatches(text, query);
  }
}