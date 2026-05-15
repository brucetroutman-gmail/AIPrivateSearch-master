# 7 Document Search Methods: Node.js ES6 Implementation Guide

## 1. Traditional Text Search

**Software Requirements:**
- Node.js core modules: `fs`, `path`, `readline`
- Optional: `elasticsearch` npm package for advanced indexing
- `fast-glob` for efficient file pattern matching
- `ripgrep` or `grep` system utilities

**Coding Strategy:**
```javascript
// services/traditionalSearch.js
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export class TraditionalSearch {
  async searchInFile(filePath, query, options = {}) {
    const { caseSensitive = false, wholeWords = false } = options;
    const results = [];
    
    const fileStream = createReadStream(filePath);
    const rl = createInterface({ input: fileStream });
    
    let lineNumber = 0;
    for await (const line of rl) {
      lineNumber++;
      if (this.matchesQuery(line, query, { caseSensitive, wholeWords })) {
        results.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          score: this.calculateRelevanceScore(line, query)
        });
      }
    }
    
    return results;
  }

  matchesQuery(text, query, options) {
    let searchText = options.caseSensitive ? text : text.toLowerCase();
    let searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    if (options.wholeWords) {
      const regex = new RegExp(`\\b${searchQuery}\\b`, 'gi');
      return regex.test(searchText);
    }
    
    return searchText.includes(searchQuery);
  }
}
```

## 2. AI Model Direct Search

**Software Requirements:**
- `@huggingface/transformers` or `openai` for AI models
- `node-fetch` for API calls
- Local model options: `@xenova/transformers` (runs in Node.js)
- GPU acceleration: `@tensorflow/tfjs-node-gpu` (optional)

**Coding Strategy:**
```javascript
// services/aiDirectSearch.js
import { pipeline } from '@xenova/transformers';

export class AIDirectSearch {
  constructor() {
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      this.model = await pipeline('question-answering', 'distilbert-base-cased-distilled-squad');
      this.initialized = true;
    }
  }

  async searchDocument(documentContent, query) {
    await this.initialize();
    
    try {
      const result = await this.model({
        question: query,
        context: documentContent
      });

      return {
        answer: result.answer,
        confidence: result.score,
        startIndex: result.start,
        endIndex: result.end,
        context: documentContent.substring(
          Math.max(0, result.start - 100),
          Math.min(documentContent.length, result.end + 100)
        )
      };
    } catch (error) {
      throw new Error(`AI search failed: ${error.message}`);
    }
  }

  async batchSearch(documents, query) {
    const results = [];
    
    for (const doc of documents) {
      const result = await this.searchDocument(doc.content, query);
      results.push({
        documentId: doc.id,
        filename: doc.filename,
        ...result
      });
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}
```

## 3. Chunked + AI Search (RAG)

**Software Requirements:**
- Text chunking: `langchain` or custom implementation
- Embedding models: `@xenova/transformers` or `openai`
- Vector similarity: `ml-distance` or `@tensorflow/tfjs`
- Chunk storage: `sql.js` (JavaScript SQLite)

**Coding Strategy:**
```javascript
// services/ragSearch.js
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { pipeline } from '@xenova/transformers';

export class RAGSearch {
  constructor() {
    this.embedder = null;
    this.chunks = new Map();
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50
    });
  }

  async initialize() {
    this.embedder = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2');
  }

  async processDocument(document) {
    const chunks = await this.textSplitter.splitText(document.content);
    const processedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.createEmbedding(chunk);
      
      const chunkData = {
        id: `${document.id}_chunk_${i}`,
        documentId: document.id,
        content: chunk,
        embedding,
        metadata: {
          chunkIndex: i,
          filename: document.filename,
          startChar: this.calculateStartPosition(chunks, i)
        }
      };
      
      this.chunks.set(chunkData.id, chunkData);
      processedChunks.push(chunkData);
    }

    return processedChunks;
  }

  async searchSimilarChunks(query, topK = 5) {
    const queryEmbedding = await this.createEmbedding(query);
    const similarities = [];

    for (const [id, chunk] of this.chunks) {
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      similarities.push({
        ...chunk,
        similarity
      });
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async createEmbedding(text) {
    const result = await this.embedder(text);
    return Array.from(result.data);
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

## 4. Vector Database Search

**Software Requirements:**
- Vector databases: `chromadb` (Python bridge), `faiss-node`, or `hnswlib-node`
- Embeddings: `@xenova/transformers` or `openai`
- Database: `sql.js` for metadata
- Vector operations: `ml-matrix` for mathematical operations

**Coding Strategy:**
```javascript
// services/vectorSearch.js
import { HNSWLib } from 'hnswlib-node';
import { pipeline } from '@xenova/transformers';
import Database from 'better-sqlite3';

export class VectorSearch {
  constructor(dbPath = './vector_index.db') {
    this.db = new Database(dbPath);
    this.vectorIndex = null;
    this.embedder = null;
    this.dimension = 384; // MiniLM dimension
    this.setupDatabase();
  }

  setupDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT,
        content TEXT,
        metadata TEXT,
        vector_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async initialize() {
    this.embedder = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2');
    this.vectorIndex = new HNSWLib('cosine', this.dimension);
    await this.loadExistingIndex();
  }

  async addDocument(document) {
    const embedding = await this.createEmbedding(document.content);
    const vectorId = this.vectorIndex.getCurrentCount();
    
    this.vectorIndex.addPoint(embedding, vectorId);
    
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, filename, content, metadata, vector_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      document.id,
      document.filename,
      document.content,
      JSON.stringify(document.metadata || {}),
      vectorId
    );

    return vectorId;
  }

  async searchSimilar(query, k = 10) {
    const queryEmbedding = await this.createEmbedding(query);
    const searchResults = this.vectorIndex.searchKnn(queryEmbedding, k);
    
    const documents = [];
    const stmt = this.db.prepare('SELECT * FROM documents WHERE vector_id = ?');
    
    for (const result of searchResults.neighbors) {
      const doc = stmt.get(result);
      if (doc) {
        documents.push({
          ...doc,
          similarity: searchResults.distances[searchResults.neighbors.indexOf(result)],
          metadata: JSON.parse(doc.metadata)
        });
      }
    }

    return documents;
  }

  async createEmbedding(text) {
    const result = await this.embedder(text);
    return Array.from(result.data);
  }
}
```

## 5. Hybrid Search

**Software Requirements:**
- Combines previous methods
- `natural` for text processing and TF-IDF
- `stopword` for language processing
- Weight balancing algorithms

**Coding Strategy:**
```javascript
// services/hybridSearch.js
import { TraditionalSearch } from './traditionalSearch.js';
import { VectorSearch } from './vectorSearch.js';
import { TfIdf } from 'natural';

export class HybridSearch {
  constructor() {
    this.traditionalSearch = new TraditionalSearch();
    this.vectorSearch = new VectorSearch();
    this.tfidf = new TfIdf();
    this.documents = new Map();
  }

  async initialize() {
    await this.vectorSearch.initialize();
  }

  async addDocument(document) {
    this.documents.set(document.id, document);
    this.tfidf.addDocument(document.content);
    await this.vectorSearch.addDocument(document);
  }

  async hybridSearch(query, options = {}) {
    const {
      keywordWeight = 0.3,
      semanticWeight = 0.7,
      topK = 10
    } = options;

    // Get keyword-based results
    const keywordResults = await this.getKeywordResults(query, topK * 2);
    
    // Get semantic results
    const semanticResults = await this.vectorSearch.searchSimilar(query, topK * 2);
    
    // Combine and rerank results
    const combinedResults = this.combineResults(
      keywordResults,
      semanticResults,
      keywordWeight,
      semanticWeight
    );

    return combinedResults.slice(0, topK);
  }

  async getKeywordResults(query, limit) {
    const results = [];
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    for (const [docId, document] of this.documents) {
      let score = 0;
      
      // TF-IDF scoring
      queryTerms.forEach(term => {
        score += this.tfidf.tfidf(term, Array.from(this.documents.keys()).indexOf(docId));
      });
      
      // Exact match bonus
      if (document.content.toLowerCase().includes(query.toLowerCase())) {
        score += 1.0;
      }

      results.push({
        id: docId,
        ...document,
        keywordScore: score
      });
    }

    return results
      .filter(r => r.keywordScore > 0)
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, limit);
  }

  combineResults(keywordResults, semanticResults, keywordWeight, semanticWeight) {
    const combinedScores = new Map();

    // Normalize and combine scores
    keywordResults.forEach(result => {
      const existing = combinedScores.get(result.id) || { document: result, scores: {} };
      existing.scores.keyword = result.keywordScore;
      combinedScores.set(result.id, existing);
    });

    semanticResults.forEach(result => {
      const existing = combinedScores.get(result.id) || { document: result, scores: {} };
      existing.scores.semantic = result.similarity;
      combinedScores.set(result.id, existing);
    });

    // Calculate final scores
    return Array.from(combinedScores.values())
      .map(item => ({
        ...item.document,
        hybridScore: (item.scores.keyword || 0) * keywordWeight + 
                    (item.scores.semantic || 0) * semanticWeight,
        keywordScore: item.scores.keyword || 0,
        semanticScore: item.scores.semantic || 0
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }
}
```

## 6. Metadata-Based Search

**Software Requirements:**
- `sql.js` for structured queries
- `date-fns` for date handling
- `mime-types` for file type detection
- JSON schema validation: `ajv`

**Coding Strategy:**
```javascript
// services/metadataSearch.js
import SQL from 'sql.js';
import fs from 'fs';
import { parseISO, isAfter, isBefore } from 'date-fns';
import mime from 'mime-types';

export class MetadataSearch {
  constructor(dbPath = './collection.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.setupDatabase();
  }

  async setupDatabase() {
    const dbBuffer = fs.existsSync(this.dbPath) ? fs.readFileSync(this.dbPath) : null;
    this.db = new SQL.Database(dbBuffer);
  }

  setupDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_metadata (
        id TEXT PRIMARY KEY,
        filename TEXT,
        file_type TEXT,
        file_size INTEGER,
        created_date TEXT,
        modified_date TEXT,
        tags TEXT, -- JSON array
        category TEXT,
        author TEXT,
        language TEXT,
        word_count INTEGER,
        custom_fields TEXT -- JSON object
      );
      
      CREATE INDEX IF NOT EXISTS idx_file_type ON document_metadata(file_type);
      CREATE INDEX IF NOT EXISTS idx_category ON document_metadata(category);
      CREATE INDEX IF NOT EXISTS idx_created_date ON document_metadata(created_date);
    `);
  }

  async addDocumentMetadata(document, metadata = {}) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO document_metadata 
      (id, filename, file_type, file_size, created_date, modified_date, 
       tags, category, author, language, word_count, custom_fields)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const fileType = mime.lookup(document.filename) || 'unknown';
    
    stmt.run(
      document.id,
      document.filename,
      fileType,
      metadata.fileSize || 0,
      metadata.createdDate || new Date().toISOString(),
      metadata.modifiedDate || new Date().toISOString(),
      JSON.stringify(metadata.tags || []),
      metadata.category || 'uncategorized',
      metadata.author || 'unknown',
      metadata.language || 'en',
      metadata.wordCount || 0,
      JSON.stringify(metadata.customFields || {})
    );
  }

  searchByMetadata(criteria) {
    let query = 'SELECT * FROM document_metadata WHERE 1=1';
    const params = [];

    // File type filter
    if (criteria.fileType) {
      query += ' AND file_type LIKE ?';
      params.push(`%${criteria.fileType}%`);
    }

    // Category filter
    if (criteria.category) {
      query += ' AND category = ?';
      params.push(criteria.category);
    }

    // Date range filter
    if (criteria.dateFrom) {
      query += ' AND created_date >= ?';
      params.push(criteria.dateFrom);
    }
    if (criteria.dateTo) {
      query += ' AND created_date <= ?';
      params.push(criteria.dateTo);
    }

    // File size range
    if (criteria.minSize) {
      query += ' AND file_size >= ?';
      params.push(criteria.minSize);
    }
    if (criteria.maxSize) {
      query += ' AND file_size <= ?';
      params.push(criteria.maxSize);
    }

    // Tags filter (JSON contains)
    if (criteria.tags && criteria.tags.length > 0) {
      const tagConditions = criteria.tags.map(() => 'json_extract(tags, "$") LIKE ?').join(' OR ');
      query += ` AND (${tagConditions})`;
      criteria.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    // Author filter
    if (criteria.author) {
      query += ' AND author LIKE ?';
      params.push(`%${criteria.author}%`);
    }

    query += ' ORDER BY created_date DESC';

    const stmt = this.db.prepare(query);
    const results = stmt.all(params);

    return results.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      customFields: JSON.parse(row.custom_fields)
    }));
  }

  getMetadataStatistics() {
    const stats = {
      totalDocuments: this.db.prepare('SELECT COUNT(*) as count FROM document_metadata').get().count,
      fileTypes: this.db.prepare('SELECT file_type, COUNT(*) as count FROM document_metadata GROUP BY file_type').all(),
      categories: this.db.prepare('SELECT category, COUNT(*) as count FROM document_metadata GROUP BY category').all(),
      dateRange: this.db.prepare('SELECT MIN(created_date) as earliest, MAX(created_date) as latest FROM document_metadata').get()
    };

    return stats;
  }
}
```

## 7. Full-Text Search Engines

**Software Requirements:**
- Elasticsearch: `@elastic/elasticsearch`
- Apache Solr: `solr-node` or REST API calls
- Lightweight: `lunr` or `flexsearch`
- Text processing: `natural`

**Coding Strategy:**
```javascript
// services/fullTextSearch.js
import { Client } from '@elastic/elasticsearch';
import lunr from 'lunr';

export class FullTextSearch {
  constructor(config = {}) {
    this.useElasticsearch = config.elasticsearch !== false;
    this.esClient = null;
    this.lunrIndex = null;
    this.documents = [];
    
    if (this.useElasticsearch) {
      this.esClient = new Client({
        node: config.elasticsearchUrl || 'http://localhost:9200'
      });
    }
  }

  async initialize() {
    if (this.useElasticsearch) {
      await this.setupElasticsearch();
    } else {
      this.setup