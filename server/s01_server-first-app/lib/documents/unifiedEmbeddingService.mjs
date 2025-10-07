import { SqlJsWrapper } from '../utils/SqlJsWrapper.mjs';
import crypto from 'crypto';

export class UnifiedEmbeddingService {
  constructor() {
    this.db = new SqlJsWrapper('./data/databases/unified_embeddings.db');
    this.initialized = false;
  }

  async setupDatabase() {
    if (!this.initialized) {
      await this.db.init();
      this.initialized = true;
    }
    this.db.exec(`
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
        collection TEXT,
        document_id TEXT,
        filename TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(collection, document_id),
        FOREIGN KEY(document_id) REFERENCES documents(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_collection ON collection_documents(collection);
      CREATE INDEX IF NOT EXISTS idx_document_chunks ON chunks(document_id);
      CREATE INDEX IF NOT EXISTS idx_content_hash ON documents(content_hash);
    `);
  }

  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async processDocument(filename, content, collection) {
    await this.setupDatabase();
    const contentHash = this.generateContentHash(content);
    const documentId = `doc_${contentHash}`;
    
    // Check if document already exists
    const existingDoc = this.db.prepare('SELECT id FROM documents WHERE content_hash = ?').get(contentHash);
    
    if (!existingDoc) {
      // Document doesn't exist, create it with embeddings
      const docStmt = this.db.prepare(`
        INSERT INTO documents (id, filename, content_hash, full_content, document_embedding)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const docEmbedding = await this.createEmbedding(content.substring(0, 8000));
      await docStmt.run(documentId, filename, contentHash, content, JSON.stringify(docEmbedding));
      
      // Create chunks
      const chunks = this.semanticChunking(content);
      const chunkStmt = this.db.prepare(`
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
    const linkStmt = this.db.prepare(`
      INSERT OR IGNORE INTO collection_documents (collection, document_id, filename)
      VALUES (?, ?, ?)
    `);
    await linkStmt.run(collection, documentId, filename);
    
    // Get chunk count
    const chunkCount = this.db.prepare('SELECT COUNT(*) as count FROM chunks WHERE document_id = ?').get(documentId);
    
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
    await this.setupDatabase();
    const queryEmbedding = await this.createEmbedding(query);
    
    const stmt = this.db.prepare(`
      SELECT c.*, cd.filename, cd.collection
      FROM chunks c
      JOIN collection_documents cd ON c.document_id = cd.document_id
      WHERE cd.collection = ?
    `);
    const chunks = stmt.all(collection);
    
    const similarities = chunks.map(chunk => {
      const chunkEmbedding = JSON.parse(chunk.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      
      return { ...chunk, similarity };
    });
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
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

  async removeDocument(collection, filename) {
    await this.setupDatabase();
    // Find document ID for this collection/filename
    const docStmt = this.db.prepare(`
      SELECT document_id FROM collection_documents 
      WHERE collection = ? AND filename = ?
    `);
    const doc = docStmt.get(collection, filename);
    
    if (!doc) {
      return { success: true, message: 'Document not found' };
    }
    
    // Remove from collection
    const removeFromCollection = this.db.prepare(`
      DELETE FROM collection_documents 
      WHERE collection = ? AND filename = ?
    `);
    await removeFromCollection.run(collection, filename);
    
    // Check if document is used in other collections
    const otherCollections = this.db.prepare(`
      SELECT COUNT(*) as count FROM collection_documents 
      WHERE document_id = ?
    `).get(doc.document_id);
    
    // If not used elsewhere, remove document and chunks
    if (otherCollections.count === 0) {
      const deleteChunks = this.db.prepare('DELETE FROM chunks WHERE document_id = ?');
      const deleteDoc = this.db.prepare('DELETE FROM documents WHERE id = ?');
      
      await deleteChunks.run(doc.document_id);
      await deleteDoc.run(doc.document_id);
    }
    
    return { success: true };
  }

  async listDocuments(collection) {
    await this.setupDatabase();
    const stmt = this.db.prepare(`
      SELECT cd.filename, d.processed_at
      FROM collection_documents cd
      JOIN documents d ON cd.document_id = d.id
      WHERE cd.collection = ?
    `);
    return stmt.all(collection);
  }

  async getChunkCounts(collection) {
    await this.setupDatabase();
    const stmt = this.db.prepare(`
      SELECT cd.filename, COUNT(c.id) as chunks 
      FROM collection_documents cd
      JOIN chunks c ON cd.document_id = c.document_id
      WHERE cd.collection = ?
      GROUP BY cd.filename
    `);
    const results = stmt.all(collection);
    
    const counts = {};
    results.forEach(row => {
      counts[row.filename] = row.chunks;
    });
    
    return counts;
  }

  async getStats() {
    await this.setupDatabase();
    const totalDocs = this.db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const totalChunks = this.db.prepare('SELECT COUNT(*) as count FROM chunks').get();
    const totalCollections = this.db.prepare('SELECT COUNT(DISTINCT collection) as count FROM collection_documents').get();
    
    return {
      documents: totalDocs.count,
      chunks: totalChunks.count,
      collections: totalCollections.count
    };
  }
}