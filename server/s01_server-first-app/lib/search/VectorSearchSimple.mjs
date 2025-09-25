import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import Database from 'better-sqlite3';

export class VectorSearchSimple {
  constructor() {
    this.name = 'Vector Database (Simple)';
    this.description = 'Semantic similarity using embeddings (in-memory)';
    this.db = new Database('./vector_simple.db');
    this.setupDatabase();
  }

  setupDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT,
        content TEXT,
        collection TEXT,
        embedding TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_collection ON documents(collection);
    `);
  }

  async search(query, options = {}) {
    const { collection = null, topK = 5 } = options;
    
    try {
      console.log(`Vector Simple search for: "${query}" in ${collection}`);
      
      await this.ensureDocumentsIndexed(collection);
      const results = await this.searchSimilar(query, collection, topK);
      
      return {
        results: results.map(doc => ({
          id: doc.id,
          title: doc.filename,
          excerpt: doc.content.substring(0, 200) + '...',
          score: doc.similarity,
          source: doc.filename
        })),
        method: 'vector-simple',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Vector Simple search failed: ${error.message}`);
    }
  }

  async ensureDocumentsIndexed(collection) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM documents WHERE collection = ?');
    const result = stmt.get(collection);
    
    if (result.count === 0) {
      await this.indexCollection(collection);
    }
  }

  async indexCollection(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    
    const files = await secureFs.readdir(collectionPath);
    const documentFiles = files.filter(file => 
      file.endsWith('.md') && !file.startsWith('META_')
    );
    
    console.log(`Indexing ${documentFiles.length} documents for ${collection}`);
    
    for (const filename of documentFiles) {
      const filePath = path.join(collectionPath, filename);
      const content = await secureFs.readFile(filePath, 'utf-8');
      await this.addDocument(filename, content, collection);
    }
  }

  async addDocument(filename, content, collection) {
    console.log(`Processing document: ${filename}`);
    const embedding = await this.createEmbedding(content);
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents 
      (id, filename, content, collection, embedding)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const documentId = `${collection}_${filename}`;
    stmt.run(
      documentId,
      filename,
      content,
      collection,
      JSON.stringify(embedding)
    );
  }

  async searchSimilar(query, collection, k = 5) {
    const queryEmbedding = await this.createEmbedding(query);
    
    const stmt = this.db.prepare('SELECT * FROM documents WHERE collection = ?');
    const documents = stmt.all(collection);
    
    const similarities = documents.map(doc => {
      const docEmbedding = JSON.parse(doc.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      
      return {
        ...doc,
        similarity
      };
    });
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
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
}