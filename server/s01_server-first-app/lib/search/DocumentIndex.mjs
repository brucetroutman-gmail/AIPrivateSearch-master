 
 
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
      
      // Search metadata fields with weighted scoring
      // title=3x, keywords=2x, key_phrases=2x, topics=2x, summary=1x, content=0.5x
      const searchTerm = `%${processedQuery}%`;
      console.log(`[DocumentIndexSearch] Executing weighted search for: "${searchTerm}"`);

      const allResults = db.exec(
        `SELECT docid, filename, title, summary, topics, keywords, content,
                (CASE WHEN title LIKE ? THEN 3 ELSE 0 END +
                 CASE WHEN keywords LIKE ? THEN 2 ELSE 0 END +
                 CASE WHEN topics LIKE ? THEN 2 ELSE 0 END +
                 CASE WHEN entities LIKE ? THEN 2 ELSE 0 END +
                 CASE WHEN summary LIKE ? THEN 1 ELSE 0 END +
                 CASE WHEN content LIKE ? THEN 0.5 ELSE 0 END) AS score
         FROM document_index
         WHERE title LIKE ? OR keywords LIKE ? OR topics LIKE ?
            OR entities LIKE ? OR summary LIKE ? OR content LIKE ?
         ORDER BY score DESC
         LIMIT 50`,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
         searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
      );

      db.close();

      if (!allResults || allResults.length === 0 || !allResults[0].values || allResults[0].values.length === 0) {
        console.log(`[DocumentIndexSearch] No results found`);
        return {
          results: [],
          method: 'document-index',
          total: 0,
          message: `No documents found matching "${processedQuery}" in ${collection}`
        };
      }

      const formattedResults = allResults[0].values.map(row => ({
        docid: row[0],
        filename: row[1],
        title: row[2],
        summary: row[3],
        topics: row[4],
        keywords: row[5],
        content: row[6],
        score: row[7]
      }));

      console.log(`[DocumentIndexSearch] Found ${formattedResults.length} results`);

      return {
        results: formattedResults.map(doc => {
          // Build excerpt from best matching metadata field
          const bestExcerpt = doc.summary || doc.topics || doc.keywords
            ? `${doc.summary ? doc.summary + ' ' : ''}${doc.topics ? '| Topics: ' + doc.topics : ''}`
            : ExcerptFormatter.formatExcerptWithLineNumbers(doc.content, processedQuery);
          return {
            id: doc.docid,
            title: doc.title || doc.filename.replace('.md', '').replace('.json', ''),
            excerpt: bestExcerpt.trim(),
            score: doc.score,
            source: doc.filename,
            collection,
            documentPath: `/api/documents/${collection}/${encodeURIComponent(doc.filename)}/view?search=${encodeURIComponent(query)}`
          };
        }),
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
      // Get document-index model from config
      const modelListPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/models-list.json');
      const modelList = JSON.parse(fs.readFileSync(modelListPath, 'utf8'));
      const docIndexModels = modelList.models.filter(m => m.category === 'document-index');
      if (docIndexModels.length === 0) {
        throw new Error('No document-index model found in models-list.json configuration');
      }
      const modelName = docIndexModels[0].modelName;
      
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
          title TEXT,
          document_type TEXT,
          summary TEXT,
          topics TEXT,
          keywords TEXT,
          entities TEXT,
          dates_mentioned TEXT,
          amounts_mentioned TEXT,
          action_items TEXT,
          sentiment TEXT,
          word_count INTEGER,
          reading_time INTEGER,
          generated_date TEXT,
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
        
        // Load fabric vocabulary for domain context
        let fabricVocab = '';
        try {
          const patternPath = path.join(collectionPath, 'fabric-pattern.md');
          const pattern = fs.readFileSync(patternPath, 'utf8');
          const vocabMatch = pattern.match(/Key domain vocabulary[^:]*:\s*([^\n]+)/);
          if (vocabMatch) fabricVocab = `Domain vocabulary: ${vocabMatch[1].trim()}\n\n`;
        } catch { /* no pattern file */ }

        // Unified prompt — same as indexSingleDocument for consistent index cards
        const analysisPrompt = `${fabricVocab}Analyze this document and extract structured information.\n\nFilename: ${filename}\nContent: ${content.substring(0, 2000)}\n\nProvide exactly:\n1. Title: (real title or subject, not filename)\n2. Type: (email/legal/medical/report/article/other)\n3. Summary: (2-3 sentences)\n4. Topics: (comma-separated main subjects)\n5. Keywords: (comma-separated key terms)\n6. Entities: (people, organizations, places mentioned)\n7. Dates: (any dates referenced)\n8. Amounts: (money, quantities, measurements)\n9. Actions: (requests, tasks, follow-ups required)\n10. Sentiment: (positive/negative/neutral/formal)`;
        
        const aiResponse = await ollamaService.generateText(analysisPrompt, modelName);
        
        // Parse AI response (numbered format)
        let analysis = {
          title: filename.replace('.md', '').replace(/[-_]/g, ' '),
          document_type: 'other',
          summary: 'Document processed successfully',
          topics: '',
          keywords: filename.replace('.md', '').toLowerCase().split(/[-_\s]+/).join(', '),
          entities: '',
          dates_mentioned: '',
          amounts_mentioned: '',
          action_items: '',
          sentiment: 'neutral'
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
          const val = () => line.split(':').slice(1).join(':').trim();
          if (line.match(/^1\..*Title:/i))    { const v = val(); if (v.length > 2) analysis.title = v.substring(0, 150); }
          if (line.match(/^2\..*Type:/i))     { const v = val(); if (v.length > 2) analysis.document_type = v.toLowerCase().substring(0, 50); }
          if (line.match(/^3\..*Summary:/i))  { const v = val(); if (v.length > 10) analysis.summary = v.substring(0, 400); }
          if (line.match(/^4\..*Topics:/i))   { const v = val(); if (v.length > 3) analysis.topics = v.substring(0, 200); }
          if (line.match(/^5\..*Keywords:/i)) { const v = val(); if (v.length > 3) analysis.keywords = v.substring(0, 200); }
          if (line.match(/^6\..*Entities:/i)) { const v = val(); if (v.length > 3) analysis.entities = v.substring(0, 200); }
          if (line.match(/^7\..*Dates:/i))    { const v = val(); if (v.length > 3) analysis.dates_mentioned = v.substring(0, 200); }
          if (line.match(/^8\..*Amounts:/i))  { const v = val(); if (v.length > 3) analysis.amounts_mentioned = v.substring(0, 200); }
          if (line.match(/^9\..*Actions:/i))  { const v = val(); if (v.length > 3) analysis.action_items = v.substring(0, 200); }
          if (line.match(/^10\..*Sentiment:/i)){ const v = val(); if (v.length > 2) analysis.sentiment = v.toLowerCase().substring(0, 50); }
        });

        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);
        
        // Insert with slim 12-field schema
        const stmt = db.prepare(`INSERT INTO document_index (
          docid, collection, filename, content, file_type, file_size,
          title, document_type, summary, topics, keywords, entities,
          dates_mentioned, amounts_mentioned, action_items, sentiment,
          word_count, reading_time, generated_date, our_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run([
          docId, collection, filename, content, filename.split('.').pop(), content.length,
          analysis.title, analysis.document_type, analysis.summary, analysis.topics,
          analysis.keywords, analysis.entities, analysis.dates_mentioned,
          analysis.amounts_mentioned, analysis.action_items, analysis.sentiment,
          wordCount, readingTime, new Date().toISOString(), ''
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
          title: data.title || '',
          document_type: data.document_type || '',
          summary: data.summary || '',
          topics: data.topics || '',
          keywords: data.keywords || '',
          entities: data.entities || '',
          dates_mentioned: data.dates_mentioned || '',
          amounts_mentioned: data.amounts_mentioned || '',
          action_items: data.action_items || '',
          sentiment: data.sentiment || '',
          word_count: data.word_count || 0,
          reading_time: data.reading_time || 0,
          generated_date: data.generated_date || new Date().toISOString(),
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
        title = ?, document_type = ?, summary = ?, topics = ?, keywords = ?,
        entities = ?, dates_mentioned = ?, amounts_mentioned = ?,
        action_items = ?, sentiment = ?, our_comments = ?, generated_date = ?
        WHERE docid = ?`);
      
      const params = [
        safeString(documentIndex.title),
        safeString(documentIndex.document_type),
        safeString(documentIndex.summary),
        safeString(documentIndex.topics),
        safeString(documentIndex.keywords),
        safeString(documentIndex.entities),
        safeString(documentIndex.dates_mentioned),
        safeString(documentIndex.amounts_mentioned),
        safeString(documentIndex.action_items),
        safeString(documentIndex.sentiment),
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
            title TEXT,
            document_type TEXT,
            summary TEXT,
            topics TEXT,
            keywords TEXT,
            entities TEXT,
            dates_mentioned TEXT,
            amounts_mentioned TEXT,
            action_items TEXT,
            sentiment TEXT,
            word_count INTEGER,
            reading_time INTEGER,
            generated_date TEXT,
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
        document_type: 'other',
        summary: `Document: ${filename.replace('.md', '')}`,
        topics: '',
        keywords: filename.replace('.md', '').toLowerCase().split(/[-_\s]+/).join(', '),
        entities: '',
        dates_mentioned: '',
        amounts_mentioned: '',
        action_items: '',
        sentiment: 'neutral'
      };
      
      // Fast AI analysis with timeout and reduced content
      try {
        // Load fabric vocabulary for domain context
        let fabricVocab = '';
        try {
          const patternPath = path.join(collectionPath, 'fabric-pattern.md');
          const pattern = fs.readFileSync(patternPath, 'utf8');
          const vocabMatch = pattern.match(/Key domain vocabulary[^:]*:\s*([^\n]+)/);
          if (vocabMatch) fabricVocab = `Domain vocabulary: ${vocabMatch[1].trim()}\n\n`;
        } catch { /* no pattern file */ }

        const shortPrompt = `${fabricVocab}Analyze this document and extract structured information.\n\nFilename: ${filename}\nContent: ${content.substring(0, 2000)}\n\nProvide exactly:\n1. Title: (real title or subject, not filename)\n2. Type: (email/legal/medical/report/article/other)\n3. Summary: (2-3 sentences)\n4. Topics: (comma-separated main subjects)\n5. Keywords: (comma-separated key terms)\n6. Entities: (people, organizations, places mentioned)\n7. Dates: (any dates referenced)\n8. Amounts: (money, quantities, measurements)\n9. Actions: (requests, tasks, follow-ups required)\n10. Sentiment: (positive/negative/neutral/formal)`;
        
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
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 10000))
        ]);
        
        // Parse AI response
        const lines = aiResponse.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          const val = () => line.split(':').slice(1).join(':').trim();
          if (line.match(/^1\..*Title:/i))    { const v = val(); if (v.length > 2) analysis.title = v.substring(0, 150); }
          if (line.match(/^2\..*Type:/i))     { const v = val(); if (v.length > 2) analysis.document_type = v.toLowerCase().substring(0, 50); }
          if (line.match(/^3\..*Summary:/i))  { const v = val(); if (v.length > 10) analysis.summary = v.substring(0, 400); }
          if (line.match(/^4\..*Topics:/i))   { const v = val(); if (v.length > 3) analysis.topics = v.substring(0, 200); }
          if (line.match(/^5\..*Keywords:/i)) { const v = val(); if (v.length > 3) analysis.keywords = v.substring(0, 200); }
          if (line.match(/^6\..*Entities:/i)) { const v = val(); if (v.length > 3) analysis.entities = v.substring(0, 200); }
          if (line.match(/^7\..*Dates:/i))    { const v = val(); if (v.length > 3) analysis.dates_mentioned = v.substring(0, 200); }
          if (line.match(/^8\..*Amounts:/i))  { const v = val(); if (v.length > 3) analysis.amounts_mentioned = v.substring(0, 200); }
          if (line.match(/^9\..*Actions:/i))  { const v = val(); if (v.length > 3) analysis.action_items = v.substring(0, 200); }
          if (line.match(/^10\..*Sentiment:/i)){ const v = val(); if (v.length > 2) analysis.sentiment = v.toLowerCase().substring(0, 50); }
        });
        
        console.log(`Fast AI analysis completed for ${filename}`);
      } catch (aiError) {
        console.log(`AI analysis failed for ${filename} (${aiError.message}), using defaults`);
      }
      
      // Calculate text metrics
      const words = content.split(/\s+/);
      const wordCount = words.length;
      const readingTime = Math.ceil(wordCount / 200);
      
      // Insert or update document
      if (isUpdate) {
        const stmt = db.prepare(`UPDATE document_index SET
          content = ?, file_size = ?, title = ?, document_type = ?,
          summary = ?, topics = ?, keywords = ?, entities = ?,
          dates_mentioned = ?, amounts_mentioned = ?, action_items = ?, sentiment = ?,
          word_count = ?, reading_time = ?, generated_date = ?
          WHERE docid = ?`);
        stmt.run([
          content, content.length, analysis.title, analysis.document_type,
          analysis.summary, analysis.topics, analysis.keywords, analysis.entities,
          analysis.dates_mentioned, analysis.amounts_mentioned, analysis.action_items, analysis.sentiment,
          wordCount, readingTime, new Date().toISOString(),
          docId
        ]);
        stmt.free();
      } else {
        const stmt = db.prepare(`INSERT INTO document_index (
          docid, collection, filename, content, file_type, file_size,
          title, document_type, summary, topics, keywords, entities,
          dates_mentioned, amounts_mentioned, action_items, sentiment,
          word_count, reading_time, generated_date, our_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run([
          docId, collection, filename, content, filename.split('.').pop(), content.length,
          analysis.title, analysis.document_type, analysis.summary, analysis.topics,
          analysis.keywords, analysis.entities, analysis.dates_mentioned,
          analysis.amounts_mentioned, analysis.action_items, analysis.sentiment,
          wordCount, readingTime, new Date().toISOString(), ''
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