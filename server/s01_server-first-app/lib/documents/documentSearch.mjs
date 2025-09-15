<<<<<<< HEAD
import lanceDBService from './lanceDBService.mjs';

export class DocumentSearch {
  constructor(collection) {
    this.collection = collection;
  }

  async initialize() {
    // LanceDB doesn't need initialization
    return;
  }

  async searchDocuments(query, limit = 5) {
    try {
      const { Ollama } = await import('ollama');
      const ollama = new Ollama({ host: 'http://localhost:11434' });
      
      // Generate real embedding for query
      const queryEmbedding = await ollama.embeddings({
        model: 'nomic-embed-text',
        prompt: query
      });
      
      const results = await lanceDBService.search(this.collection, queryEmbedding.embedding, limit);
      return results.map(result => ({
        filename: result.source,
        content: result.text,
        similarity: 1 - result._distance,
        chunkIndex: result.chunkIndex,
        collection: this.collection
      }));
    } catch (error) {
      return [];
    }
  }

  async indexDocument(filename, content) {
    const { connect } = await import('@lancedb/lancedb');
    const path = await import('path');
    const { Ollama } = await import('ollama');
    
    try {
      const ollama = new Ollama({ host: 'http://localhost:11434' });
      const dbPath = path.join(process.cwd(), 'data', 'lancedb');
      const db = await connect(dbPath);
      
      const chunks = this.chunkText(content, 6000, 300); // ~1500 tokens per chunk with overlap
      const documents = [];
      
      // Process chunks in batches for large files
      const batchSize = 5; // Process 5 chunks at a time
      
      for (let batchStart = 0; batchStart < chunks.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, chunks.length);
        const batchChunks = chunks.slice(batchStart, batchEnd);
        
        // Process batch sequentially to avoid overwhelming Ollama
        const batchDocuments = [];
        for (let idx = 0; idx < batchChunks.length; idx++) {
          const chunk = batchChunks[idx];
          const chunkIndex = batchStart + idx;
          
          try {
            const embedding = await ollama.embeddings({
              model: 'nomic-embed-text',
              prompt: chunk
            });
            
            if (!embedding.embedding || embedding.embedding.length !== 768) {
              throw new Error(`Invalid embedding dimensions: ${embedding.embedding?.length || 'undefined'}`);
            }
            
            batchDocuments.push({
              vector: embedding.embedding,
              text: chunk,
              source: filename,
              chunkIndex,
              timestamp: new Date().toISOString()
            });
          } catch (embError) {
            throw new Error(`Embedding failed for chunk ${chunkIndex}: ${embError.message}`);
          }
        }
        documents.push(...batchDocuments);
        
        // Add batch to database immediately to avoid memory buildup
        if (documents.length >= batchSize) {
          let table;
          try {
            table = await db.openTable(this.collection);
            await table.add(documents);
          } catch (error) {
            table = await db.createTable(this.collection, documents);
          }
          documents.length = 0; // Clear processed documents
        }
      }
      
      // Add any remaining documents
      if (documents.length > 0) {
        let table;
        try {
          table = await db.openTable(this.collection);
          await table.add(documents);
        } catch (error) {
          table = await db.createTable(this.collection, documents);
        }
      }
      
      return { 
        success: true, 
        chunks: chunks.length, 
        totalChunks: chunks.length
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  chunkText(text, chunkSize = 500, overlap = 50) {
    if (!text || typeof text !== 'string') {
      return [''];
    }
    
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      // Fix: ensure we always advance, prevent infinite loop
      const nextStart = end - overlap;
      if (nextStart <= start) {
        start = end; // Jump to end if overlap would cause infinite loop
      } else {
        start = nextStart;
      }
      
      if (start >= text.length) break;
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  async removeDocument(filename) {
    return await lanceDBService.removeDocument(this.collection, filename);
  }

  async listIndexedDocuments() {
    return await lanceDBService.listDocuments(this.collection);
=======
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
>>>>>>> master-repo/main
  }
}