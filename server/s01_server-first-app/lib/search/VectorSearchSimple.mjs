import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';

export class VectorSearchSimple {
  constructor() {
    this.name = 'Vector Search Simple';
    this.description = 'Semantic similarity using embeddings';
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async search(query, options = {}) {
    const { collection = null, topK = 5 } = options;
    
    try {
      const relevantChunks = await this.embeddingService.findSimilarChunks(query, collection, topK);
      
      const results = relevantChunks.map((chunk, index) => ({
        id: `vector_${chunk.id}`,
        title: `Vector Match: ${chunk.filename}`,
        excerpt: chunk.content.substring(0, 200) + '...',
        score: chunk.similarity,
        source: `${chunk.filename} (chunk ${chunk.chunk_index})`,
        collection: chunk.collection
      }));
      
      return {
        results: results.sort((a, b) => b.score - a.score),
        method: 'vector',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }
}