# Local Documents Processing Implementation Guide

## Overview

This document outlines the implementation requirements for processing local documents in the `sources/local-documents/my-literature` folder to enable the "Local Documents Only" source type functionality. The system will convert various file formats to markdown, create embeddings using nomic-embed-text, and store them in LanceDB for semantic search.

## Current Architecture Integration

### Existing Structure
```
AIPrivateSearch-bruce/
├── sources/
│   └── local-documents/
│       └── my-literature/          # Target folder for document processing
│           ├── document1.pdf
│           ├── document2.txt
│           └── document3.docx
├── server/s01_server-first-app/    # Backend integration point
└── client/c01_client-first-app/    # Frontend (Source Type selection)
```

### Enhanced Architecture with Document Processing
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │───▶│   Node.js API   │───▶│  Ollama Service │    │  MySQL Database │
│   (Frontend)    │    │    (Backend)    │    │  (AI Models)    │    │ (Data Storage)  │
│  Port: 3000     │    │  Port: 3001     │    │  Port: 11434    │    │  Port: 3306     │
│                 │    │                 │    │                 │    │                 │
│ + Source Types  │    │ + Doc Processing │   │ + nomic-embed   │    │ + TestCode      │
│ + TestCode Gen  │    │ + Vector Search  │    │ + Token Control │    │   Storage       │
│ + Config Mgmt   │    │ + LanceDB Query │    │   Integration   │    │ + Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    LanceDB      │
                       │ (Vector Store)  │
                       │  Port: N/A      │
                       │                 │
                       │ + Embeddings    │
                       │ + Metadata      │
                       │ + Similarity    │
                       └─────────────────┘
```

## Implementation Requirements

### 1. Dependencies Installation

#### Backend Dependencies (server/s01_server-first-app/package.json)
```bash
# Document processing
npm install pdf-parse
npm install mammoth          # For .docx files
npm install turndown         # HTML to Markdown conversion

# Vector database and embeddings
npm install lancedb
npm install @lancedb/embeddings

# File system utilities
npm install fs-extra
npm install path
npm install mime-types

# Text processing
npm install markdown-it
npm install cheerio          # For HTML parsing if needed
```

#### Ollama Model Requirements
```bash
# Install nomic-embed-text model for embeddings
ollama pull nomic-embed-text
```

### 2. File Structure Enhancement

#### New Backend Components
```
server/s01_server-first-app/
├── lib/
│   ├── models/
│   │   └── combinedSearchScorer.mjs    # Existing
│   ├── documents/                      # NEW
│   │   ├── documentProcessor.mjs       # File conversion logic
│   │   ├── embeddingService.mjs        # Embedding generation
│   │   ├── vectorStore.mjs             # LanceDB operations
│   │   └── documentSearch.mjs          # Document search logic
│   └── utils/
│       └── fileUtils.mjs               # File handling utilities
├── routes/
│   ├── search.mjs                      # Existing - Enhanced
│   └── documents.mjs                   # NEW - Document management
├── data/                               # NEW
│   ├── embeddings/                     # LanceDB storage
│   └── processed/                      # Converted markdown files
└── scripts/                            # NEW
    └── processDocuments.mjs            # Initial document processing script
```

### 3. Document Processing Pipeline

#### Phase 1: File Conversion to Markdown

**documentProcessor.mjs**
```javascript
import fs from 'fs-extra';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

class DocumentProcessor {
  constructor() {
    this.turndownService = new TurndownService();
    this.supportedFormats = ['.pdf', '.txt', '.docx', '.html'];
    this.sourceDir = path.join(process.cwd(), '../../sources/local-documents/my-literature');
    this.outputDir = path.join(process.cwd(), 'data/processed');
  }

  async processAllDocuments() {
    // Scan source directory
    // Convert each file to markdown
    // Save to processed directory
    // Return processing results
  }

  async convertToMarkdown(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.pdf':
        return await this.processPDF(filePath);
      case '.txt':
        return await this.processText(filePath);
      case '.docx':
        return await this.processDocx(filePath);
      case '.html':
        return await this.processHTML(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  async processPDF(filePath) {
    // Use pdf-parse to extract text
    // Convert to markdown format
    // Add metadata headers
  }

  async processText(filePath) {
    // Read text file
    // Add markdown formatting
    // Preserve structure
  }

  async processDocx(filePath) {
    // Use mammoth to convert to HTML
    // Convert HTML to markdown using turndown
    // Clean up formatting
  }

  async processHTML(filePath) {
    // Read HTML file
    // Convert to markdown using turndown
    // Clean up formatting
  }
}
```

#### Phase 2: Embedding Generation

**embeddingService.mjs**
```javascript
import { Ollama } from 'ollama';

class EmbeddingService {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.model = 'nomic-embed-text';
  }

  async generateEmbedding(text) {
    try {
      const response = await this.ollama.embeddings({
        model: this.model,
        prompt: text
      });
      return response.embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  async generateBatchEmbeddings(textChunks) {
    // Process multiple text chunks
    // Return array of embeddings
    // Handle rate limiting and errors
  }

  chunkText(text, maxChunkSize = 1000) {
    // Split text into manageable chunks
    // Preserve sentence boundaries
    // Return array of text chunks
  }
}
```

#### Phase 3: Vector Storage with LanceDB

**vectorStore.mjs**
```javascript
import lancedb from 'lancedb';
import path from 'path';

class VectorStore {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data/embeddings');
    this.tableName = 'documents';
    this.db = null;
    this.table = null;
  }

  async initialize() {
    this.db = await lancedb.connect(this.dbPath);
    
    // Create table if it doesn't exist
    try {
      this.table = await this.db.openTable(this.tableName);
    } catch (error) {
      // Create new table with schema
      this.table = await this.db.createTable(this.tableName, [
        {
          id: 'doc_001_chunk_001',
          filename: 'document1.pdf',
          chunk_index: 0,
          content: 'Sample document content...',
          embedding: new Array(768).fill(0), // nomic-embed-text dimension
          metadata: {
            file_path: '/path/to/file',
            file_type: 'pdf',
            processed_at: new Date().toISOString(),
            chunk_size: 1000
          }
        }
      ]);
    }
  }

  async addDocument(filename, chunks, embeddings, metadata) {
    const records = chunks.map((chunk, index) => ({
      id: `${filename}_chunk_${index.toString().padStart(3, '0')}`,
      filename: filename,
      chunk_index: index,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        ...metadata,
        chunk_size: chunk.length,
        processed_at: new Date().toISOString()
      }
    }));

    await this.table.add(records);
  }

  async searchSimilar(queryEmbedding, limit = 5) {
    const results = await this.table
      .search(queryEmbedding)
      .limit(limit)
      .toArray();
    
    return results;
  }

  async searchByFilename(filename) {
    const results = await this.table
      .search()
      .where(`filename = '${filename}'`)
      .toArray();
    
    return results;
  }
}
```

#### Phase 4: Document Search Integration

**documentSearch.mjs**
```javascript
import { EmbeddingService } from './embeddingService.mjs';
import { VectorStore } from './vectorStore.mjs';

class DocumentSearch {
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.vectorStore = new VectorStore();
  }

  async initialize() {
    await this.vectorStore.initialize();
  }

  async searchDocuments(query, limit = 5) {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      // Search similar documents
      const results = await this.vectorStore.searchSimilar(queryEmbedding, limit);
      
      // Format results for response
      return this.formatSearchResults(results);
    } catch (error) {
      console.error('Document search failed:', error);
      throw error;
    }
  }

  formatSearchResults(results) {
    return results.map(result => ({
      filename: result.filename,
      content: result.content,
      similarity: result._distance,
      metadata: result.metadata
    }));
  }

  async generateDocumentResponse(query, searchResults) {
    // Combine relevant document chunks
    const context = searchResults
      .map(result => `From ${result.filename}:\n${result.content}`)
      .join('\n\n');
    
    // Create enhanced prompt with document context
    const enhancedPrompt = `Based on the following documents, please answer the question: "${query}"\n\nDocument Context:\n${context}\n\nAnswer:`;
    
    return {
      prompt: enhancedPrompt,
      sources: searchResults.map(r => ({
        filename: r.filename,
        similarity: r.similarity
      }))
    };
  }
}
```

### 4. API Integration

#### Enhanced Search Route (routes/search.mjs)
```javascript
// Add to existing search.mjs
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';

// Initialize document search
const documentSearch = new DocumentSearch();
await documentSearch.initialize();

// Modify existing search route
router.post('/', async (req, res) => {
  try {
    const { query, sourceType, ...otherParams } = req.body;
    
    let finalQuery = query;
    let documentSources = [];
    
    // Handle Local Documents Only source type
    if (sourceType === 'Local Documents Only') {
      const searchResults = await documentSearch.searchDocuments(query, 5);
      const documentResponse = await documentSearch.generateDocumentResponse(query, searchResults);
      
      finalQuery = documentResponse.prompt;
      documentSources = documentResponse.sources;
    }
    
    // Handle Local Model and Documents source type
    if (sourceType === 'Local Model and Documents') {
      const searchResults = await documentSearch.searchDocuments(query, 3);
      const documentResponse = await documentSearch.generateDocumentResponse(query, searchResults);
      
      // Combine original query with document context
      finalQuery = `${query}\n\nAdditional Context from Documents:\n${documentResponse.prompt}`;
      documentSources = documentResponse.sources;
    }
    
    // Continue with existing search logic using finalQuery
    const result = await scorer.process(finalQuery, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode);
    
    // Add document sources to result
    result.documentSources = documentSources;
    
    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### New Document Management Route (routes/documents.mjs)
```javascript
import express from 'express';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import { EmbeddingService } from '../lib/documents/embeddingService.mjs';
import { VectorStore } from '../lib/documents/vectorStore.mjs';

const router = express.Router();

// Process all documents endpoint
router.post('/process', async (req, res) => {
  try {
    const processor = new DocumentProcessor();
    const embeddingService = new EmbeddingService();
    const vectorStore = new VectorStore();
    
    await vectorStore.initialize();
    
    const results = await processor.processAllDocuments();
    
    // Generate embeddings and store in vector database
    for (const result of results) {
      const chunks = embeddingService.chunkText(result.content);
      const embeddings = await embeddingService.generateBatchEmbeddings(chunks);
      
      await vectorStore.addDocument(
        result.filename,
        chunks,
        embeddings,
        result.metadata
      );
    }
    
    res.json({ 
      success: true, 
      processed: results.length,
      message: 'Documents processed and indexed successfully'
    });
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List processed documents endpoint
router.get('/list', async (req, res) => {
  try {
    const vectorStore = new VectorStore();
    await vectorStore.initialize();
    
    // Get list of all documents in vector store
    const documents = await vectorStore.table
      .search()
      .select(['filename', 'metadata'])
      .toArray();
    
    // Group by filename and get metadata
    const uniqueDocuments = documents.reduce((acc, doc) => {
      if (!acc[doc.filename]) {
        acc[doc.filename] = {
          filename: doc.filename,
          chunks: 0,
          metadata: doc.metadata
        };
      }
      acc[doc.filename].chunks++;
      return acc;
    }, {});
    
    res.json(Object.values(uniqueDocuments));
  } catch (error) {
    console.error('Document listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 5. Initial Setup Script

#### Document Processing Script (scripts/processDocuments.mjs)
```javascript
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import { EmbeddingService } from '../lib/documents/embeddingService.mjs';
import { VectorStore } from '../lib/documents/vectorStore.mjs';

async function processAllDocuments() {
  console.log('Starting document processing...');
  
  try {
    const processor = new DocumentProcessor();
    const embeddingService = new EmbeddingService();
    const vectorStore = new VectorStore();
    
    await vectorStore.initialize();
    
    console.log('Processing documents to markdown...');
    const results = await processor.processAllDocuments();
    console.log(`Processed ${results.length} documents`);
    
    console.log('Generating embeddings and storing in vector database...');
    for (const result of results) {
      console.log(`Processing ${result.filename}...`);
      
      const chunks = embeddingService.chunkText(result.content);
      console.log(`  Created ${chunks.length} chunks`);
      
      const embeddings = await embeddingService.generateBatchEmbeddings(chunks);
      console.log(`  Generated ${embeddings.length} embeddings`);
      
      await vectorStore.addDocument(
        result.filename,
        chunks,
        embeddings,
        result.metadata
      );
      console.log(`  Stored in vector database`);
    }
    
    console.log('Document processing completed successfully!');
  } catch (error) {
    console.error('Document processing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllDocuments();
}
```

### 6. Integration with Existing System

#### Enhanced combinedSearchScorer.mjs
```javascript
// Add to existing combinedSearchScorer.mjs
import { DocumentSearch } from './documents/documentSearch.mjs';

class CombinedSearchScorer {
  constructor() {
    // Existing constructor code...
    this.documentSearch = new DocumentSearch();
  }

  async initialize() {
    await this.documentSearch.initialize();
  }

  async process(query, enableScoring = true, model = null, temperature = 0.3, context = 0.3, systemPrompt = null, systemPromptName = null, tokenLimit = null, sourceType = null, testCode = null) {
    // Handle document-based source types
    let finalQuery = query;
    let documentSources = [];
    
    if (sourceType === 'Local Documents Only' || sourceType === 'Local Model and Documents') {
      const searchResults = await this.documentSearch.searchDocuments(query, 5);
      const documentResponse = await this.documentSearch.generateDocumentResponse(query, searchResults);
      
      if (sourceType === 'Local Documents Only') {
        finalQuery = documentResponse.prompt;
      } else {
        finalQuery = `${query}\n\nAdditional Context:\n${documentResponse.prompt}`;
      }
      
      documentSources = documentResponse.sources;
    }
    
    // Continue with existing search logic using finalQuery
    const searchResponse = await this.#search(finalQuery, searchModel, temperature, context, systemPrompt, tokenLimit);
    
    // Add document sources to response
    searchResponse.documentSources = documentSources;
    
    // Rest of existing logic...
  }
}
```

### 7. Setup and Deployment

#### Installation Steps
```bash
# 1. Install dependencies
cd server/s01_server-first-app
npm install pdf-parse mammoth turndown lancedb @lancedb/embeddings fs-extra mime-types markdown-it cheerio

# 2. Install Ollama model
ollama pull nomic-embed-text

# 3. Create required directories
mkdir -p data/embeddings
mkdir -p data/processed

# 4. Add documents to source folder
# Place PDF, TXT, DOCX files in sources/local-documents/my-literature/

# 5. Run initial document processing
node scripts/processDocuments.mjs

# 6. Start application with document support
./start.sh
```

#### Testing Local Documents Functionality
```bash
# 1. Start application
./start.sh

# 2. Test document processing endpoint
curl -X POST http://localhost:3001/api/documents/process

# 3. List processed documents
curl http://localhost:3001/api/documents/list

# 4. Test search with Local Documents Only
# Use frontend with Source Type = "Local Documents Only"
# Submit query and verify document-based responses
```

### 8. Expected Results

#### Source Type Behavior
- **Local Model Only**: Uses AI model knowledge only (existing behavior)
- **Local Documents Only**: Uses only document embeddings and content for responses
- **Local Model and Documents**: Combines AI model knowledge with document context

#### Performance Expectations
- **Initial Processing**: 1-5 minutes depending on document count and size
- **Search Response**: 2-8 seconds (includes embedding generation and vector search)
- **Storage Requirements**: ~10MB per 100 documents (varies by content length)

#### TestCode Integration
- All document-based searches will generate appropriate TestCodes
- Position 2 will correctly reflect source type (2 or 3)
- Export functionality will include document source information

This implementation provides a complete local document processing system that integrates seamlessly with the existing AI Search & Score application architecture while enabling powerful document-based search capabilities.