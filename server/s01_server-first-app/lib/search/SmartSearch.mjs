import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';

export class SmartSearch {
  constructor() {
    this.name = 'Smart Search';
    this.description = 'Finds conceptually related content using AI understanding';
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async search(query, options = {}) {
    const { collection = null, topK = 5 } = options;
    
    try {
      const relevantChunks = await this.embeddingService.findSimilarChunks(query, collection, topK);
      
      const results = relevantChunks.map((chunk, index) => {
        const relevanceReason = this.explainRelevance(query, chunk.content, chunk.similarity);
        const cleanTitle = this.generateUserFriendlyTitle(chunk.filename, chunk.content, query);
        const smartExcerpt = this.createSmartExcerpt(chunk.content, query);
        
        const documentPath = `http://localhost:3001/api/documents/${chunk.collection}/${chunk.filename}/view`;
        const formattedExcerpt = `${relevanceReason}<br><br>${smartExcerpt}<br><br>[View Document](${documentPath})`;
        
        return {
          id: `vector_${chunk.id}`,
          title: cleanTitle,
          excerpt: formattedExcerpt,
          score: chunk.similarity,
          source: '',
          collection: chunk.collection
        };
      });
      
      return {
        results: results.sort((a, b) => b.score - a.score),
        method: 'vector',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  explainRelevance(query, content, similarity) {
    const percentage = Math.round(similarity * 100);
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    // Find conceptual matches
    const conceptualMatches = [];
    
    // Check for direct word matches
    const directMatches = queryWords.filter(word => contentLower.includes(word));
    
    // Check for related concepts based on common patterns
    if (query.toLowerCase().includes('policy') && contentLower.includes('insurance')) {
      conceptualMatches.push('insurance policy information');
    }
    if (query.toLowerCase().includes('renewal') && (contentLower.includes('effective') || contentLower.includes('period') || contentLower.includes('date'))) {
      conceptualMatches.push('policy dates and periods');
    }
    if (query.toLowerCase().includes('2025') && contentLower.includes('2025')) {
      conceptualMatches.push('2025 dates');
    }
    if (query.toLowerCase().includes('number') && (contentLower.includes('policy number') || contentLower.includes('id') || contentLower.includes('account'))) {
      conceptualMatches.push('identification numbers');
    }
    
    let explanation = `<strong>${percentage}% match</strong> - `;
    
    if (directMatches.length > 0) {
      explanation += `Contains: ${directMatches.join(', ')}`;
    } else if (conceptualMatches.length > 0) {
      explanation += `Related to: ${conceptualMatches.join(', ')}`;
    } else {
      explanation += 'Conceptually similar content';
    }
    
    return explanation;
  }

  generateUserFriendlyTitle(filename, content, query) {
    // Extract document type from filename
    const docType = filename.replace(/[_-]/g, ' ').replace('.md', '').replace(/\b\w/g, l => l.toUpperCase());
    
    // Try to find specific relevant section
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('policy') && queryLower.includes('number')) {
      if (contentLower.includes('policy number')) {
        return `${docType} - Policy Number Information`;
      }
    }
    
    if (queryLower.includes('renewal')) {
      if (contentLower.includes('effective') || contentLower.includes('renewal')) {
        return `${docType} - Renewal & Effective Dates`;
      }
    }
    
    if (queryLower.includes('premium') || queryLower.includes('cost')) {
      if (contentLower.includes('premium') || contentLower.includes('cost')) {
        return `${docType} - Premium Information`;
      }
    }
    
    return docType;
  }

  createSmartExcerpt(content, query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Find sentences that contain query words or related concepts
    const relevantSentences = sentences.filter(sentence => {
      const sentenceLower = sentence.toLowerCase();
      return queryWords.some(word => sentenceLower.includes(word)) ||
             (query.toLowerCase().includes('policy') && sentenceLower.includes('policy')) ||
             (query.toLowerCase().includes('renewal') && (sentenceLower.includes('effective') || sentenceLower.includes('renewal'))) ||
             (query.toLowerCase().includes('number') && (sentenceLower.includes('number') || sentenceLower.includes('id')));
    });
    
    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join('. ').trim() + '.';
    }
    
    // Fallback to first meaningful sentences
    return sentences.slice(0, 2).join('. ').trim().substring(0, 300) + '...';
  }
}