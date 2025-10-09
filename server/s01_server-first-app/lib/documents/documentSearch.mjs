import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';

export class DocumentSearch {
  constructor(collection, vectorDB = 'local') {
    this.collection = collection;
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async initialize() {
    // No initialization needed for unified embedding service
  }

  async searchDocuments(query, limit = 5) {
    const results = await this.embeddingService.findSimilarChunks(query, this.collection, limit);
    
    if (results.length === 0) {
      return [{
        filename: 'System Message',
        content: `No embeddings found for collection "${this.collection}". Please use the Collections Editor to embed documents first by clicking "Embed Source MDs".`,
        similarity: 0
      }];
    }
    
    return results;
  }
  
  buildMetadataFirstPrompt(query, results) {
    let prompt = `Based on the following documents, answer the question:\n\n`;
    
    results.forEach((chunk, index) => {
      prompt += `Document ${index + 1} (${chunk.filename}):\n${chunk.content}\n\n`;
    });
    
    prompt += `Question: ${query}\n\nAnswer:`;
    
    return prompt;
  }

  async indexDocument(filename, content, vectorDB = 'local', metadata = {}) {
    const result = await this.embeddingService.addDocument(content, filename, this.collection);
    return { success: true, chunks: result.chunksAdded };
  }

  async removeDocument(filename) {
    // Remove from unified embedding service
    await this.embeddingService.removeDocumentFromCollection(filename, this.collection);
    return { success: true };
  }

  async listIndexedDocuments() {
    return await this.embeddingService.getCollectionDocuments(this.collection);
  }
}