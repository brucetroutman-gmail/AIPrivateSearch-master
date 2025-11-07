 
 
// Server-side query processor for converting phrases to keywords

export class QueryProcessor {
  static extractKeywords(query) {
    const lowerQuery = query.toLowerCase().trim();
    
    const stopWords = [
      'which', 'what', 'who', 'where', 'when', 'why', 'how',
      'are', 'is', 'have', 'has', 'do', 'does', 'did',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    ];
    
    const words = lowerQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Convert multiple keywords to OR search for better matching
    return words.length > 1 ? words.join(' OR ') : words[0] || query;
  }
  
  static shouldProcessQuery(query) {
    const questionWords = ['which', 'what', 'who', 'where', 'when', 'why', 'how'];
    const lowerQuery = query.toLowerCase();
    
    return questionWords.some(word => lowerQuery.includes(word)) || 
           query.trim().split(/\s+/).length > 2;
  }
}