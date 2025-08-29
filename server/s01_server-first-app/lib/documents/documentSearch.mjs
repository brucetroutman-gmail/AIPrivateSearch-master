import { EmbeddingService } from './embeddingService.mjs';
import { VectorStore } from './vectorStore.mjs';
import lanceDBService from './lanceDBService.mjs';

export class DocumentSearch {
  constructor(collection, vectorDB = 'local') {
    this.collection = collection;
    this.vectorDB = vectorDB;
    this.embeddingService = new EmbeddingService();
    if (vectorDB === 'local') {
      this.vectorStore = new VectorStore(collection);
    }
  }

  async initialize() {
    if (this.vectorStore) {
      await this.vectorStore.initialize();
    }
    if (this.vectorDB === 'lanceDB') {
      await lanceDBService.initialize();
    }
  }

  async searchDocuments(query, limit = 5) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    
    if (this.vectorDB === 'lanceDB') {
      const results = await lanceDBService.search(this.collection, queryEmbedding, limit);
      return results.map(result => ({
        filename: result.source,
        content: result.text,
        similarity: 1 - result._distance, // Convert distance to similarity
        chunkIndex: result.chunkIndex,
        collection: this.collection
      }));
    } else {
      const results = await this.vectorStore.searchSimilar(queryEmbedding, limit);
      return results.map(result => ({
        filename: result.filename,
        content: result.content,
        similarity: result.similarity,
        chunkIndex: result.chunkIndex,
        collection: this.collection
      }));
    }
  }

  async indexDocument(filename, content, vectorDB = 'local', metadata = {}) {
    const chunks = this.embeddingService.chunkText(content);
    const embeddings = await this.embeddingService.generateBatchEmbeddings(chunks);
    
    const documentMetadata = {
      ...metadata,
      originalLength: content.length,
      chunksCount: chunks.length
    };
    
    if (vectorDB === 'lanceDB') {
      await lanceDBService.addDocument(this.collection, filename, chunks, embeddings);
    } else {
      await this.vectorStore.addDocument(filename, chunks, embeddings, documentMetadata);
    }
    
    return { success: true, chunks: chunks.length };
  }

  async removeDocument(filename) {
    if (this.vectorDB === 'local' && this.vectorStore) {
      await this.vectorStore.removeDocument(filename);
    }
    return { success: true };
  }

  async listIndexedDocuments() {
    return await this.vectorStore.listDocuments();
  }
}