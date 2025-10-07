import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import pkg from 'hnswlib-node';
const { HierarchicalNSW, L2Space } = pkg;
import Database from 'better-sqlite3';

export class VectorSearch {
  constructor() {
    this.name = 'Vector Database';
    this.description = 'Semantic similarity using embeddings';
    this.db = new Database('./vector_index.db');
    this.vectorIndex = null;
    this.dimension = 384; // all-minilm dimension
    this.setupDatabase();
  }

  setupDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT,
        content TEXT,
        collection TEXT,
        metadata TEXT,
        vector_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_collection ON documents(collection);
    `);
  }

  async initialize() {
    console.log('Vector Database using Ollama all-minilm embeddings');
  }

  async search(query, options = {}) {
    const { collection = null, topK = 5 } = options;
    
    try {
      console.log(`Vector search for: "${query}" in ${collection}`);
      
      await this.ensureDocumentsIndexed(collection);
      const results = await this.searchSimilar(query, collection, topK);
      
      return {
        results: results.map(doc => ({
          id: doc.id,
          title: doc.filename,
          excerpt: doc.content.substring(0, 200) + '...',
          score: 1 - doc.similarity, // Convert distance to similarity
          source: doc.filename
        })),
        method: 'vector',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Vector search failed: ${error.message}`);
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
    const documentFiles = files.filter(file => file.endsWith('.md'));
    
    // Initialize HNSW index
    const space = new L2Space(this.dimension);
    this.vectorIndex = new HierarchicalNSW(space, documentFiles.length * 2);
    console.log(`Indexing ${documentFiles.length} documents for ${collection}`);
    
    for (const filename of documentFiles) {
      const filePath = path.join(collectionPath, filename);
      const content = await secureFs.readFile(filePath, 'utf-8');
      await this.addDocument(filename, content, collection);
    }
    
    // Save index to disk
    this.vectorIndex.writeIndex(`./vector_${collection}.index`);
  }

  async addDocument(filename, content, collection) {
    console.log(`Processing document: ${filename}`);
    const embedding = await this.createEmbedding(content);
    const vectorId = this.vectorIndex.getCurrentCount();
    
    this.vectorIndex.addPoint(embedding, vectorId);
    console.log(`Added document ${filename} with vector ID ${vectorId}`);
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents 
      (id, filename, content, collection, metadata, vector_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const documentId = `${collection}_${filename}`;
    stmt.run(
      documentId,
      filename,
      content,
      collection,
      JSON.stringify({ length: content.length }),
      vectorId
    );
  }

  async searchSimilar(query, collection, k = 5) {
    // Load index if not in memory
    if (!this.vectorIndex) {
      try {
        const space = new L2Space(this.dimension);
        this.vectorIndex = new HierarchicalNSW(space, 1000);
        this.vectorIndex.readIndex(`./vector_${collection}.index`);
      } catch (error) {
        throw new Error(`Vector index not found for collection: ${collection}`);
      }
    }
    
    const queryEmbedding = await this.createEmbedding(query);
    const searchResults = this.vectorIndex.searchKnn(queryEmbedding, k);
    console.log(`Found ${searchResults.neighbors.length} similar documents`);
    
    const documents = [];
    const stmt = this.db.prepare('SELECT * FROM documents WHERE collection = ? AND vector_id = ?');
    
    for (let i = 0; i < searchResults.neighbors.length; i++) {
      const vectorId = searchResults.neighbors[i];
      const distance = searchResults.distances[i];
      const doc = stmt.get(collection, vectorId);
      
      if (doc) {
        documents.push({
          ...doc,
          similarity: distance,
          metadata: JSON.parse(doc.metadata)
        });
      }
    }
    
    return documents;
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