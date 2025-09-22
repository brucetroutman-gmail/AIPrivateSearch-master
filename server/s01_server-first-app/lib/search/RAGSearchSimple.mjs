import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';

export class RAGSearchSimple {
  constructor() {
    this.name = 'RAG Search (Simple)';
    this.description = 'Chunked documents with text similarity';
    this.db = new Database('./rag_simple_chunks.db');
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
        start_char INTEGER,
        end_char INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_collection ON chunks(collection);
    `);
  }

  async search(query, options = {}) {
    const { collection = null, model = 'qwen2:0.5b', topK = 3 } = options;
    
    try {
      console.log(`RAG Simple search for: "${query}" in ${collection}`);
      
      await this.ensureChunksExist(collection);
      const relevantChunks = await this.findSimilarChunks(query, collection, topK);
      
      if (relevantChunks.length === 0) {
        return { results: [], method: 'rag-simple', total: 0 };
      }
      
      const aiResponse = await this.generateAIResponse(query, relevantChunks, model);
      
      return {
        results: [{
          id: `rag_simple_${Date.now()}`,
          title: 'RAG Simple Analysis',
          excerpt: aiResponse,
          score: 0.8,
          source: `${relevantChunks.length} text-matched chunks`,
          chunks: relevantChunks.map(chunk => ({
            filename: chunk.filename,
            content: chunk.content.substring(0, 100) + '...',
            similarity: chunk.similarity
          }))
        }],
        method: 'rag-simple',
        total: 1
      };
    } catch (error) {
      throw new Error(`RAG Simple search failed: ${error.message}`);
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
    
    const files = await fs.readdir(collectionPath);
    const documentFiles = files.filter(file => 
      file.endsWith('.md') && !file.startsWith('META_')
    );
    
    for (const filename of documentFiles) {
      const filePath = path.join(collectionPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      await this.processDocument(filename, content, collection);
    }
  }

  async processDocument(filename, content, collection) {
    const chunks = this.splitText(content);
    const documentId = `${collection}_${filename}`;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO chunks 
        (id, document_id, filename, collection, chunk_index, content, start_char, end_char)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        `${documentId}_chunk_${i}`,
        documentId,
        filename,
        collection,
        i,
        chunk.content,
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
    const stmt = this.db.prepare('SELECT * FROM chunks WHERE collection = ?');
    const chunks = stmt.all(collection);
    
    const queryLower = query.toLowerCase();
    const similarities = chunks.map(chunk => {
      const similarity = this.textSimilarity(queryLower, chunk.content.toLowerCase());
      return { ...chunk, similarity };
    });
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  textSimilarity(query, text) {
    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (textWords.some(textWord => textWord.includes(word) || word.includes(textWord))) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
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
}