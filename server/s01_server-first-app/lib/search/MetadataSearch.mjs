import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import mime from 'mime-types';

export class MetadataSearch {
  constructor() {
    this.name = 'Metadata Search';
    this.description = 'Structured queries using document metadata';
    this.db = new Database('./metadata.db');
    this.setupDatabase();
  }

  setupDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_metadata (
        id TEXT PRIMARY KEY,
        filename TEXT,
        file_type TEXT,
        file_size INTEGER,
        created_date TEXT,
        collection TEXT,
        word_count INTEGER,
        doc_id TEXT,
        category TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_collection ON document_metadata(collection);
      CREATE INDEX IF NOT EXISTS idx_file_type ON document_metadata(file_type);
      CREATE INDEX IF NOT EXISTS idx_category ON document_metadata(category);
    `);
  }

  async search(query, options = {}) {
    const { collection = null } = options;
    
    try {
      console.log(`Metadata search for: "${query}" in ${collection}`);
      
      await this.ensureMetadataIndexed(collection);
      
      // Parse query for metadata criteria
      const criteria = this.parseQuery(query);
      criteria.collection = collection;
      
      const results = this.searchByMetadata(criteria);
      
      return {
        results: results.map(doc => ({
          id: doc.id,
          title: doc.filename,
          excerpt: `Type: ${doc.file_type} | Size: ${doc.file_size} bytes | Words: ${doc.word_count} | Category: ${doc.category}`,
          score: this.calculateMetadataScore(doc, query),
          source: doc.filename,
          metadata: {
            fileType: doc.file_type,
            fileSize: doc.file_size,
            wordCount: doc.word_count,
            category: doc.category,
            docId: doc.doc_id
          }
        })),
        method: 'metadata',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Metadata search failed: ${error.message}`);
    }
  }

  async ensureMetadataIndexed(collection) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM document_metadata WHERE collection = ?');
    const result = stmt.get(collection);
    
    if (result.count === 0) {
      await this.indexCollection(collection);
    }
  }

  async indexCollection(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    
    const files = await fs.readdir(collectionPath);
    const documentFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`Indexing metadata for ${documentFiles.length} documents in ${collection}`);
    
    for (const filename of documentFiles) {
      const filePath = path.join(collectionPath, filename);
      await this.extractAndStoreMetadata(filePath, filename, collection);
    }
  }

  async extractAndStoreMetadata(filePath, filename, collection) {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Extract DocID from content
    const docIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
    const docId = docIdMatch ? docIdMatch[1] : null;
    
    // Determine category
    let category = 'document';
    if (filename.startsWith('META_')) {
      category = 'metadata';
    } else if (filename.includes('Constitution')) {
      category = 'legal';
    } else if (filename.includes('Declaration')) {
      category = 'legal';
    } else if (filename.includes('Articles')) {
      category = 'legal';
    }
    
    const metadata = {
      id: `${collection}_${filename}`,
      filename,
      fileType: mime.lookup(filename) || 'text/markdown',
      fileSize: stats.size,
      createdDate: stats.birthtime.toISOString(),
      collection,
      wordCount: content.split(/\s+/).length,
      docId,
      category
    };
    
    this.addDocumentMetadata(metadata);
  }

  addDocumentMetadata(metadata) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO document_metadata 
      (id, filename, file_type, file_size, created_date, collection, word_count, doc_id, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      metadata.id,
      metadata.filename,
      metadata.fileType,
      metadata.fileSize,
      metadata.createdDate,
      metadata.collection,
      metadata.wordCount,
      metadata.docId,
      metadata.category
    );
  }

  parseQuery(query) {
    const criteria = {};
    const queryLower = query.toLowerCase();
    
    // File type queries
    if (queryLower.includes('markdown') || queryLower.includes('.md')) {
      criteria.fileType = 'text/markdown';
    }
    if (queryLower.includes('pdf')) {
      criteria.fileType = 'application/pdf';
    }
    
    // Category queries
    if (queryLower.includes('legal') || queryLower.includes('constitution') || queryLower.includes('law')) {
      criteria.category = 'legal';
    }
    if (queryLower.includes('metadata') || queryLower.includes('meta')) {
      criteria.category = 'metadata';
    }
    
    // Size queries
    if (queryLower.includes('large') || queryLower.includes('big')) {
      criteria.minSize = 10000; // 10KB+
    }
    if (queryLower.includes('small')) {
      criteria.maxSize = 5000; // Under 5KB
    }
    
    return criteria;
  }

  searchByMetadata(criteria) {
    let query = 'SELECT * FROM document_metadata WHERE collection = ?';
    const params = [criteria.collection];

    if (criteria.fileType) {
      query += ' AND file_type = ?';
      params.push(criteria.fileType);
    }

    if (criteria.category) {
      query += ' AND category = ?';
      params.push(criteria.category);
    }

    if (criteria.minSize) {
      query += ' AND file_size >= ?';
      params.push(criteria.minSize);
    }

    if (criteria.maxSize) {
      query += ' AND file_size <= ?';
      params.push(criteria.maxSize);
    }

    query += ' ORDER BY file_size DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(params);
  }

  calculateMetadataScore(doc, query) {
    let score = 0.5; // Base score
    
    const queryLower = query.toLowerCase();
    const filenameLower = doc.filename.toLowerCase();
    
    // Filename relevance
    if (filenameLower.includes(queryLower)) {
      score += 0.3;
    }
    
    // Category relevance
    if (queryLower.includes(doc.category)) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }
}