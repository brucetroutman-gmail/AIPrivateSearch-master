 
 
/* eslint-disable security/detect-non-literal-fs-filename */
 
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { OllamaService } from '../services/OllamaService.mjs';
import { ExcerptFormatter } from '../utils/excerptFormatter.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import { SetupGuidance } from '../utils/setupGuidance.mjs';
import { QueryProcessor } from '../utils/queryProcessor.mjs';
import { NLPAnalytics } from '../nlp/NLPAnalytics.mjs';

let systemPrompts = null;

async function loadSystemPrompts() {
  if (!systemPrompts) {
    const promptsPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/system-prompts.json');
    const data = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    systemPrompts = data.system_prompts;
  }
  return systemPrompts;
}

export class DocumentIndex {
  constructor() {
    this.name = 'Document Index Search';
    this.description = 'Structured queries using document indexes';
  }

  async search(query, options = {}) {
    const { collection = null } = options;
    
    // Process natural language queries into keywords
    let processedQuery = query;
    if (QueryProcessor.shouldProcessQuery(query)) {
      processedQuery = QueryProcessor.extractKeywords(query);
      console.log(`[DocumentIndexSearch] Converted "${query}" to "${processedQuery}"`);
    }
    
    try {
      console.log(`[DocumentIndexSearch] Document Index search for: "${processedQuery}" in collection: "${collection}"`);
      
      const dbPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'index-cards.db');
      console.log(`[DocumentIndexSearch] Database path: ${dbPath}`);
      
      if (!fs.existsSync(dbPath)) {
        console.log(`[DocumentIndexSearch] Database file does not exist: ${dbPath}`);
        return SetupGuidance.createDocIndexRequiredResult(collection, 'document-index');
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
          return SetupGuidance.createEmptyDocIndexResult(collection, 'document-index');
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
      
      const searchTerm = `%${processedQuery}%`;
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
          message: `No documents found matching "${processedQuery}" in ${collection}`
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
          excerpt: ExcerptFormatter.formatExcerptWithLineNumbers(doc.content, processedQuery),
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
    const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), collection);
    const dbPath = path.join(collectionPath, 'index-cards.db');
    
    console.log(`Creating AI-powered Doc Index database for collection: ${collection}`);
    
    try {
      const files = fs.readdirSync(collectionPath);
      const documentFiles = files.filter(file => !file.startsWith('DOCIDX_') && (file.endsWith('.md') || file.endsWith('.json')));
      
      console.log(`Processing ${documentFiles.length} documents with AI analysis`);
      
      // Initialize AI service and NLP analytics
      const ollamaService = new OllamaService();
      let nlpAnalytics = null;
      try {
        nlpAnalytics = new NLPAnalytics();
        console.log('[DocumentIndex] NLP Analytics initialized successfully');
      } catch (nlpError) {
        console.error('[DocumentIndex] Failed to initialize NLP Analytics:', nlpError.message);
        console.log('[DocumentIndex] Continuing without NLP analytics');
      }
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
          document_type TEXT,
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
          dates_mentioned TEXT,
          amounts_mentioned TEXT,
          action_items TEXT,
          importance_level TEXT,
          complexity_score TEXT,
          word_count INTEGER,
          character_count INTEGER,
          reading_time INTEGER,
          paragraphs INTEGER,
          sentences INTEGER,
          unique_word_count INTEGER,
          average_sentence_length REAL,
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
        let docId;
        let docIdMatch = null;
        
        if (filename.endsWith('.json')) {
          // Handle JSON files
          try {
            const jsonData = JSON.parse(content);
            if (jsonData.DocID) {
              docId = jsonData.DocID;
              docIdMatch = true; // Indicate DocID was found
            }
          } catch (jsonError) {
            console.log(`Failed to parse JSON for ${filename}:`, jsonError.message);
          }
        } else {
          // Handle markdown files
          docIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
          if (docIdMatch) {
            docId = docIdMatch[1];
          }
        }
        
        // Generate DocID if not found
        if (!docId) {
          docId = `${collection.substring(0, 3)}_${Date.now()}_${processedCount}`;
        }
        
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
          if (filename.endsWith('.json')) {
            // Handle JSON files differently
            try {
              const jsonData = JSON.parse(content);
              jsonData.DocID = docId;
              updatedContent = JSON.stringify(jsonData, null, 2);
            } catch (jsonError) {
              console.log(`Failed to parse JSON for ${filename}, skipping DocID update:`, jsonError.message);
            }
          } else {
            // Handle markdown files
            if (docIdMatch) {
              // Replace existing DocID
              updatedContent = content.replace(/DocID:\s*[^\s\n]+/, `DocID: ${docId}`);
            } else {
              // Add DocID to document without one (after first line)
              const lines = content.split('\n');
              lines.splice(1, 0, `DocID: ${docId}`);
              updatedContent = lines.join('\n');
            }
          }
          fs.writeFileSync(filePath, updatedContent, 'utf-8');
          console.log(`Updated ${filename} with DocID: ${docId}`);
        }
        
        // Load system prompts and get doc index prompt
        const prompts = await loadSystemPrompts();
        const docIndexPrompt = prompts.find(p => p.id === '6')?.prompt || 'Analyze this document.';
        const analysisPrompt = `${docIndexPrompt}

Document: ${filename}
Content: ${content.substring(0, 3000)}`;
        
        const aiResponse = await ollamaService.generateText(analysisPrompt, modelName);
        
        // Parse AI response (numbered format)
        let analysis = {
          title: filename.replace('.md', '').replace(/[-_]/g, ' '),
          author: '',
          document_type: 'other',
          language: 'en',
          source: '',
          version: '',
          access_level: 'public',
          license: '',
          category: 'document',
          summary: 'Document processed successfully',
          topics: '',
          keywords: filename.replace('.md', '').toLowerCase().split(/[-_\s]+/).join(', '),
          key_phrases: '',
          sentiment: 'neutral',
          entities: '',
          dates_mentioned: '',
          amounts_mentioned: '',
          action_items: '',
          importance_level: '4',
          complexity_score: '6'
        };
        
        // Get NLP analytics with error handling
        let nlpResults = {};
        if (nlpAnalytics) {
          try {
            nlpResults = nlpAnalytics.analyzeText(content);
          } catch (nlpError) {
            console.log(`NLP analysis failed for ${filename}, using defaults:`, nlpError.message);
            nlpResults = {
              entities: { people: '', organizations: '', locations: '' },
              dates: '',
              keyPhrases: '',
              wordCount: content.split(/\s+/).length,
              sentenceCount: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
              paragraphCount: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
              uniqueWordCount: new Set(content.split(/\s+/).map(w => w.toLowerCase())).size,
              averageSentenceLength: 25,
              readingTime: Math.ceil(content.split(/\s+/).length / 200)
            };
          }
        } else {
          // Fallback when NLP analytics is not available
          nlpResults = {
            entities: { people: '', organizations: '', locations: '' },
            dates: '',
            keyPhrases: '',
            wordCount: content.split(/\s+/).length,
            sentenceCount: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
            paragraphCount: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
            uniqueWordCount: new Set(content.split(/\s+/).map(w => w.toLowerCase())).size,
            averageSentenceLength: 25,
            readingTime: Math.ceil(content.split(/\s+/).length / 200)
          };
        }
        
        // Parse numbered AI response
        const lines = aiResponse.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          if (line.startsWith('1.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.author = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 100) : '';
          }
          if (line.startsWith('2.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.document_type = content && !content.includes('Not specified') && !content.includes('None') ? content.toLowerCase() : 'other';
          }
          if (line.startsWith('3.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.entities = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 200) : '';
          }
          if (line.startsWith('4.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.dates_mentioned = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 100) : '';
          }
          if (line.startsWith('5.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.amounts_mentioned = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 100) : '';
          }
          if (line.startsWith('6.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.key_phrases = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 200) : '';
          }
          if (line.startsWith('7.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.action_items = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 200) : '';
          }
          if (line.startsWith('8.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.summary = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 300) : '';
          }
          if (line.startsWith('9.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.topics = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 200) : '';
          }
          if (line.startsWith('10.')) {
            const content = line.split(':').slice(1).join(':').trim();
            analysis.importance_level = content && !content.includes('Not specified') && !content.includes('None') ? content.substring(0, 1) : '4';
          }
        });
        
        // Merge AI analysis with NLP analytics (NLP takes precedence for factual data)
        if (nlpResults.entities && nlpResults.entities.people) analysis.entities = nlpResults.entities.people;
        if (nlpResults.dates) analysis.dates_mentioned = nlpResults.dates;
        if (nlpResults.keyPhrases) analysis.key_phrases = nlpResults.keyPhrases;
        
        // Use NLP text statistics
        const { wordCount, sentenceCount, paragraphCount, uniqueWordCount, averageSentenceLength, readingTime } = nlpResults;
        
        // Insert with enhanced fields
        const stmt = db.prepare(`INSERT INTO document_index (
          docid, collection, filename, content, file_type, file_size, file_path,
          title, author, document_type, language, source, version, access_level, license, category,
          created_date, last_modified_date, generated_date, metadata_version,
          summary, topics, keywords, key_phrases, sentiment, entities,
          dates_mentioned, amounts_mentioned, action_items, importance_level, complexity_score,
          word_count, character_count, reading_time, paragraphs, sentences,
          unique_word_count, average_sentence_length, our_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run([
          docId, collection, filename, content, filename.split('.').pop(), content.length, filePath,
          analysis.title || filename.replace('.md', ''),
          analysis.author || '',
          analysis.document_type || 'other',
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
          analysis.dates_mentioned || '',
          analysis.amounts_mentioned || '',
          analysis.action_items || '',
          analysis.importance_level || '3',
          analysis.complexity_score || '5',
          wordCount,
          content.length,
          readingTime,
          paragraphCount,
          sentenceCount,
          uniqueWordCount,
          averageSentenceLength,
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
    const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), collection);
    
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
      const dbPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'index-cards.db');
      
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
          document_type: data.document_type || '',
          dates_mentioned: data.dates_mentioned || '',
          amounts_mentioned: data.amounts_mentioned || '',
          action_items: data.action_items || '',
          importance_level: data.importance_level || '',
          complexity_score: data.complexity_score || '',
          word_count: data.word_count || 0,
          character_count: data.character_count || 0,
          reading_time: data.reading_time || 0,
          paragraphs: data.paragraphs || 0,
          sentences: data.sentences || 0,
          unique_word_count: data.unique_word_count || 0,
          average_sentence_length: data.average_sentence_length || 0,

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
      const dbPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'index-cards.db');
      
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
    try {
      const collection = documentIndex.collection;
      const dbPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'index-cards.db');
      
      if (!fs.existsSync(dbPath)) {
        console.log(`Database not found: ${dbPath}`);
        return { updated: false, error: 'Database not found' };
      }
      
      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      // Ensure all values are properly converted to strings or appropriate types
      const safeString = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).trim();
      };
      
      const safeNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const num = parseInt(value);
        return isNaN(num) ? 0 : num;
      };
      
      const stmt = db.prepare(`UPDATE document_index SET
        title = ?, author = ?, document_type = ?, language = ?, source = ?, version = ?,
        access_level = ?, license = ?, category = ?, summary = ?, topics = ?, keywords = ?,
        key_phrases = ?, sentiment = ?, entities = ?, dates_mentioned = ?, amounts_mentioned = ?,
        action_items = ?, importance_level = ?, complexity_score = ?, our_comments = ?,
        last_modified_date = ?
        WHERE docid = ?`);
      
      const params = [
        safeString(documentIndex.title),
        safeString(documentIndex.author),
        safeString(documentIndex.document_type),
        safeString(documentIndex.language),
        safeString(documentIndex.source),
        safeString(documentIndex.version),
        safeString(documentIndex.access_level),
        safeString(documentIndex.license),
        safeString(documentIndex.category),
        safeString(documentIndex.summary),
        safeString(documentIndex.topics),
        safeString(documentIndex.keywords),
        safeString(documentIndex.key_phrases),
        safeString(documentIndex.sentiment),
        safeString(documentIndex.entities),
        safeString(documentIndex.dates_mentioned),
        safeString(documentIndex.amounts_mentioned),
        safeString(documentIndex.action_items),
        safeString(documentIndex.importance_level),
        safeString(documentIndex.complexity_score),
        safeString(documentIndex.our_comments),
        new Date().toISOString(),
        safeString(documentIndex.id || documentIndex.doc_id)
      ];
      
      console.log(`Updating document index for ID: ${params[22]}`);
      
      stmt.run(params);
      stmt.free();
      
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      db.close();
      
      console.log(`Successfully updated document index for ID: ${params[22]}`);
      return { updated: true };
    } catch (error) {
      console.error('Error updating document index:', error);
      return { updated: false, error: error.message };
    }
  }

  async removeDocumentIndex(collection, filename) {
    try {
      const dbPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'index-cards.db');
      
      if (!fs.existsSync(dbPath)) {
        return { removed: false, error: 'Database not found' };
      }
      
      const dbBuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBuffer);
      
      try {
        const stmt = db.prepare('DELETE FROM document_index WHERE filename = ?');
        stmt.run([filename]);
        const changes = db.getRowsModified();
        stmt.free();
        
        const data = db.export();
        fs.writeFileSync(dbPath, data);
        db.close();
        
        console.log(`Removed ${changes} document index entries for ${filename}`);
        return { removed: changes > 0 };
      } catch (error) {
        db.close();
        throw error;
      }
    } catch (error) {
      console.error('Error removing document index:', error);
      return { removed: false, error: error.message };
    }
  }

  async indexSingleDocument(collection, filename) {
    const collectionsPath = CollectionsUtil.getCollectionsPath();
    const collectionPath = path.join(collectionsPath, collection);
    const dbPath = path.join(collectionPath, 'index-cards.db');
    const filePath = path.join(collectionPath, filename);
    
    console.log(`Processing single document: ${filename} in collection: ${collection}`);
    console.log(`Collections path: ${collectionsPath}`);
    console.log(`Collection path: ${collectionPath}`);
    console.log(`File path: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`Directory contents:`, fs.readdirSync(collectionPath).join(', '));
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
        // Create enhanced table if it doesn't exist
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
            document_type TEXT,
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
            dates_mentioned TEXT,
            amounts_mentioned TEXT,
            action_items TEXT,
            importance_level TEXT,
            complexity_score TEXT,
            word_count INTEGER,
            character_count INTEGER,
            reading_time INTEGER,
            paragraphs INTEGER,
            sentences INTEGER,
            unique_word_count INTEGER,
            average_sentence_length REAL,
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
        let docIdMatch = null;
        
        if (filename.endsWith('.json')) {
          // Handle JSON files
          try {
            const jsonData = JSON.parse(content);
            if (jsonData.DocID) {
              docId = jsonData.DocID;
              docIdMatch = true;
            }
          } catch (jsonError) {
            console.log(`Failed to parse JSON for ${filename}:`, jsonError.message);
          }
        } else {
          // Handle markdown files
          docIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
          if (docIdMatch) {
            docId = docIdMatch[1];
          }
        }
        
        if (docId && docIdMatch) {
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
        
        if (filename.endsWith('.json')) {
          // Handle JSON files differently
          try {
            const jsonData = JSON.parse(content);
            jsonData.DocID = docId;
            updatedContent = JSON.stringify(jsonData, null, 2);
          } catch (jsonError) {
            console.log(`Failed to parse JSON for ${filename}, skipping DocID update:`, jsonError.message);
            updatedContent = content; // Keep original content if JSON parsing fails
          }
        } else {
          // Handle markdown files
          const existingDocIdMatch = content.match(/DocID:\s*([^\s\n]+)/);
          
          if (existingDocIdMatch) {
            updatedContent = content.replace(/DocID:\s*[^\s\n]+/, `DocID: ${docId}`);
          } else {
            const lines = content.split('\n');
            lines.splice(1, 0, `DocID: ${docId}`);
            updatedContent = lines.join('\n');
          }
        }
        
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`Updated ${filename} with DocID: ${docId}`);
      }
      
      // Fast AI analysis with optimized prompt and timeout
      let analysis = {
        title: filename.replace('.md', '').replace(/[-_]/g, ' '),
        author: '',
        document_type: 'document',
        language: 'en',
        source: '',
        version: '',
        access_level: 'public',
        license: '',
        category: 'document',
        summary: `Document: ${filename.replace('.md', '')}`,
        topics: '',
        keywords: filename.replace('.md', '').toLowerCase().split(/[-_\s]+/).join(', '),
        key_phrases: '',
        sentiment: 'neutral',
        entities: '',
        dates_mentioned: '',
        amounts_mentioned: '',
        action_items: '',
        importance_level: '3',
        complexity_score: '5'
      };
      
      // Fast AI analysis with timeout and reduced content
      try {
        const shortPrompt = `Analyze this document briefly:\n\nTitle: ${filename}\nContent: ${content.substring(0, 1000)}\n\nProvide:\n1. Author:\n2. Type:\n3. Summary (1 sentence):\n4. Topics:\n5. Key phrases:`;
        
        // Get document-index model from config
        const modelListPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/models-list.json');
        const modelList = JSON.parse(fs.readFileSync(modelListPath, 'utf8'));
        const docIndexModels = modelList.models.filter(m => m.category === 'document-index');
        if (docIndexModels.length === 0) {
          throw new Error('No document-index model found in models-list.json configuration');
        }
        const docIndexModel = docIndexModels[0].modelName;
        
        // Use timeout to prevent hanging
        const aiResponse = await Promise.race([
          ollamaService.generateText(shortPrompt, docIndexModel),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 10000)) // 10s timeout
        ]);
        
        // Parse simplified AI response
        const lines = aiResponse.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          if (line.startsWith('1.') && line.includes('Author:')) {
            const content = line.split(':').slice(1).join(':').trim();
            if (content && content.length > 2 && !content.toLowerCase().includes('unknown')) {
              analysis.author = content.substring(0, 100);
            }
          }
          if (line.startsWith('2.') && line.includes('Type:')) {
            const content = line.split(':').slice(1).join(':').trim();
            if (content && content.length > 2) {
              analysis.document_type = content.toLowerCase().substring(0, 50);
            }
          }
          if (line.startsWith('3.') && line.includes('Summary:')) {
            const content = line.split(':').slice(1).join(':').trim();
            if (content && content.length > 10) {
              analysis.summary = content.substring(0, 200);
            }
          }
          if (line.startsWith('4.') && line.includes('Topics:')) {
            const content = line.split(':').slice(1).join(':').trim();
            if (content && content.length > 3) {
              analysis.topics = content.substring(0, 150);
            }
          }
          if (line.startsWith('5.') && line.includes('Key phrases:')) {
            const content = line.split(':').slice(1).join(':').trim();
            if (content && content.length > 5) {
              analysis.key_phrases = content.substring(0, 150);
            }
          }
        });
        
        console.log(`Fast AI analysis completed for ${filename}`);
      } catch (aiError) {
        console.log(`AI analysis failed for ${filename} (${aiError.message}), using defaults`);
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
        // Get existing values to preserve user edits
        const existingData = db.exec("SELECT * FROM document_index WHERE docid = ?", [docId]);
        const existing = {};
        if (existingData?.[0]?.values?.[0]) {
          const columns = existingData[0].columns;
          const row = existingData[0].values[0];
          columns.forEach((col, index) => {
            existing[col] = row[index] || '';
          });
        }
        
        const stmt = db.prepare(`UPDATE document_index SET
          content = ?, file_size = ?, title = ?, author = ?, document_type = ?, language = ?, source = ?, version = ?,
          access_level = ?, license = ?, category = ?, last_modified_date = ?, generated_date = ?,
          summary = ?, topics = ?, keywords = ?, key_phrases = ?, sentiment = ?, entities = ?,
          dates_mentioned = ?, amounts_mentioned = ?, action_items = ?, importance_level = ?, complexity_score = ?,
          word_count = ?, character_count = ?, reading_time = ?, paragraphs = ?, sentences = ?,
          unique_word_count = ?, average_sentence_length = ?
          WHERE docid = ?`);
        
        stmt.run([
          content, content.length, existing.title || analysis.title || filename.replace('.md', ''),
          existing.author || analysis.author || '', existing.document_type || analysis.document_type || 'other', 
          existing.language || analysis.language || 'en', existing.source || analysis.source || '', 
          existing.version || analysis.version || '', existing.access_level || analysis.access_level || 'public', 
          existing.license || analysis.license || '', existing.category || analysis.category || 'document',
          new Date().toISOString(), new Date().toISOString(),
          existing.summary || analysis.summary || '', existing.topics || analysis.topics || '', 
          existing.keywords || analysis.keywords || '', existing.key_phrases || analysis.key_phrases || '',
          existing.sentiment || analysis.sentiment || 'neutral', existing.entities || analysis.entities || '',
          existing.dates_mentioned || analysis.dates_mentioned || '', existing.amounts_mentioned || analysis.amounts_mentioned || '', 
          existing.action_items || analysis.action_items || '', existing.importance_level || analysis.importance_level || '3', 
          existing.complexity_score || analysis.complexity_score || '5',
          words.length, content.length, Math.ceil(words.length / 200), paragraphs.length, sentences.length,
          uniqueWords.size, sentences.length > 0 ? parseFloat((words.length / sentences.length).toFixed(1)) : 0,
          docId
        ]);
        stmt.free();
      } else {
        const stmt = db.prepare(`INSERT INTO document_index (
          docid, collection, filename, content, file_type, file_size, file_path,
          title, author, document_type, language, source, version, access_level, license, category,
          created_date, last_modified_date, generated_date, metadata_version,
          summary, topics, keywords, key_phrases, sentiment, entities,
          dates_mentioned, amounts_mentioned, action_items, importance_level, complexity_score,
          word_count, character_count, reading_time, paragraphs, sentences,
          unique_word_count, average_sentence_length, our_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run([
          docId, collection, filename, content, filename.split('.').pop(), content.length, filePath,
          analysis.title || filename.replace('.md', ''), analysis.author || '', analysis.document_type || 'other',
          analysis.language || 'en', analysis.source || '', analysis.version || '', analysis.access_level || 'public',
          analysis.license || '', analysis.category || 'document',
          new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), '1.0',
          analysis.summary || '', analysis.topics || '', analysis.keywords || '', analysis.key_phrases || '',
          analysis.sentiment || 'neutral', analysis.entities || '',
          analysis.dates_mentioned || '', analysis.amounts_mentioned || '', analysis.action_items || '',
          analysis.importance_level || '3', analysis.complexity_score || '5',
          words.length, content.length, Math.ceil(words.length / 200), paragraphs.length, sentences.length,
          uniqueWords.size, sentences.length > 0 ? parseFloat((words.length / sentences.length).toFixed(1)) : 0, ''
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