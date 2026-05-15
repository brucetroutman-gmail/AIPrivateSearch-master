# AIPrivateSearch API Endpoints v19.00

## Overview
Complete list of REST API endpoints for AIPrivateSearch platform with request/response specifications.

---

## Search Endpoints

### Main Search
**POST** `/api/search`
- **Purpose**: Primary search endpoint with scoring capabilities
- **Auth**: Required with rate limit (30 requests/60s)
- **Body**: `{ query, score, model, temperature, context, systemPrompt, tokenLimit, sourceType, testCode, collection, showChunks, scoreModel, searchType, useWildcards }`
- **Response**: Search results with optional scoring and performance metrics

### Line Search
**POST** `/api/search/line-search`
- **Purpose**: Exact text matching with line-by-line search
- **Body**: `{ query, options }`
- **Response**: Line search results with exact matches

---

## Multi-Search Endpoints

### Multi-Method Search
**POST** `/api/multi-search/multi-method`
- **Purpose**: Execute multiple search methods in parallel
- **Body**: `{ query, methods, options }`
- **Response**: Results from all selected search methods

### Individual Search Methods
**POST** `/api/multi-search/line-search`
- **Purpose**: Line-by-line search with Boolean logic
- **Body**: `{ query, options }`

**POST** `/api/multi-search/document-index`
- **Purpose**: Structured queries using document metadata
- **Body**: `{ query, options }`

**POST** `/api/multi-search/document-search`
- **Purpose**: Indexed search with ranking and stemming
- **Body**: `{ query, options }`

**POST** `/api/multi-search/smart-search`
- **Purpose**: Semantic similarity using embeddings
- **Body**: `{ query, options }`

**POST** `/api/multi-search/hybrid-search`
- **Purpose**: Combined keyword and semantic methods
- **Body**: `{ query, options }`

**POST** `/api/multi-search/ai-direct`
- **Purpose**: Direct AI model responses
- **Body**: `{ query, options }`

**POST** `/api/multi-search/ai-document-chat`
- **Purpose**: AI analysis with document retrieval
- **Body**: `{ query, options }`

### Search Metadata
**GET** `/api/multi-search/methods`
- **Purpose**: Get available search methods and descriptions
- **Response**: `{ methods, descriptions }`

**GET** `/api/multi-search/collections`
- **Purpose**: Get available document collections
- **Response**: `{ collections }`

---

## Document Management Endpoints

### Collection Management
**POST** `/api/documents/collections/create`
- **Purpose**: Create new document collection
- **Body**: `{ name }`
- **Response**: `{ success, message }`

**GET** `/api/documents/collections/:collection/files`
- **Purpose**: List files in collection
- **Response**: `{ files }`

**DELETE** `/api/documents/collections/:collection`
- **Purpose**: Delete entire collection
- **Response**: `{ success }`

### File Operations
**POST** `/api/documents/collections/:collection/upload`
- **Purpose**: Upload file to collection
- **Body**: FormData with file
- **Response**: `{ success, message }`

**DELETE** `/api/documents/collections/:collection/files/:filename`
- **Purpose**: Delete individual file
- **Response**: `{ success }`

**GET** `/api/documents/:collection/:filename`
- **Purpose**: Serve document files
- **Response**: File content with appropriate MIME type

**GET** `/api/documents/:collection/:filename/view`
- **Purpose**: View document with line numbers and highlighting
- **Query**: `?line=N` (optional line number)
- **Response**: HTML document viewer

### Document Processing
**POST** `/api/documents/convert-selected`
- **Purpose**: Convert selected documents to markdown
- **Body**: `{ collection, files }`
- **Response**: `{ success, converted, errors }`

### Document Indexing
**GET** `/api/documents/collections/:collection/indexed`
- **Purpose**: Get indexed documents status
- **Response**: `{ documents: [{ filename, inLanceDB, chunks, processed_at }] }`

**POST** `/api/documents/collections/:collection/index/:filename`
- **Purpose**: Index/embed a document
- **Response**: Processing result

**DELETE** `/api/documents/collections/:collection/index/:filename`
- **Purpose**: Remove document embeddings
- **Response**: `{ success }`

**GET** `/api/documents/collections/:collection/embeddings-info`
- **Purpose**: Get embeddings information
- **Response**: `{ lanceDB: { documents, totalChunks } }`

**POST** `/api/documents/collections/:collection/search`
- **Purpose**: Search in collection using embeddings
- **Body**: `{ query, limit }`
- **Response**: `{ results }`

---

## Document Index Management

### Index Operations
**POST** `/api/multi-search/document-index-create`
- **Purpose**: Create document indexes for collection
- **Body**: `{ collection }`
- **Response**: `{ success, collection, documentsProcessed }`

**POST** `/api/multi-search/document-index-create-single`
- **Purpose**: Index single document for real-time progress
- **Body**: `{ collection, filename }`
- **Response**: `{ success, collection, filename, docId, updated }`

**POST** `/api/multi-search/document-index-status`
- **Purpose**: Get document index status for collection
- **Body**: `{ collection }`
- **Response**: `{ success, documents }`

### Index Viewing and Editing
**POST** `/api/multi-search/document-index-view`
- **Purpose**: View document index for specific document
- **Body**: `{ collection, filename }`
- **Response**: `{ success, documentIndex }`

**POST** `/api/multi-search/document-index-update`
- **Purpose**: Update document index comments
- **Body**: `{ id, comments }`
- **Response**: `{ success, updated }`

**POST** `/api/multi-search/document-index-update-all`
- **Purpose**: Update all document index fields
- **Body**: Document index object with id
- **Response**: `{ success, updated }`

### Cleanup Operations
**POST** `/api/multi-search/cleanup-meta-files`
- **Purpose**: Cleanup META_ files from collection
- **Body**: `{ collection }`
- **Response**: `{ success, collection, filesDeleted }`

---

## Model Management Endpoints

### Model Operations
**GET** `/api/models`
- **Purpose**: Get available Ollama models
- **Auth**: Required with rate limit (10 requests/60s)
- **Response**: `{ models }` (filtered and sorted)

---

## Database Endpoints

### Data Persistence
**POST** `/api/database/save`
- **Purpose**: Save search results to MySQL database
- **Auth**: Required with rate limit (50 requests/60s)
- **Body**: Complete search result object with metrics
- **Response**: `{ success, insertId }`

**GET** `/api/database/tests`
- **Purpose**: Get all test data for analysis
- **Auth**: Required with rate limit (20 requests/60s)
- **Response**: `{ success, tests }`

---

## Configuration Endpoints

### Config File Management
**GET** `/api/config/files`
- **Purpose**: List available configuration files
- **Auth**: Required
- **Response**: Array of JSON filenames

**GET** `/api/config/:filename`
- **Purpose**: Get configuration file content
- **Auth**: Required
- **Response**: `{ content }`

**PUT** `/api/config/:filename`
- **Purpose**: Update configuration file
- **Auth**: Required
- **Body**: `{ content }`
- **Response**: `{ success }`

---

## Authentication & Rate Limiting

### Authentication Middleware
- **requireAuth**: Basic authentication check
- **requireAuthWithRateLimit(requests, windowMs)**: Authentication with rate limiting

### Rate Limits
- **Search endpoints**: 30 requests per 60 seconds
- **Model endpoints**: 10 requests per 60 seconds
- **Database save**: 50 requests per 60 seconds
- **Database tests**: 20 requests per 60 seconds

---

## Request/Response Formats

### Standard Search Response
```json
{
  "response": "Search results or AI response",
  "query": "Original search query",
  "sourceType": "local-documents|local-model",
  "collection": "Collection name (if applicable)",
  "searchType": "Search method used",
  "createdAt": "ISO timestamp",
  "testCode": "Generated test code",
  "scores": {
    "accuracy": 1-3,
    "relevance": 1-3,
    "organization": 1-3,
    "total": "Weighted percentage"
  },
  "metrics": {
    "search": {
      "model": "Model name",
      "total_duration": "Nanoseconds",
      "eval_count": "Token count",
      "temperature": "Model temperature",
      "context_size": "Context window size"
    },
    "scoring": {
      "model": "Scoring model name",
      "total_duration": "Nanoseconds",
      "eval_count": "Token count"
    }
  },
  "chunks": "Document chunks (if applicable)",
  "systemInfo": {
    "cpu": "CPU information",
    "memory": "Memory information",
    "os": "Operating system"
  }
}
```

### Multi-Search Response
```json
{
  "success": true,
  "query": "Search query",
  "methods": ["method1", "method2"],
  "results": {
    "method1": {
      "results": [...],
      "count": 5,
      "executionTime": 0.234
    },
    "method2": {
      "results": [...],
      "count": 3,
      "executionTime": 1.567
    }
  },
  "summary": {
    "totalResults": 8,
    "totalTime": 1.801,
    "methodsUsed": 2
  }
}
```

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "Error code (if applicable)"
}
```

---

## Security Considerations

### Input Validation
- All file paths validated against directory traversal
- Filename validation for config operations
- Query parameter sanitization
- File type restrictions for uploads

### Authentication
- Email-based authentication required for most endpoints
- Rate limiting prevents abuse
- Secure file operations with path validation

### Data Protection
- Local processing for document content
- Environment variable protection
- Secure database connections
- XSS prevention in responses

---

**Version**: 19.00  
**Last Updated**: December 2024  
**Total Endpoints**: 35+  
**Authentication**: Required for most operations  
**Rate Limiting**: Implemented per endpoint type