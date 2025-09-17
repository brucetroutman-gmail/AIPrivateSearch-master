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
    
    let allResults = [];
    
    if (this.vectorDB === 'lanceDB') {
      const results = await lanceDBService.search(this.collection, queryEmbedding, limit * 2); // Get more results for filtering
      allResults = results.map(result => ({
        filename: result.source,
        content: result.text,
        similarity: 1 - result._distance,
        chunkIndex: result.chunkIndex,
        collection: this.collection
      }));
    } else {
      const results = await this.vectorStore.searchSimilar(queryEmbedding, limit * 2);
      allResults = results.map(result => ({
        filename: result.filename,
        content: result.content,
        similarity: result.similarity,
        chunkIndex: result.chunkIndex,
        collection: this.collection
      }));
    }
    
    // Prioritize META files and organize results
    return this.prioritizeMetadataResults(allResults, limit);
  }
  
  prioritizeMetadataResults(results, limit) {
    // Separate META files from source documents
    const metaResults = results.filter(r => r.filename.startsWith('META_'));
    const sourceResults = results.filter(r => !r.filename.startsWith('META_'));
    
    // Prioritize collection metadata first
    const collectionMeta = metaResults.filter(r => r.filename.includes('_Collection.md'));
    const documentMeta = metaResults.filter(r => !r.filename.includes('_Collection.md'));
    
    // Combine in priority order: Collection META -> Document META -> Source documents
    const prioritizedResults = [
      ...collectionMeta.slice(0, 2), // Max 2 collection chunks
      ...documentMeta.slice(0, Math.floor(limit * 0.4)), // Up to 40% document META
      ...sourceResults.slice(0, Math.ceil(limit * 0.6)) // At least 60% source content
    ];
    
    return prioritizedResults.slice(0, limit);
  }
  
  buildMetadataFirstPrompt(query, results) {
    const metaChunks = results.filter(r => r.filename.startsWith('META_'));
    const sourceChunks = results.filter(r => !r.filename.startsWith('META_'));
    
    let prompt = `SEARCH QUERY: ${query}\n\n`;
    
    if (metaChunks.length > 0) {
      prompt += `=== METADATA CONTEXT (READ FIRST) ===\n`;
      prompt += `Please read and understand this metadata context before analyzing source documents:\n\n`;
      
      metaChunks.forEach((chunk, index) => {
        prompt += `META CHUNK ${index + 1} (${chunk.filename}):\n${chunk.content}\n\n`;
      });
    }
    
    if (sourceChunks.length > 0) {
      prompt += `=== SOURCE DOCUMENT CONTENT ===\n`;
      prompt += `Now analyze these source documents using the metadata context above:\n\n`;
      
      sourceChunks.forEach((chunk, index) => {
        prompt += `SOURCE CHUNK ${index + 1} (${chunk.filename}):\n${chunk.content}\n\n`;
      });
    }
    
    prompt += `=== INSTRUCTIONS ===\n`;
    prompt += `1. First, use the METADATA CONTEXT to understand the collection structure and document relationships\n`;
    prompt += `2. Then, analyze the SOURCE DOCUMENT CONTENT with this metadata context in mind\n`;
    prompt += `3. Provide your response based on both the metadata understanding and source content\n`;
    prompt += `4. Reference specific metadata insights when relevant to the query\n`;
    
    return prompt;
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