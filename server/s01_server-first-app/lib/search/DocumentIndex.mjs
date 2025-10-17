import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { OllamaService } from '../services/OllamaService.mjs';
import { ExcerptFormatter } from '../utils/excerptFormatter.mjs';

export class DocumentIndex {
  constructor() {
    this.name = 'Document Index Search';
    this.description = 'Structured queries using document indexes';
  }

  async search(query, options = {}) {
    const { collection = null } = options;
    
    try {
      console.log(`[DocumentIndexSearch] Document Index search for: "${query}" in collection: "${collection}"`);
      
      const dbPath = path.join(process.cwd(), '../../sources', 'local-documents', collection, 'index-cards.db');
      console.log(`[DocumentIndexSearch] Database path: ${dbPath}`);
      
      if (!fs.existsSync(dbPath)) {
        console.log(`[DocumentIndexSearch] Database file does not exist: ${dbPath}`);
        return {
          results: [],
          method: 'document-index',
          total: 0,
          message: `No Doc Index database found for collection: ${collection}. Use Collections Editor to create Doc Indexes first.`
        };
      }

      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      console.log(`[DocumentIndexSearch] Database loaded successfully`);
      
      // Get all table names to verify structure
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      console.log(`[DocumentIndexSearch] Available tables:`, tables);
      
      // Check if document index table exists
      try {
        const countResult = db.exec("SELECT COUNT(*) as count FROM document_index");
        console.log(`[DocumentIndexSearch] Total records in document_index table:`, countResult);
        
        if (!countResult || countResult.length === 0 || !countResult[0].values || countResult[0].values[0][0] === 0) {
          console.log(`[DocumentIndexSearch] No document index found for collection: ${collection}`);
          db.close();
          return {
            results: [],
            method: 'document-index',
            total: 0,
            message: `No Doc Index found for collection: ${collection}. Use Collections Editor to create Doc Indexes first.`
          };
        }
        
        // Show sample data for debugging
        const sampleResult = db.exec("SELECT docid, filename, substr(content, 1, 100) as sample FROM document_index LIMIT 3");
        console.log(`[DocumentIndexSearch] Sample records:`, sampleResult);
        
      } catch (tableError) {
        console.log(`[DocumentIndexSearch] Document index table doesn't exist:`, tableError.message);
        db.close();
        return {
          results: [],
          method: 'document-index',
          total: 0,
          message: `Doc Index table not found in collection database`
        };
      }
      
      // Search in document index table
      const searchQuery = `
        SELECT docid, filename, content
        FROM document_index 
        WHERE content LIKE ? 
           OR filename LIKE ?
        LIMIT 50
      `;
      
      const searchTerm = `%${query}%`;
      console.log(`[DocumentIndexSearch] Executing search with term: "${searchTerm}"`);
      
      const results = db.exec(searchQuery, [searchTerm, searchTerm]);
      console.log(`[DocumentIndexSearch] Raw search results:`, results);
      
      db.close();
      
      if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
        console.log(`[DocumentIndexSearch] No results found`);
        return {
          results: [],
          method: 'document-index',
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
      
      console.log(`[DocumentIndexSearch] Formatted results:`, formattedResults);
      
      return {
        results: formattedResults.map(doc => ({
          id: doc.docid,
          title: doc.filename.replace('.md', '').replace('.json', ''),
          excerpt: ExcerptFormatter.formatExcerptWithLineNumbers(doc.content, query),
          score: doc.score,
          source: doc.filename
        })),
        method: 'document-index',
        total: formattedResults.length
      };
      
    } catch (error) {
      console.error('[DocumentIndexSearch] Document Index search error:', error);
      throw new Error(`Document Index search failed: ${error.message}`);
    }
  }



  async indexCollection(collection) {
    const documentsPath = path.join(process.cwd(), '/Users/Shared/AIPrivateSearch/sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    const dbPath = path.join(collectionPath, 'index-cards.db');
    
    console.log(`Creating AI-powered Doc Index database for collection: ${collection}`);
    
    try {
      const files = fs.readdirSync(collectionPath);
      const documentFiles = files.filter(file => !file.startsWith('DOCIDX_') && (file.endsWith('.md') || file.endsWith('.json')));
      
      console.log(`Processing ${documentFiles.length} documents with AI analysis`);
      
      // Initialize AI service
      const ollamaService = new OllamaService();
      const modelName = 'llama3.2:3b'; // From models-list.json document-index category
      
      // Create new database with all 39 fields (clear existing if present)
      const SQL = await initSqlJs();
      const db = new SQL.Database();
      
      // If database file exists, remove it to start fresh
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log(`Removed existing database: ${dbPath}`);
      }
      
      db.exec(`
        CREATE TABLE document_index (
          docid TEXT PRIMARY KEY,
          collection TEXT,
          filename TEXT,
          content TEXT,
          file_type TEXT,
          file_size INTEGER,
          file_path TEXT,
          title TEXT,
          author TEXT,
          language TEXT,
          source TEXT,
          version TEXT,
          access_level TEXT,
          license TEXT,
          category TEXT,
          created_date TEXT,
          last_modified_date TEXT,
          generated_date TEXT,
          metadata_version TEXT,
          summary TEXT,
          topics TEXT,
          keywords TEXT,
          key_phrases TEXT,
          sentiment TEXT,
          entities TEXT,
          tags TEXT,
          geolocation TEXT,
          complexity_score TEXT,
          readability_score TEXT,
          word_count INTEGER,
          character_count INTEGER,
          reading_time INTEGER,
          paragraphs INTEGER,
          sentences INTEGER,
          unique_word_count INTEGER,
          average_sentence_length REAL,
          links_count INTEGER,
          image_count INTEGER,
          our_comments TEXT
        )
      `);
      
      let processedCount = 0;
      const usedDocIds = new Set();
      
      for (const filename of documentFiles) {
        const fileStartTime = Date.now();
        const filePath = path.join(collectionPath, filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        console.log(`Analyzing ${filename} with AI...`);
        
        // Extract or generate unique DocID
        let docIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
        let docId = docIdMatch ? docIdMatch[1] : `${collection.substring(0, 3)}_${Date.now()}_${processedCount}`;
        
        // Check for duplicate DocID and generate unique one if needed
        let docIdUpdated = false;
        if (usedDocIds.has(docId)) {
          const originalDocId = docId;
          docId = `${collection.substring(0, 3)}_${Date.now()}_${processedCount}`;
          console.log(`Duplicate DocID detected: ${originalDocId}, using generated ID: ${docId}`);
          docIdUpdated = true;
        } else if (!docIdMatch) {
          // Generated new DocID for document without one
          docIdUpdated = true;
        }
        usedDocIds.add(docId);
        
        // Update source document with correct DocID if needed
        if (docIdUpdated) {
          let updatedContent = content;
          if (docIdMatch) {
            // Replace existing DocID
            updatedContent = content.replace(/DocID:\s*[^\s\n]+/, `DocID: ${docId}`);
          } else {
            // Add DocID to document without one (after first line)
            const lines = content.split('\n');
            lines.splice(1, 0, `DocID: ${docId}`);
            updatedContent = lines.join('\n');
          }
          fs.writeFileSync(filePath, updatedContent, 'utf-8');
          console.log(`Updated ${filename} with DocID: ${docId}`);
        }
        
        // AI analysis prompt
        const analysisPrompt = `Analyze this document and extract structured information. Return ONLY a JSON object with these exact fields:

{
  "title": "document title",
  "author": "author name or empty string",
  "language": "language code (en, es, etc)",
  "source": "source or origin",
  "version": "version number or empty string",
  "access_level": "public/private/restricted",
  "license": "license type or empty string",
  "category": "document category",
  "summary": "brief 2-3 sentence summary",
  "topics": "comma-separated main topics",
  "keywords": "comma-separated keywords",
  "key_phrases": "comma-separated key phrases",
  "sentiment": "positive/negative/neutral",
  "entities": "comma-separated named entities",
  "tags": "comma-separated tags",
  "geolocation": "location mentioned or empty string",
  "complexity_score": "1-10 complexity rating",
  "readability_score": "1-10 readability rating"
}

Document content:
${content.substring(0, 4000)}`;
        
        const aiResponse = await ollamaService.generateText(analysisPrompt, modelName);
        let analysis = {};
        
        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`AI model did not return valid JSON for ${filename}`);
        }
        
        // Calculate text metrics
        const words = content.split(/\s+/);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(w => w.length > 0));
        const links = (content.match(/https?:\/\/[^\s]+/g) || []).length;
        const images = (content.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
        
        // Insert with all fields
        const stmt = db.prepare(`INSERT INTO document_index (
          docid, collection, filename, content, file_type, file_size, file_path,
          title, author, language, source, version, access_level, license, category,
          created_date, last_modified_date, generated_date, metadata_version,
          summary, topics, keywords, key_phrases, sentiment, entities, tags,
          geolocation, complexity_score, readability_score,
          word_count, character_count, reading_time, paragraphs, sentences,
          unique_word_count, average_sentence_length, links_count, image_count, our_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run([
          docId, collection, filename, content, filename.split('.').pop(), content.length, filePath,
          analysis.title || filename.replace('.md', ''),
          analysis.author || '',
          analysis.language || 'en',
          analysis.source || '',
          analysis.version || '',
          analysis.access_level || 'public',
          analysis.license || '',
          analysis.category || 'document',
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
          '1.0',
          analysis.summary || '',
          analysis.topics || '',
          analysis.keywords || '',
          analysis.key_phrases || '',
          analysis.sentiment || 'neutral',
          analysis.entities || '',
          analysis.tags || '',
          analysis.geolocation || '',
          analysis.complexity_score || '5',
          analysis.readability_score || '5',
          words.length,
          content.length,
          Math.ceil(words.length / 200),
          paragraphs.length,
          sentences.length,
          uniqueWords.size,
          sentences.length > 0 ? parseFloat((words.length / sentences.length).toFixed(1)) : 0,
          links,
          images,
          ''
        ]);
        stmt.free();
        
        const fileEndTime = Date.now();
        const processingTime = ((fileEndTime - fileStartTime) / 1000).toFixed(1);
        processedCount++;
        console.log(`Processed: ${filename} (DocID: ${docId}) - ${processingTime}s`);
      }
      
      // Save database to file
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      db.close();
      
      console.log(`Created AI-enhanced database: ${dbPath}`);
      return { documentsProcessed: processedCount };
      
    } catch (error) {
      console.error('Error creating document index database:', error);
      throw error;
    }
  }

  async cleanupMetaFiles(collection) {
    const documentsPath = path.join(process.cwd(), '/Users/Shared/AIPrivateSearch/sources/local-documents');
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

  async getDocumentIndex(collection, filename) {
    try {
      const dbPath = path.join(process.cwd(), '../../sources', 'local-documents', collection, 'index-cards.db');
      
      if (!fs.existsSync(dbPath)) {
        console.log(`[DocumentIndex] Database file does not exist: ${dbPath}`);
        return null;
      }

      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      try {
        const results = db.exec("SELECT * FROM document_index WHERE filename = ?", [filename]);
        db.close();
        
        if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
          console.log(`[DocumentIndex] No document index found for ${filename} in ${collection}`);
          return null;
        }
        
        const columns = results[0].columns;
        const row = results[0].values[0];
        const data = {};
        
        // Map columns to values
        columns.forEach((col, index) => {
          data[col] = row[index];
        });
        
        return {
          id: data.docid,
          doc_id: data.docid,
          collection: data.collection || collection,
          filename: data.filename,
          content: data.content || '',
          file_type: data.file_type || filename.split('.').pop(),
          file_size: data.file_size || 0,
          file_path: data.file_path || '',
          title: data.title || '',
          author: data.author || '',
          language: data.language || '',
          source: data.source || '',
          version: data.version || '',
          access_level: data.access_level || '',
          license: data.license || '',
          category: data.category || '',
          created_date: data.created_date || new Date().toISOString(),
          last_modified_date: data.last_modified_date || new Date().toISOString(),
          generated_date: data.generated_date || new Date().toISOString(),
          metadata_version: data.metadata_version || '',
          summary: data.summary || '',
          topics: data.topics || '',
          keywords: data.keywords || '',
          key_phrases: data.key_phrases || '',
          sentiment: data.sentiment || '',
          entities: data.entities || '',
          tags: data.tags || '',
          geolocation: data.geolocation || '',
          complexity_score: data.complexity_score || '',
          readability_score: data.readability_score || '',
          word_count: data.word_count || 0,
          character_count: data.character_count || 0,
          reading_time: data.reading_time || 0,
          paragraphs: data.paragraphs || 0,
          sentences: data.sentences || 0,
          unique_word_count: data.unique_word_count || 0,
          average_sentence_length: data.average_sentence_length || 0,
          links_count: data.links_count || 0,
          image_count: data.image_count || 0,
          our_comments: data.our_comments || ''
        };
      } catch (error) {
        db.close();
        console.error(`[DocumentIndex] Error querying document index:`, error);
        return null;
      }
    } catch (error) {
      console.error(`[DocumentIndex] Error getting document index:`, error);
      return null;
    }
  }

  async updateDocumentIndexComments(id, comments) {
    // Stub method - not implemented for simple document index search
    return { updated: false };
  }

  async getDocumentIndexStatus(collection) {
    try {
      const dbPath = path.join(process.cwd(), '../../sources', 'local-documents', collection, 'index-cards.db');
      
      if (!fs.existsSync(dbPath)) {
        return [];
      }
      
      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      try {
        const results = db.exec("SELECT docid, filename FROM document_index");
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
      console.error('Error getting document index status:', error);
      return [];
    }
  }

  async updateAllDocumentIndex(documentIndex) {
    // Stub method - not implemented for simple document index search
    return { updated: false };
  }

  async indexSingleDocument(collection, filename) {
    const documentsPath = path.join(process.cwd(), '/Users/Shared/AIPrivateSearch/sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    const dbPath = path.join(collectionPath, 'index-cards.db');
    const filePath = path.join(collectionPath, filename);
    
    console.log(`Processing single document: ${filename} in collection: ${collection}`);
    
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filename}`);
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Initialize AI service
      const ollamaService = new OllamaService();
      const modelName = 'llama3.2:3b';
      
      // Initialize or load existing database
      const SQL = await initSqlJs();
      let db;
      
      if (fs.existsSync(dbPath)) {
        const dbBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(dbBuffer);
      } else {
        db = new SQL.Database();
        // Create table if it doesn't exist
        db.exec(`
          CREATE TABLE document_index (
            docid TEXT PRIMARY KEY,
            collection TEXT,
            filename TEXT,
            content TEXT,
            file_type TEXT,
            file_size INTEGER,
            file_path TEXT,
            title TEXT,
            author TEXT,
            language TEXT,
            source TEXT,
            version TEXT,
            access_level TEXT,
            license TEXT,
            category TEXT,
            created_date TEXT,
            last_modified_date TEXT,
            generated_date TEXT,
            metadata_version TEXT,
            summary TEXT,
            topics TEXT,
            keywords TEXT,
            key_phrases TEXT,
            sentiment TEXT,
            entities TEXT,
            tags TEXT,
            geolocation TEXT,
            complexity_score TEXT,
            readability_score TEXT,
            word_count INTEGER,
            character_count INTEGER,
            reading_time INTEGER,
            paragraphs INTEGER,
            sentences INTEGER,
            unique_word_count INTEGER,
            average_sentence_length REAL,
            links_count INTEGER,
            image_count INTEGER,
            our_comments TEXT
          )
        `);
      }
      
      // Check if document already exists in database
      const existingResult = db.exec("SELECT docid FROM document_index WHERE filename = ?", [filename]);
      const isUpdate = existingResult && existingResult.length > 0 && existingResult[0].values.length > 0;
      
      let docId;
      let docIdUpdated = false;
      
      if (isUpdate) {
        // Use existing DocID from database
        docId = existingResult[0].values[0][0];
      } else {
        // Extract DocID from source document or generate new one
        const docIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
        if (docIdMatch) {
          docId = docIdMatch[1];
          // Check if this DocID already exists in database
          const docIdCheck = db.exec("SELECT docid FROM document_index WHERE docid = ?", [docId]);
          if (docIdCheck && docIdCheck.length > 0 && docIdCheck[0].values.length > 0) {
            // Generate unique DocID if conflict
            docId = `${collection.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            docIdUpdated = true;
          }
        } else {
          // Generate new DocID
          docId = `${collection.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          docIdUpdated = true;
        }
      }
      
      // Update source document with DocID if needed
      if (docIdUpdated || !content.includes(`DocID: ${docId}`)) {
        let updatedContent = content;
        const existingDocIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
        
        if (existingDocIdMatch) {
          updatedContent = content.replace(/DocID:\s*[^\s\n]+/, `DocID: ${docId}`);
        } else {
          const lines = content.split('\n');
          lines.splice(1, 0, `DocID: ${docId}`);
          updatedContent = lines.join('\n');
        }
        
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`Updated ${filename} with DocID: ${docId}`);
      }
      
      // AI analysis
      const analysisPrompt = `Analyze this document and extract structured information. Return ONLY a JSON object with these exact fields:

{
  "title": "document title",
  "author": "author name or empty string",
  "language": "language code (en, es, etc)",
  "source": "source or origin",
  "version": "version number or empty string",
  "access_level": "public/private/restricted",
  "license": "license type or empty string",
  "category": "document category",
  "summary": "brief 2-3 sentence summary",
  "topics": "comma-separated main topics",
  "keywords": "comma-separated keywords",
  "key_phrases": "comma-separated key phrases",
  "sentiment": "positive/negative/neutral",
  "entities": "comma-separated named entities",
  "tags": "comma-separated tags",
  "geolocation": "location mentioned or empty string",
  "complexity_score": "1-10 complexity rating",
  "readability_score": "1-10 readability rating"
}

Document content:
${content.substring(0, 4000)}`;
      
      const aiResponse = await ollamaService.generateText(analysisPrompt, modelName);
      let analysis = {};
      
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Clean up common JSON issues
          let jsonStr = jsonMatch[0]
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // Quote unquoted keys
            .replace(/:\s*([^"[\{][^,}\]]*[^,}\]\s])([,}])/g, ': "$1"$2');  // Quote unquoted string values
          
          analysis = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error(`JSON parse error for ${filename}:`, parseError.message);
          console.error('Raw AI response:', aiResponse);
          console.error('Extracted JSON:', jsonMatch[0]);
          
          // Fallback to basic analysis
          analysis = {
            title: filename.replace('.md', ''),
            author: '',
            language: 'en',
            source: '',
            version: '',
            access_level: 'public',
            license: '',
            category: 'document',
            summary: 'AI analysis failed - manual review needed',
            topics: '',
            keywords: '',
            key_phrases: '',
            sentiment: 'neutral',
            entities: '',
            tags: '',
            geolocation: '',
            complexity_score: '5',
            readability_score: '5'
          };
        }
      } else {
        console.error(`No JSON found in AI response for ${filename}:`, aiResponse);
        // Fallback to basic analysis
        analysis = {
          title: filename.replace('.md', ''),
          author: '',
          language: 'en',
          source: '',
          version: '',
          access_level: 'public',
          license: '',
          category: 'document',
          summary: 'AI analysis failed - manual review needed',
          topics: '',
          keywords: '',
          key_phrases: '',
          sentiment: 'neutral',
          entities: '',
          tags: '',
          geolocation: '',
          complexity_score: '5',
          readability_score: '5'
        };
      }
      
      // Calculate text metrics
      const words = content.split(/\s+/);
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(w => w.length > 0));
      const links = (content.match(/https?:\/\/[^\s]+/g) || []).length;
      const images = (content.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
      
      // Insert or update document
      if (isUpdate) {
        const stmt = db.prepare(`UPDATE document_index SET
          content = ?, file_size = ?, title = ?, author = ?, language = ?, source = ?, version = ?,
          access_level = ?, license = ?, category = ?, last_modified_date = ?, generated_date = ?,
          summary = ?, topics = ?, keywords = ?, key_phrases = ?, sentiment = ?, entities = ?, tags = ?,
          geolocation = ?, complexity_score = ?, readability_score = ?, word_count = ?, character_count = ?,
          reading_time = ?, paragraphs = ?, sentences = ?, unique_word_count = ?, average_sentence_length = ?,
          links_count = ?, image_count = ?
          WHERE docid = ?`);
        
        stmt.run([
          content, content.length, analysis.title || filename.replace('.md', ''),
          analysis.author || '', analysis.language || 'en', analysis.source || '', analysis.version || '',
          analysis.access_level || 'public', analysis.license || '', analysis.category || 'document',
          new Date().toISOString(), new Date().toISOString(),
          analysis.summary || '', analysis.topics || '', analysis.keywords || '', analysis.key_phrases || '',
          analysis.sentiment || 'neutral', analysis.entities || '', analysis.tags || '',
          analysis.geolocation || '', analysis.complexity_score || '5', analysis.readability_score || '5',
          words.length, content.length, Math.ceil(words.length / 200), paragraphs.length, sentences.length,
          uniqueWords.size, sentences.length > 0 ? parseFloat((words.length / sentences.length).toFixed(1)) : 0, links, images,
          docId
        ]);
        stmt.free();
      } else {
        const stmt = db.prepare(`INSERT INTO document_index (
          docid, collection, filename, content, file_type, file_size, file_path,
          title, author, language, source, version, access_level, license, category,
          created_date, last_modified_date, generated_date, metadata_version,
          summary, topics, keywords, key_phrases, sentiment, entities, tags,
          geolocation, complexity_score, readability_score,
          word_count, character_count, reading_time, paragraphs, sentences,
          unique_word_count, average_sentence_length, links_count, image_count, our_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run([
          docId, collection, filename, content, filename.split('.').pop(), content.length, filePath,
          analysis.title || filename.replace('.md', ''), analysis.author || '', analysis.language || 'en',
          analysis.source || '', analysis.version || '', analysis.access_level || 'public',
          analysis.license || '', analysis.category || 'document',
          new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), '1.0',
          analysis.summary || '', analysis.topics || '', analysis.keywords || '', analysis.key_phrases || '',
          analysis.sentiment || 'neutral', analysis.entities || '', analysis.tags || '',
          analysis.geolocation || '', analysis.complexity_score || '5', analysis.readability_score || '5',
          words.length, content.length, Math.ceil(words.length / 200), paragraphs.length, sentences.length,
          uniqueWords.size, sentences.length > 0 ? parseFloat((words.length / sentences.length).toFixed(1)) : 0, links, images, ''
        ]);
        stmt.free();
      }
      
      // Save database
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      db.close();
      
      console.log(`${isUpdate ? 'Updated' : 'Created'} document index for: ${filename} (DocID: ${docId})`);
      
      return { docId, updated: isUpdate };
      
    } catch (error) {
      console.error(`Error processing single document ${filename}:`, error);
      throw error;
    }
  }

}