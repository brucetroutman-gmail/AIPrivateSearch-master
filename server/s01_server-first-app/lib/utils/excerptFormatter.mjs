// Common excerpt formatting utility for search results

export class ExcerptFormatter {
  // Format excerpt with line numbers and highlighting
  static formatExcerptWithLineNumbers(content, query, maxLines = 5) {
    if (!content) return '';
    
    const lines = content.split('\n');
    let excerptLines = [];
    let foundMatch = false;
    
    // Find lines containing the query
    for (let i = 0; i < lines.length && excerptLines.length < maxLines; i++) {
      const line = lines[i];
      if (query && line.toLowerCase().includes(query.toLowerCase())) {
        // Add context: previous line, match line, next line
        const startIdx = Math.max(0, i - 1);
        const endIdx = Math.min(lines.length - 1, i + 1);
        
        for (let j = startIdx; j <= endIdx && excerptLines.length < maxLines; j++) {
          const lineNum = j + 1;
          const lineContent = lines[j];
          const highlighted = query ? 
            lineContent.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi'), '<mark>$1</mark>') :
            lineContent;
          excerptLines.push(`${lineNum}: ${highlighted}`);
        }
        foundMatch = true;
        break;
      }
    }
    
    // If no match found, show first few lines
    if (!foundMatch) {
      for (let i = 0; i < Math.min(maxLines, lines.length); i++) {
        excerptLines.push(`${i + 1}: ${lines[i]}`);
      }
    }
    
    return excerptLines.join('\n');
  }

  // Simple highlight function
  static highlightMatches(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}