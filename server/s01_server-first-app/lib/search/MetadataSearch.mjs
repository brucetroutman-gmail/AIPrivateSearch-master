import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import mime from 'mime-types';
import { OllamaService } from '../utils/OllamaService.mjs';

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
        doc_id TEXT,
        collection TEXT,
        our_comments TEXT,
        filename TEXT,
        file_type TEXT,
        file_size INTEGER,
        file_path TEXT,
        created_date TEXT,
        last_modified_date TEXT,
        author TEXT,
        language TEXT,
        source TEXT,
        version TEXT,
        word_count INTEGER,
        access_level TEXT,
        license TEXT,
        title TEXT,
        summary TEXT,
        topics TEXT,
        keywords TEXT,
        key_phrases TEXT,
        category TEXT,
        sentiment TEXT,
        entities TEXT,
        complexity_score INTEGER,
        readability_score TEXT,
        reading_time INTEGER,
        paragraphs INTEGER,
        sentences INTEGER,
        character_count INTEGER,
        unique_word_count INTEGER,
        average_sentence_length INTEGER,
        links_count INTEGER,
        image_count INTEGER,
        generated_date TEXT,
        metadata_version TEXT,
        tags TEXT,
        geolocation TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_collection ON document_metadata(collection);
      CREATE INDEX IF NOT EXISTS idx_file_type ON document_metadata(file_type);
      CREATE INDEX IF NOT EXISTS idx_category ON document_metadata(category);
      CREATE INDEX IF NOT EXISTS idx_author ON document_metadata(author);
      CREATE INDEX IF NOT EXISTS idx_language ON document_metadata(language);
      CREATE INDEX IF NOT EXISTS idx_tags ON document_metadata(tags);
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
        results: results.map(doc => {
          let excerpt = doc.summary || `Type: ${doc.file_type} | Size: ${doc.file_size} bytes | Words: ${doc.word_count} | Category: ${doc.category}`;
          
          // Show specific metadata fields when requested
          if (criteria.showDocIds) {
            excerpt = `DocID: ${doc.doc_id || 'N/A'}`;
          } else if (criteria.showTopics) {
            excerpt = `Topics: ${doc.topics || 'N/A'}`;
          } else if (criteria.showTypes) {
            excerpt = `Type: ${doc.category || 'N/A'}`;
          } else if (criteria.showComments) {
            excerpt = `Comments: ${doc.our_comments || 'N/A'}`;
          }
          
          return {
            id: doc.id,
            title: doc.title || doc.filename,
            excerpt,
            score: this.calculateMetadataScore(doc, query),
            source: doc.filename,
            metadata: {
              fileType: doc.file_type,
              fileSize: doc.file_size,
              wordCount: doc.word_count,
              category: doc.category,
              documentType: doc.category,
              docId: doc.doc_id,
              title: doc.title,
              summary: doc.summary,
              topics: doc.topics ? doc.topics.split(',').map(t => t.trim()) : [],
              keywords: doc.keywords ? doc.keywords.split(',').map(k => k.trim()) : [],
              readingTime: doc.reading_time,
              paragraphs: doc.paragraphs,
              sentences: doc.sentences,
              generatedDate: doc.generated_date
            }
          };
        }),
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
    
    let processedCount = 0;
    for (const filename of documentFiles) {
      const filePath = path.join(collectionPath, filename);
      await this.extractAndStoreMetadata(filePath, filename, collection);
      processedCount++;
    }
    
    return { documentsProcessed: processedCount };
  }

  async cleanupMetaFiles(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    
    const files = await fs.readdir(collectionPath);
    const metaFiles = files.filter(file => file.startsWith('META_'));
    
    let deletedCount = 0;
    for (const filename of metaFiles) {
      const filePath = path.join(collectionPath, filename);
      await fs.unlink(filePath);
      deletedCount++;
      console.log(`Deleted META file: ${filename}`);
    }
    
    return { filesDeleted: deletedCount };
  }

  getDocumentMetadata(collection, filename) {
    const stmt = this.db.prepare('SELECT * FROM document_metadata WHERE collection = ? AND filename = ?');
    return stmt.get(collection, filename);
  }

  updateMetadataComments(id, comments) {
    const stmt = this.db.prepare('UPDATE document_metadata SET our_comments = ? WHERE id = ?');
    const result = stmt.run(comments, id);
    return { updated: result.changes > 0 };
  }

  getMetadataStatus(collection) {
    const stmt = this.db.prepare('SELECT filename FROM document_metadata WHERE collection = ?');
    return stmt.all(collection);
  }

  updateAllMetadata(metadata) {
    const stmt = this.db.prepare(`
      UPDATE document_metadata SET 
        file_path = ?, title = ?, author = ?, language = ?, source = ?, version = ?,
        access_level = ?, license = ?, category = ?, metadata_version = ?, summary = ?, 
        topics = ?, keywords = ?, key_phrases = ?, sentiment = ?, entities = ?, 
        tags = ?, geolocation = ?, complexity_score = ?, readability_score = ?, our_comments = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      metadata.file_path, metadata.title, metadata.author, metadata.language, 
      metadata.source, metadata.version, metadata.access_level, metadata.license, 
      metadata.category, metadata.metadata_version, metadata.summary, metadata.topics, 
      metadata.keywords, metadata.key_phrases, metadata.sentiment, metadata.entities, 
      metadata.tags, metadata.geolocation, metadata.complexity_score, 
      metadata.readability_score, metadata.our_comments, metadata.id
    );
    
    return { updated: result.changes > 0 };
  }

  async extractAndStoreMetadata(filePath, filename, collection) {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Skip META_ files
    if (filename.startsWith('META_')) {
      return;
    }
    
    // Extract or generate DocID
    let docIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
    let docId = docIdMatch ? docIdMatch[1] : null;
    
    // Generate DocID if missing
    if (!docId) {
      docId = `${collection.substring(0, 3)}_${Math.floor(Math.random() * 900000) + 100000}`;
      
      // Add DocID to source file if missing
      const docIdHeader = `---\nDocID: ${docId}\n---\n\n`;
      const updatedContent = docIdHeader + content;
      await fs.writeFile(filePath, updatedContent, 'utf-8');
      console.log(`Added DocID ${docId} to ${filename}`);
    }
    
    // Basic text analysis
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const readingTime = Math.ceil(words.length / 200); // 200 words per minute
    
    // Generate AI metadata (includes document type)
    const aiMetadata = await this.generateAIMetadata(content, filename);
    
    // Use AI-determined document type, fallback to rule-based
    const category = aiMetadata.documentType || this.determineCategory(filename, content);
    
    const metadata = {
      id: `${collection}_${filename}`,
      docId,
      collection,
      ourComments: '',
      filename,
      fileType: mime.lookup(filename) || 'text/markdown',
      fileSize: stats.size,
      filePath: filePath,
      createdDate: stats.birthtime.toISOString(),
      lastModifiedDate: stats.mtime.toISOString(),
      author: aiMetadata.author || '',
      language: aiMetadata.language || 'en',
      source: '',
      version: '1.0',
      wordCount: words.length,
      accessLevel: 'public',
      license: '',
      title: aiMetadata.title || filename.replace(/\.[^/.]+$/, ''),
      summary: aiMetadata.summary || '',
      topics: aiMetadata.topics ? aiMetadata.topics.join(',') : '',
      keywords: aiMetadata.keywords ? aiMetadata.keywords.join(',') : '',
      keyPhrases: aiMetadata.keyPhrases ? aiMetadata.keyPhrases.join(',') : '',
      category: aiMetadata.documentType || category,
      sentiment: aiMetadata.sentiment || '',
      entities: aiMetadata.entities ? aiMetadata.entities.join(',') : '',
      complexityScore: aiMetadata.complexityScore || 50,
      readabilityScore: aiMetadata.readabilityScore || '',
      readingTime,
      paragraphs: paragraphs.length,
      sentences: sentences.length,
      characterCount: content.length,
      uniqueWordCount: [...new Set(words.map(w => w.toLowerCase()))].length,
      averageSentenceLength: Math.round(words.length / sentences.length),
      linksCount: (content.match(/https?:\/\/[^\s]+/g) || []).length,
      imageCount: (content.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length,
      generatedDate: new Date().toISOString(),
      metadataVersion: '1.0',
      tags: aiMetadata.tags ? aiMetadata.tags.join(',') : '',
      geolocation: aiMetadata.geolocation || ''
    };
    
    this.addDocumentMetadata(metadata);
  }

  addDocumentMetadata(metadata) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO document_metadata 
      (id, doc_id, collection, our_comments, filename, file_type, file_size, file_path,
       created_date, last_modified_date, author, language, source, version, word_count,
       access_level, license, title, summary, topics, keywords, key_phrases, category,
       sentiment, entities, complexity_score, readability_score, reading_time, paragraphs,
       sentences, character_count, unique_word_count, average_sentence_length, links_count,
       image_count, generated_date, metadata_version, tags, geolocation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      metadata.id, metadata.docId, metadata.collection, metadata.ourComments,
      metadata.filename, metadata.fileType, metadata.fileSize, metadata.filePath,
      metadata.createdDate, metadata.lastModifiedDate, metadata.author, metadata.language,
      metadata.source, metadata.version, metadata.wordCount, metadata.accessLevel,
      metadata.license, metadata.title, metadata.summary, metadata.topics,
      metadata.keywords, metadata.keyPhrases, metadata.category, metadata.sentiment,
      metadata.entities, metadata.complexityScore, metadata.readabilityScore,
      metadata.readingTime, metadata.paragraphs, metadata.sentences,
      metadata.characterCount, metadata.uniqueWordCount, metadata.averageSentenceLength,
      metadata.linksCount, metadata.imageCount, metadata.generatedDate,
      metadata.metadataVersion, metadata.tags, metadata.geolocation
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
    
    // Document type queries (matching Collections Editor types)
    if (queryLower.includes('legal') || queryLower.includes('constitution') || queryLower.includes('law')) {
      criteria.category = 'legal';
    }
    if (queryLower.includes('literature') || queryLower.includes('novel') || queryLower.includes('book')) {
      criteria.category = 'literature';
    }
    if (queryLower.includes('poetry') || queryLower.includes('poem')) {
      criteria.category = 'poetry';
    }
    if (queryLower.includes('financial') || queryLower.includes('insurance') || queryLower.includes('bank')) {
      criteria.category = 'financial';
    }
    if (queryLower.includes('technical') || queryLower.includes('manual') || queryLower.includes('code')) {
      criteria.category = 'technical';
    }
    if (queryLower.includes('academic') || queryLower.includes('research') || queryLower.includes('study')) {
      criteria.category = 'academic';
    }
    if (queryLower.includes('general')) {
      criteria.category = 'general';
    }
    
    // Size queries
    if (queryLower.includes('large') || queryLower.includes('big')) {
      criteria.minSize = 50000; // 50KB+
    }
    if (queryLower.includes('small')) {
      criteria.maxSize = 10000; // Under 10KB
    }
    
    // Reading time queries
    if (queryLower.includes('long read') || queryLower.includes('lengthy')) {
      criteria.minReadingTime = 60; // 1+ hour
    }
    if (queryLower.includes('quick read') || queryLower.includes('short')) {
      criteria.maxReadingTime = 10; // Under 10 minutes
    }
    
    // DocID queries
    if (queryLower.includes('docid') || queryLower.includes('doc_id')) {
      const searchTerm = query.replace(/docid|doc_id/gi, '').trim();
      if (searchTerm) {
        criteria.docIdSearch = searchTerm;
      } else {
        criteria.showDocIds = true;
      }
    }
    
    // Topic queries
    if (queryLower.includes('topic')) {
      const searchTerm = query.replace(/topics?/gi, '').trim();
      if (searchTerm) {
        criteria.topicSearch = searchTerm;
      } else {
        criteria.showTopics = true;
      }
    }
    
    // Type queries (alias for category)
    if (queryLower.includes('type')) {
      const searchTerm = query.replace(/type/gi, '').trim();
      if (searchTerm) {
        criteria.typeSearch = searchTerm;
      } else {
        criteria.showTypes = true;
      }
    }
    
    // Comments queries
    if (queryLower.includes('comment')) {
      const searchTerm = query.replace(/comments?/gi, '').trim();
      if (searchTerm) {
        criteria.commentsSearch = searchTerm;
      } else {
        criteria.showComments = true;
      }
    }
    
    // If no specific metadata criteria, treat as text search
    if (!criteria.fileType && !criteria.category && !criteria.minSize && !criteria.maxSize && 
        !criteria.docIdSearch && !criteria.topicSearch && !criteria.typeSearch &&
        !criteria.commentsSearch && !criteria.showDocIds && !criteria.showTopics && 
        !criteria.showTypes && !criteria.showComments) {
      criteria.textSearch = query;
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

    if (criteria.minReadingTime) {
      query += ' AND reading_time >= ?';
      params.push(criteria.minReadingTime);
    }

    if (criteria.maxReadingTime) {
      query += ' AND reading_time <= ?';
      params.push(criteria.maxReadingTime);
    }

    // DocID search
    if (criteria.docIdSearch) {
      query += ' AND doc_id LIKE ?';
      params.push(`%${criteria.docIdSearch}%`);
    }
    
    // Topic search
    if (criteria.topicSearch) {
      query += ' AND topics LIKE ?';
      params.push(`%${criteria.topicSearch}%`);
    }
    
    // Type search (category)
    if (criteria.typeSearch) {
      query += ' AND category LIKE ?';
      params.push(`%${criteria.typeSearch}%`);
    }
    
    // Comments search
    if (criteria.commentsSearch) {
      query += ' AND our_comments LIKE ?';
      params.push(`%${criteria.commentsSearch}%`);
    }
    
    // Add text search across rich metadata fields
    if (criteria.textSearch) {
      query += ' AND (title LIKE ? OR summary LIKE ? OR topics LIKE ? OR keywords LIKE ? OR our_comments LIKE ?)';
      const searchTerm = `%${criteria.textSearch}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY word_count DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(params);
  }

  determineCategory(filename, content) {
    const contentLower = content.toLowerCase();
    const filenameLower = filename.toLowerCase();
    
    if (filenameLower.includes('constitution') || filenameLower.includes('declaration') || 
        filenameLower.includes('articles') || contentLower.includes('amendment') ||
        contentLower.includes('congress') || contentLower.includes('government')) {
      return 'legal';
    }
    if (filenameLower.includes('poem') || contentLower.includes('verse') || 
        contentLower.includes('stanza')) {
      return 'poetry';
    }
    if (contentLower.includes('chapter') || contentLower.includes('novel') ||
        filenameLower.includes('karamazov') || filenameLower.includes('gospel')) {
      return 'literature';
    }
    if (filenameLower.includes('insurance') || filenameLower.includes('policy') ||
        filenameLower.includes('financial') || filenameLower.includes('bank')) {
      return 'financial';
    }
    return 'document';
  }

  async generateAIMetadata(content, filename) {
    try {
      const prompt = `Analyze this document and provide comprehensive metadata in JSON format:

${content.substring(0, 2000)}...

Provide:
{
  "title": "Clear document title",
  "summary": "2-3 sentence summary",
  "topics": ["topic1", "topic2", "topic3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "keyPhrases": ["key phrase 1", "key phrase 2"],
  "documentType": "legal|literature|poetry|financial|technical|academic|general",
  "author": "Author name if identifiable",
  "language": "en|es|fr|de|etc",
  "sentiment": "positive|negative|neutral",
  "entities": ["Person", "Organization", "Location"],
  "complexityScore": 75,
  "readabilityScore": "Grade level or Flesch score",
  "tags": ["tag1", "tag2"],
  "geolocation": "Country or region if mentioned"
}

Respond only with valid JSON:`;

      const ollama = new OllamaService();
      const response = await ollama.generateText(prompt, 'qwen2:1.5b');
      return JSON.parse(response);
    } catch (error) {
      console.log('AI metadata generation failed, using fallback');
      return {
        title: filename.replace(/\.[^/.]+$/, ''),
        summary: `Document containing ${content.split(/\s+/).length} words`,
        topics: ['document', 'text'],
        keywords: [filename.replace(/\.[^/.]+$/, ''), 'document'],
        keyPhrases: ['document content'],
        documentType: 'general',
        author: '',
        language: 'en',
        sentiment: 'neutral',
        entities: [],
        complexityScore: 50,
        readabilityScore: 'Unknown',
        tags: [],
        geolocation: ''
      };
    }
  }

  calculateMetadataScore(doc, query) {
    let score = 0.3; // Base score
    const queryLower = query.toLowerCase();
    
    // Title relevance (highest weight)
    if (doc.title && doc.title.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }
    
    // Summary relevance
    if (doc.summary && doc.summary.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }
    
    // Keywords relevance
    if (doc.keywords && doc.keywords.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }
    
    // Topics relevance
    if (doc.topics && doc.topics.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }
    
    // Filename relevance
    if (doc.filename.toLowerCase().includes(queryLower)) {
      score += 0.1;
    }
    
    // Category relevance
    if (queryLower.includes(doc.category)) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }
}