import { SqlJsWrapper } from '../utils/SqlJsWrapper.mjs';
import crypto from 'crypto';
import path from 'path';

export class UnifiedEmbeddingService {
  constructor() {
    this.dbs = new Map(); // Cache for collection databases
    this.initialized = new Set(); // Track initialized collections
  }
  
  getCollectionDbPath(collection) {
    return path.join(process.cwd(), '../../sources/local-documents', collection, 'embeddings.db');
  }
  
  async getCollectionDb(collection) {
    if (!this.dbs.has(collection)) {
      const dbPath = this.getCollectionDbPath(collection);
      this.dbs.set(collection, new SqlJsWrapper(dbPath));
    }
    return this.dbs.get(collection);
  }

  async setupDatabase(collection) {
    if (!this.initialized.has(collection)) {
      const db = await this.getCollectionDb(collection);
      await db.init();
      this.initialized.add(collection);
    }
    const db = await this.getCollectionDb(collection);
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT,
        content_hash TEXT UNIQUE,
        full_content TEXT,
        document_embedding TEXT,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT,
        chunk_index INTEGER,
        content TEXT,
        embedding TEXT,
        start_char INTEGER,
        end_char INTEGER,
        chunk_type TEXT DEFAULT 'semantic',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(document_id) REFERENCES documents(id)
      );
      
      CREATE TABLE IF NOT EXISTS collection_documents (
        document_id TEXT PRIMARY KEY,
        filename TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(document_id) REFERENCES documents(id)
      );
      CREATE INDEX IF NOT EXISTS idx_document_chunks ON chunks(document_id);
      CREATE INDEX IF NOT EXISTS idx_content_hash ON documents(content_hash);
    `);
  }

  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async processDocument(filename, content, collection) {
    await this.setupDatabase(collection);
    const db = await this.getCollectionDb(collection);
    const contentHash = this.generateContentHash(content);
    const documentId = `doc_${contentHash}`;
    
    // Check if document already exists
    const existingDoc = db.prepare('SELECT id FROM documents WHERE content_hash = ?').get(contentHash);
    
    if (!existingDoc) {
      // Document doesn't exist, create it with embeddings
      const docStmt = db.prepare(`
        INSERT INTO documents (id, filename, content_hash, full_content, document_embedding)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const docEmbedding = await this.createEmbedding(content.substring(0, 8000));
      await docStmt.run(documentId, filename, contentHash, content, JSON.stringify(docEmbedding));
      
      // Create chunks
      const chunks = this.semanticChunking(content);
      const chunkStmt = db.prepare(`
        INSERT INTO chunks (id, document_id, chunk_index, content, embedding, start_char, end_char, chunk_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.createEmbedding(chunk.content);
        
        await chunkStmt.run(
          `${documentId}_chunk_${i}`,
          documentId,
          i,
          chunk.content,
          JSON.stringify(embedding),
          chunk.startChar,
          chunk.endChar,
          chunk.type
        );
      }
    }
    
    // Link document to collection (if not already linked)
    const linkStmt = db.prepare(`
      INSERT OR IGNORE INTO collection_documents (document_id, filename)
      VALUES (?, ?)
    `);
    await linkStmt.run(documentId, filename);
    
    // Get chunk count
    const chunkCount = db.prepare('SELECT COUNT(*) as count FROM chunks WHERE document_id = ?').get(documentId);
    
    return { success: true, chunks: chunkCount.count, reused: !!existingDoc };
  }

  semanticChunking(text, chunkSize = 1200) {
    const chunks = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    let startChar = 0;
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (currentChunk.length > 0 && (currentChunk.length + trimmedParagraph.length) > chunkSize) {
        chunks.push({
          content: currentChunk.trim(),
          startChar,
          endChar: startChar + currentChunk.length,
          type: 'semantic'
        });
        
        startChar += currentChunk.length;
        currentChunk = trimmedParagraph + '\n\n';
      } else {
        currentChunk += trimmedParagraph + '\n\n';
      }
    }
    
    if (currentChunk.trim().length > 50) {
      chunks.push({
        content: currentChunk.trim(),
        startChar,
        endChar: startChar + currentChunk.length,
        type: 'semantic'
      });
    }
    
    return chunks;
  }

  async findSimilarChunks(query, collection, topK = 5) {
    await this.setupDatabase(collection);
    const db = await this.getCollectionDb(collection);
    const queryEmbedding = await this.createEmbedding(query);
    
    const stmt = db.prepare(`
      SELECT c.*, cd.filename
      FROM chunks c
      JOIN collection_documents cd ON c.document_id = cd.document_id
    `);
    const chunks = stmt.all();
    
    const similarities = chunks.map(chunk => {
      const chunkEmbedding = JSON.parse(chunk.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      
      return { ...chunk, similarity };
    });
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(chunk => ({ ...chunk, collection }));
  }

  async createEmbedding(text) {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
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

  async removeDocument(collection, filename) {
    await this.setupDatabase(collection);
    const db = await this.getCollectionDb(collection);
    // Find document ID for this collection/filename
    const docStmt = db.prepare(`
      SELECT document_id FROM collection_documents 
      WHERE filename = ?
    `);
    const doc = docStmt.get(filename);
    
    if (!doc) {
      return { success: true, message: 'Document not found' };
    }
    
    // Remove from collection (always remove since it's per-collection)
    const removeFromCollection = db.prepare(`
      DELETE FROM collection_documents 
      WHERE filename = ?
    `);
    await removeFromCollection.run(filename);
    
    // Remove document and chunks (no need to check other collections)
    const deleteChunks = db.prepare('DELETE FROM chunks WHERE document_id = ?');
    const deleteDoc = db.prepare('DELETE FROM documents WHERE id = ?');
    
    await deleteChunks.run(doc.document_id);
    await deleteDoc.run(doc.document_id);
    
    return { success: true };
  }

  async listDocuments(collection) {
    await this.setupDatabase(collection);
    const db = await this.getCollectionDb(collection);
    const stmt = db.prepare(`
      SELECT cd.filename, d.processed_at
      FROM collection_documents cd
      JOIN documents d ON cd.document_id = d.id
    `);
    return stmt.all();
  }

  async getChunkCounts(collection) {
    await this.setupDatabase(collection);
    const db = await this.getCollectionDb(collection);
    const stmt = db.prepare(`
      SELECT cd.filename, COUNT(c.id) as chunks 
      FROM collection_documents cd
      JOIN chunks c ON cd.document_id = c.document_id
      GROUP BY cd.filename
    `);
    const results = stmt.all();
    
    const counts = {};
    results.forEach(row => {
      counts[row.filename] = row.chunks;
    });
    
    return counts;
  }

  async getStats(collection) {
    await this.setupDatabase(collection);
    const db = await this.getCollectionDb(collection);
    const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const totalChunks = db.prepare('SELECT COUNT(*) as count FROM chunks').get();
    
    return {
      documents: totalDocs.count,
      chunks: totalChunks.count,
      collection: collection
    };
  }
}