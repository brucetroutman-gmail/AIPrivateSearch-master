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
    // Generate query embedding
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    try {
      const response = await ollama.embeddings({
        model: 'nomic-embed-text',
        prompt: query
      });
      
      const results = await lanceDBService.search(this.collection, response.embedding, limit);
      return results.map(result => ({
        filename: result.source,
        content: result.text,
        similarity: 1 - result._distance,
        chunkIndex: result.chunkIndex,
        collection: this.collection
      }));
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async indexDocument(filename, content) {
    // Skip embedding generation for metadata files
    if (filename.startsWith('_')) {
      return { success: true, chunks: 0, skipped: 'metadata file' };
    }
    
    // Generate embeddings using Ollama
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    // Chunk the content
    const chunks = this.chunkText(content);
    
    // Generate embeddings for each chunk
    const embeddings = [];
    for (const chunk of chunks) {
      try {
        const response = await ollama.embeddings({
          model: 'nomic-embed-text',
          prompt: chunk
        });
        embeddings.push(response.embedding);
      } catch (error) {
        // Fallback: create zero vector if embedding fails
        embeddings.push(new Array(768).fill(0));
      }
    }
    
    await lanceDBService.addDocument(this.collection, filename, chunks, embeddings);
    return { success: true, chunks: chunks.length };
  }
  
  chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk);
      start = end - overlap;
      
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  async removeDocument(filename) {
    return await lanceDBService.removeDocument(this.collection, filename);
  }

  async listIndexedDocuments() {
    return await lanceDBService.listDocuments(this.collection);
  }
}