import { EmbeddingService } from './embeddingService.mjs';
import { VectorStore } from './vectorStore.mjs';

export class DocumentSearch {
  constructor(collection) {
    this.collection = collection;
    this.embeddingService = new EmbeddingService();
    this.vectorStore = new VectorStore(collection);
  }

  async initialize() {
    await this.vectorStore.initialize();
  }

  async searchDocuments(query, limit = 5) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const results = await this.vectorStore.searchSimilar(queryEmbedding, limit);
    
    return results.map(result => ({
      filename: result.filename,
      content: result.content,
      similarity: result.similarity,
      chunkIndex: result.chunkIndex,
      collection: this.collection
    }));
  }

  async indexDocument(filename, content, metadata = {}) {
    const chunks = this.embeddingService.chunkText(content);
    const embeddings = await this.embeddingService.generateBatchEmbeddings(chunks);
    
    await this.vectorStore.addDocument(filename, chunks, embeddings, {
      ...metadata,
      originalLength: content.length,
      chunksCount: chunks.length
    });
    
    return { success: true, chunks: chunks.length };
  }

  async removeDocument(filename) {
    await this.vectorStore.removeDocument(filename);
    return { success: true };
  }

  async listIndexedDocuments() {
    return await this.vectorStore.listDocuments();
  }
}