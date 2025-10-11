import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

export class DocumentIndex {
  constructor() {
    this.name = 'Metadata Search';
    this.description = 'Structured queries using document metadata';
  }

  async search(query, options = {}) {
    const { collection = null } = options;
    
    try {
      console.log(`[MetadataSearch] Document Index search for: "${query}" in collection: "${collection}"`);
      
      const dbPath = path.join(process.cwd(), '../../sources', 'local-documents', collection, 'collection.db');
      console.log(`[MetadataSearch] Database path: ${dbPath}`);
      
      if (!fs.existsSync(dbPath)) {
        console.log(`[MetadataSearch] Database file does not exist: ${dbPath}`);
        return {
          results: [],
          method: 'metadata',
          total: 0,
          message: `No Doc Index database found for collection: ${collection}. Use Collections Editor to create Doc Indexes first.`
        };
      }

      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      console.log(`[MetadataSearch] Database loaded successfully`);
      
      // Get all table names to verify structure
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      console.log(`[MetadataSearch] Available tables:`, tables);
      
      // Check if metadata table exists
      try {
        const countResult = db.exec("SELECT COUNT(*) as count FROM metadata");
        console.log(`[MetadataSearch] Total records in metadata table:`, countResult);
        
        if (!countResult || countResult.length === 0 || !countResult[0].values || countResult[0].values[0][0] === 0) {
          console.log(`[MetadataSearch] No metadata found for collection: ${collection}`);
          db.close();
          return {
            results: [],
            method: 'metadata',
            total: 0,
            message: `No Doc Index found for collection: ${collection}. Use Collections Editor to create Doc Indexes first.`
          };
        }
        
        // Show sample data for debugging
        const sampleResult = db.exec("SELECT docid, filename, substr(content, 1, 100) as sample FROM metadata LIMIT 3");
        console.log(`[MetadataSearch] Sample records:`, sampleResult);
        
      } catch (tableError) {
        console.log(`[MetadataSearch] Metadata table doesn't exist:`, tableError.message);
        db.close();
        return {
          results: [],
          method: 'metadata',
          total: 0,
          message: `Doc Index table not found in collection database`
        };
      }
      
      // Search in metadata table
      const searchQuery = `
        SELECT docid, filename, content
        FROM metadata 
        WHERE content LIKE ? 
           OR filename LIKE ?
        LIMIT 50
      `;
      
      const searchTerm = `%${query}%`;
      console.log(`[MetadataSearch] Executing search with term: "${searchTerm}"`);
      
      const results = db.exec(searchQuery, [searchTerm, searchTerm]);
      console.log(`[MetadataSearch] Raw search results:`, results);
      
      db.close();
      
      if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
        console.log(`[MetadataSearch] No results found`);
        return {
          results: [],
          method: 'metadata',
          total: 0,
          message: `No documents found matching "${query}" in ${collection}`
        };
      }
      
      const formattedResults = results[0].values.map(row => ({
        docid: row[0],
        filename: row[1],
        content: row[2],
        score: 1.0
      }));
      
      console.log(`[MetadataSearch] Formatted results:`, formattedResults);
      
      return {
        results: formattedResults.map(doc => ({
          id: doc.docid,
          title: doc.filename.replace('.md', ''),
          excerpt: doc.content.substring(0, 200) + '...',
          score: doc.score,
          source: doc.filename
        })),
        method: 'metadata',
        total: formattedResults.length
      };
      
    } catch (error) {
      console.error('[MetadataSearch] Document Index search error:', error);
      throw new Error(`Document Index search failed: ${error.message}`);
    }
  }



  async indexCollection(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    const dbPath = path.join(collectionPath, 'collection.db');
    
    console.log(`Creating Doc Index database for collection: ${collection}`);
    
    try {
      const files = fs.readdirSync(collectionPath);
      const documentFiles = files.filter(file => file.endsWith('.md') && !file.startsWith('META_'));
      
      console.log(`Processing ${documentFiles.length} documents`);
      
      // Create new database
      const SQL = await initSqlJs();
      const db = new SQL.Database();
      
      // Create metadata table
      db.exec(`
        CREATE TABLE metadata (
          docid TEXT PRIMARY KEY,
          filename TEXT,
          content TEXT
        )
      `);
      
      let processedCount = 0;
      for (const filename of documentFiles) {
        const filePath = path.join(collectionPath, filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract or generate DocID
        let docIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
        let docId = docIdMatch ? docIdMatch[1] : `${collection.substring(0, 3)}_${Math.floor(Math.random() * 900000) + 100000}`;
        
        // Insert into database
        const stmt = db.prepare('INSERT INTO metadata (docid, filename, content) VALUES (?, ?, ?)');
        stmt.run([docId, filename, content]);
        stmt.free();
        
        processedCount++;
        console.log(`Processed: ${filename} (DocID: ${docId})`);
      }
      
      // Save database to file
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      db.close();
      
      console.log(`Created database: ${dbPath}`);
      return { documentsProcessed: processedCount };
      
    } catch (error) {
      console.error('Error creating metadata database:', error);
      throw error;
    }
  }

  async cleanupMetaFiles(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    
    const files = fs.readdirSync(collectionPath);
    const metaFiles = files.filter(file => file.startsWith('META_'));
    
    let deletedCount = 0;
    for (const filename of metaFiles) {
      const filePath = path.join(collectionPath, filename);
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`Deleted META file: ${filename}`);
    }
    
    return { filesDeleted: deletedCount };
  }

  async getDocumentMetadata(collection, filename) {
    try {
      const dbPath = path.join(process.cwd(), '../../sources', 'local-documents', collection, 'collection.db');
      
      if (!fs.existsSync(dbPath)) {
        console.log(`[DocumentIndex] Database file does not exist: ${dbPath}`);
        return null;
      }

      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      try {
        const results = db.exec("SELECT docid, filename, content FROM metadata WHERE filename = ?", [filename]);
        db.close();
        
        if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
          console.log(`[DocumentIndex] No document index found for ${filename} in ${collection}`);
          return null;
        }
        
        const row = results[0].values[0];
        const content = row[2] || '';
        
        return {
          id: row[0], // docid
          doc_id: row[0],
          collection: collection,
          filename: row[1],
          content: content,
          // Add other fields that might be expected by the UI
          file_type: filename.split('.').pop(),
          file_size: content.length,
          created_date: new Date().toISOString(),
          last_modified_date: new Date().toISOString(),
          generated_date: new Date().toISOString(),
          word_count: content ? content.split(/\s+/).length : 0,
          character_count: content.length,
          // Initialize empty fields for the editor
          file_path: '',
          title: '',
          author: '',
          language: '',
          source: '',
          version: '',
          access_level: '',
          license: '',
          category: '',
          metadata_version: '',
          summary: '',
          topics: '',
          keywords: '',
          key_phrases: '',
          sentiment: '',
          entities: '',
          tags: '',
          geolocation: '',
          complexity_score: '',
          readability_score: '',
          reading_time: Math.ceil((content ? content.split(/\s+/).length : 0) / 200), // Assume 200 words per minute
          paragraphs: content ? content.split(/\n\s*\n/).length : 0,
          sentences: content ? content.split(/[.!?]+/).length - 1 : 0,
          unique_word_count: 0,
          average_sentence_length: 0,
          links_count: 0,
          image_count: 0,
          our_comments: ''
        };
      } catch (error) {
        db.close();
        console.error(`[DocumentIndex] Error querying metadata:`, error);
        return null;
      }
    } catch (error) {
      console.error(`[DocumentIndex] Error getting document metadata:`, error);
      return null;
    }
  }

  async updateMetadataComments(id, comments) {
    // Stub method - not implemented for simple metadata search
    return { updated: false };
  }

  async getMetadataStatus(collection) {
    try {
      const dbPath = path.join(process.cwd(), '../../sources', 'local-documents', collection, 'collection.db');
      
      if (!fs.existsSync(dbPath)) {
        return [];
      }
      
      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      try {
        const results = db.exec("SELECT docid, filename FROM metadata");
        db.close();
        
        if (!results || results.length === 0 || !results[0].values) {
          return [];
        }
        
        return results[0].values.map(row => ({
          docid: row[0],
          filename: row[1]
        }));
      } catch (error) {
        db.close();
        return [];
      }
    } catch (error) {
      console.error('Error getting metadata status:', error);
      return [];
    }
  }

  async updateAllMetadata(metadata) {
    // Stub method - not implemented for simple metadata search
    return { updated: false };
  }


}