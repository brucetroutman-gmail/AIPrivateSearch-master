import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import Database from 'better-sqlite3';

export class RAGSearch {
  constructor() {
    this.name = 'RAG Search';
    this.description = 'Chunked documents with AI retrieval';
    this.embedder = null;
    this.db = new Database('./rag_chunks.db');
    this.setupDatabase();
  }

  setupDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT,
        filename TEXT,
        collection TEXT,
        chunk_index INTEGER,
        content TEXT,
        embedding TEXT,
        start_char INTEGER,
        end_char INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_collection ON chunks(collection);
      CREATE INDEX IF NOT EXISTS idx_document ON chunks(document_id);
    `);
  }

  async initialize() {
    // No initialization needed for Ollama embeddings
    console.log('RAG using Ollama all-minilm embeddings');
  }

  async search(query, options = {}) {
    const { collection = null, model = 'qwen2:0.5b', topK = 3 } = options;
    
    try {
      console.log(`RAG search for query: "${query}" in collection: ${collection}`);
      
      await this.initialize();
      await this.ensureChunksExist(collection);
      
      const relevantChunks = await this.findSimilarChunks(query, collection, topK);
      console.log(`Found ${relevantChunks.length} relevant chunks`);
      
      if (relevantChunks.length === 0) {
        return { 
          results: [], 
          method: 'rag', 
          total: 0,
          error: 'No chunks found for this collection. Check if documents were processed.'
        };
      }
      
      const aiResponse = await this.generateAIResponse(query, relevantChunks, model);
      
      return {
        results: [{
          id: `rag_${Date.now()}`,
          title: 'RAG Analysis',
          excerpt: aiResponse,
          score: 0.9,
          source: `${relevantChunks.length} relevant chunks`,
          chunks: relevantChunks.map(chunk => ({
            filename: chunk.filename,
            content: chunk.content.substring(0, 100) + '...',
            similarity: chunk.similarity
          }))
        }],
        method: 'rag',
        total: 1
      };
    } catch (error) {
      console.error('RAG search error:', error);
      throw new Error(`RAG search failed: ${error.message}`);
    }
  }

  async ensureChunksExist(collection) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM chunks WHERE collection = ?');
    const result = stmt.get(collection);
    
    if (result.count === 0) {
      await this.processCollection(collection);
    }
  }

  async processCollection(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    
    const files = await secureFs.readdir(collectionPath);
    const documentFiles = files.filter(file => 
      file.endsWith('.md') && !file.startsWith('META_')
    );
    
    for (const filename of documentFiles) {
      const filePath = path.join(collectionPath, filename);
      const content = await secureFs.readFile(filePath, 'utf-8');
      await this.processDocument(filename, content, collection);
    }
  }

  async processDocument(filename, content, collection) {
    const chunks = this.splitText(content);
    const documentId = `${collection}_${filename}`;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.createEmbedding(chunk.content);
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO chunks 
        (id, document_id, filename, collection, chunk_index, content, embedding, start_char, end_char)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        `${documentId}_chunk_${i}`,
        documentId,
        filename,
        collection,
        i,
        chunk.content,
        JSON.stringify(embedding),
        chunk.startChar,
        chunk.endChar
      );
    }
  }

  splitText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let startChar = 0;
    
    while (startChar < text.length) {
      const endChar = Math.min(startChar + chunkSize, text.length);
      const chunkContent = text.substring(startChar, endChar);
      
      chunks.push({
        content: chunkContent,
        startChar,
        endChar
      });
      
      startChar += chunkSize - overlap;
    }
    
    return chunks;
  }

  async findSimilarChunks(query, collection, topK) {
    const queryEmbedding = await this.createEmbedding(query);
    
    const stmt = this.db.prepare('SELECT * FROM chunks WHERE collection = ?');
    const chunks = stmt.all(collection);
    
    const similarities = chunks.map(chunk => {
      const chunkEmbedding = JSON.parse(chunk.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      
      return {
        ...chunk,
        similarity
      };
    });
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async generateAIResponse(query, chunks, model) {
    const context = chunks.map(chunk => 
      `[${chunk.filename}]: ${chunk.content}`
    ).join('\n\n');
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `Context from documents:\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context:`,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 150
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.response || 'No response generated';
  }

  async createEmbedding(text) {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'all-minilm',
        prompt: text
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama embedding error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.embedding;
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}