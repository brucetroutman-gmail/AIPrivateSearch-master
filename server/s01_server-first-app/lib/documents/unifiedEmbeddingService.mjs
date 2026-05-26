 
 
import { SqlJsWrapper } from '../utils/SqlJsWrapper.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import { modelConfig } from '../utils/modelConfig.mjs';
import crypto from 'crypto';
import path from 'path';

// Per-Collection Embedding Service - manages individual databases for each collection
export class UnifiedEmbeddingService {
  constructor() {
    this.dbs = new Map(); // Cache for per-collection databases
    this.initialized = new Set(); // Track initialized collections
  }
  
  getCollectionDbPath(collection) {
    return path.join(CollectionsUtil.getCollectionsPath(), collection, 'embeddings.db');
  }
  
  async getCollectionDb(collection) {
    if (!this.dbs.has(collection)) {
      const dbPath = this.getCollectionDbPath(collection);
      this.dbs.set(collection, new SqlJsWrapper(dbPath));
    }
    return this.dbs.get(collection);
  }

  async setupDatabase(collection) {
    console.log(`[PerCollectionEmbeddingService] Setting up database for collection: ${collection}`);
    
    if (!this.initialized.has(collection)) {
      const db = await this.getCollectionDb(collection);
      await db.init();
      this.initialized.add(collection);
      console.log(`[PerCollectionEmbeddingService] Database initialized for collection: ${collection}`);
    }
    
    const db = await this.getCollectionDb(collection);
    const dbPath = this.getCollectionDbPath(collection);
    console.log(`[UnifiedEmbeddingService] Database path: ${dbPath}`);
    
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
    
    console.log(`[UnifiedEmbeddingService] Database tables created/verified for collection: ${collection}`);
  }

  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async processDocument(filename, content, collection, options = {}) {
    console.log(`[UnifiedEmbeddingService] Processing document: ${filename} in collection: ${collection}`);
    
    const embedModel = await modelConfig.getEmbeddingModel();
    const { useTransformers = false, model = embedModel } = options;
    
    await this.setupDatabase(collection);
    const db = await this.getCollectionDb(collection);
    const contentHash = this.generateContentHash(content);
    const documentId = `doc_${contentHash}`;
    
    console.log(`[UnifiedEmbeddingService] Document ID: ${documentId}, Content hash: ${contentHash}`);
    
    // Check if document already exists
    const existingDoc = db.prepare('SELECT id FROM documents WHERE content_hash = ?').get(contentHash);
    console.log(`[UnifiedEmbeddingService] Existing document found:`, !!existingDoc);
    
    if (!existingDoc) {
      console.log(`[UnifiedEmbeddingService] Creating new document with embeddings...`);
      
      // Document doesn't exist, create it with embeddings
      const docStmt = db.prepare(`
        INSERT INTO documents (id, filename, content_hash, full_content, document_embedding)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const docEmbedding = await this.createEmbedding(content.substring(0, 1500), useTransformers, model);
      console.log(`[UnifiedEmbeddingService] Document embedding created, length: ${docEmbedding.length}`);
      
      const docResult = await docStmt.run(documentId, filename, contentHash, content, JSON.stringify(docEmbedding));
      console.log(`[UnifiedEmbeddingService] Document inserted, changes: ${docResult.changes}`);
      
      // Create chunks
      const chunks = this.semanticChunking(content);
      console.log(`[UnifiedEmbeddingService] Created ${chunks.length} chunks`);
      
      const chunkStmt = db.prepare(`
        INSERT INTO chunks (id, document_id, chunk_index, content, embedding, start_char, end_char, chunk_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`[UnifiedEmbeddingService] Processing chunk ${i + 1}/${chunks.length}`);
        
        const embedding = await this.createEmbedding(chunk.content, useTransformers, model);
        
        const chunkResult = await chunkStmt.run(
          `${documentId}_chunk_${i}`,
          documentId,
          i,
          chunk.content,
          JSON.stringify(embedding),
          chunk.startChar,
          chunk.endChar,
          chunk.type
        );
        console.log(`[UnifiedEmbeddingService] Chunk ${i} inserted, changes: ${chunkResult.changes}`);
      }
    }
    
    // Link document to collection (if not already linked)
    const linkStmt = db.prepare(`
      INSERT OR IGNORE INTO collection_documents (document_id, filename)
      VALUES (?, ?)
    `);
    const linkResult = await linkStmt.run(documentId, filename);
    console.log(`[UnifiedEmbeddingService] Collection link created, changes: ${linkResult.changes}`);
    
    // Get chunk count
    const chunkCount = db.prepare('SELECT COUNT(*) as count FROM chunks WHERE document_id = ?').get(documentId);
    console.log(`[UnifiedEmbeddingService] Final chunk count: ${chunkCount.count}`);
    
    // Verify data was saved
    const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const totalChunks = db.prepare('SELECT COUNT(*) as count FROM chunks').get();
    const collectionDocs = db.prepare('SELECT COUNT(*) as count FROM collection_documents').get();
    console.log(`[UnifiedEmbeddingService] Database totals - Documents: ${docCount.count}, Chunks: ${totalChunks.count}, Collection docs: ${collectionDocs.count}`);
    
    return { success: true, chunks: chunkCount.count, reused: !!existingDoc };
  }

  semanticChunking(text, chunkSize = 800, overlap = 150) {
    const chunks = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    let startChar = 0;
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();

      // If a single paragraph exceeds chunkSize, split it by sentences or fixed size
      const subParagraphs = trimmedParagraph.length > chunkSize
        ? this.splitLargeParagraph(trimmedParagraph, chunkSize)
        : [trimmedParagraph];

      for (const sub of subParagraphs) {
        if (currentChunk.length > 0 && (currentChunk.length + sub.length) > chunkSize) {
          chunks.push({
            content: currentChunk.trim(),
            startChar,
            endChar: startChar + currentChunk.length,
            type: 'semantic'
          });
          // Carry forward last `overlap` chars of current chunk into next
          const overlapText = currentChunk.slice(-overlap).trim();
          startChar += currentChunk.length - overlapText.length;
          currentChunk = overlapText + '\n\n' + sub + '\n\n';
        } else {
          currentChunk += sub + '\n\n';
        }
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

  // Split a large paragraph by sentences, falling back to fixed-size slices
  splitLargeParagraph(text, chunkSize) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const parts = [];
    let current = '';
    for (const sentence of sentences) {
      if (current.length + sentence.length > chunkSize && current.length > 0) {
        parts.push(current.trim());
        current = sentence + ' ';
      } else {
        current += sentence + ' ';
      }
    }
    if (current.trim().length > 0) parts.push(current.trim());
    // If still too large (no sentence breaks), slice by fixed size
    const result = [];
    for (const part of parts) {
      if (part.length > chunkSize) {
        for (let i = 0; i < part.length; i += chunkSize) {
          result.push(part.slice(i, i + chunkSize));
        }
      } else {
        result.push(part);
      }
    }
    return result;
  }

  async findSimilarChunks(query, collection, topK = 5, options = {}) {
    console.log(`[UnifiedEmbeddingService] Finding similar chunks for "${query}" in collection: "${collection}"`);
    console.log(`[UnifiedEmbeddingService] Collection parameter type: ${typeof collection}`);
    console.log(`[UnifiedEmbeddingService] Collection parameter length: ${collection?.length}`);
    
    const embedModel = await modelConfig.getEmbeddingModel();
    const { useTransformers = false, model = embedModel } = options;
    
    try {
      await this.setupDatabase(collection);
      const db = await this.getCollectionDb(collection);
      
      // Check if database file exists and has tables
      const dbPath = this.getCollectionDbPath(collection);
      console.log(`[UnifiedEmbeddingService] Database path: ${dbPath}`);
      
      // Check table existence
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log(`[UnifiedEmbeddingService] Available tables:`, tables.map(t => t.name));
      
      // Check data counts
      const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get();
      const chunkCount = db.prepare('SELECT COUNT(*) as count FROM chunks').get();
      const collectionDocCount = db.prepare('SELECT COUNT(*) as count FROM collection_documents').get();
      console.log(`[UnifiedEmbeddingService] Data counts - Documents: ${docCount.count}, Chunks: ${chunkCount.count}, Collection docs: ${collectionDocCount.count}`);
      
      if (chunkCount.count === 0) {
        console.log(`[UnifiedEmbeddingService] No chunks found - embeddings may not be created yet`);
        return [];
      }
      
      console.log(`[UnifiedEmbeddingService] Creating query embedding...`);
      const queryEmbedding = await this.createEmbedding(query, useTransformers, model);
      console.log(`[UnifiedEmbeddingService] Query embedding created, length: ${queryEmbedding.length}`);
      
      const stmt = db.prepare(`
        SELECT c.*, cd.filename
        FROM chunks c
        JOIN collection_documents cd ON c.document_id = cd.document_id
      `);
      const chunks = stmt.all();
      console.log(`[UnifiedEmbeddingService] Found ${chunks.length} chunks in database`);
    
      
      const similarities = chunks.map(chunk => {
        const chunkEmbedding = JSON.parse(chunk.embedding);
        const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
        
        return { ...chunk, similarity };
      });
      
      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(chunk => ({ ...chunk, collection }));
        
      console.log(`[UnifiedEmbeddingService] Returning ${results.length} results, top similarity: ${results[0]?.similarity || 'N/A'}`);
      return results;
    } catch (error) {
      console.error(`[UnifiedEmbeddingService] Error in findSimilarChunks:`, error);
      return [];
    }
  }

  async createEmbedding(text, useTransformers = false, model = null) {
    if (!model) {
      model = await modelConfig.getEmbeddingModel();
    }
    console.log(`[UnifiedEmbeddingService] Creating embedding for text: "${text.substring(0, 100)}..."`);
    
    if (useTransformers) {
      try {
        const { sentenceTransformerService } = await import('../embeddings/SentenceTransformerService.mjs');
        const result = await sentenceTransformerService.generateEmbedding(text, model);
        console.log(`[UnifiedEmbeddingService] Sentence transformer embedding created, length: ${result.embedding.length}`);
        return result.embedding;
      } catch (error) {
        console.error(`[UnifiedEmbeddingService] Sentence transformer failed, falling back to Ollama:`, error);
        // Fall through to Ollama
      }
    }
    
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: text
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[UnifiedEmbeddingService] Ollama embedding error: ${response.status} - ${errorText}`);
      throw new Error(`Ollama embedding error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[UnifiedEmbeddingService] Embedding created successfully, length: ${result.embedding?.length || 'unknown'}`);
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