# Local Documents Implementation Plan

## Phase 1: Core Infrastructure ✅ COMPLETE

### Created Components:
- `CollectionManager` - CRUD operations for all 3 collections
- `EmbeddingService` - Ollama integration for nomic-embed-text
- `VectorStore` - JSON-based vector storage and similarity search
- `DocumentSearch` - Combined search and indexing operations
- REST API routes for all operations
- Processing script for bulk indexing

## Phase 2: Installation & Setup

### Install Dependencies:
```bash
cd server/s01_server-first-app
npm install fs-extra
```

### Verify Ollama Model:
```bash
ollama pull nomic-embed-text
```

## Phase 3: Initial Processing

### Process All Collections:
```bash
cd server/s01_server-first-app
npm run process-docs
```

## Phase 4: API Usage

### CRUD Operations:
- `GET /api/documents/collections` - List all collections
- `GET /api/documents/collections/:collection/files` - List files in collection
- `GET /api/documents/collections/:collection/files/:filename` - Read document
- `POST /api/documents/collections/:collection/files/:filename` - Create document
- `PUT /api/documents/collections/:collection/files/:filename` - Update document
- `DELETE /api/documents/collections/:collection/files/:filename` - Delete document

### Embedding Operations:
- `POST /api/documents/collections/:collection/index/:filename` - Index document
- `DELETE /api/documents/collections/:collection/index/:filename` - Remove from index
- `GET /api/documents/collections/:collection/indexed` - List indexed documents

### Search Operations:
- `POST /api/documents/collections/:collection/search` - Search within collection
  ```json
  { "query": "search terms", "limit": 5 }
  ```

## Phase 5: Frontend Integration

### Add to existing search interface:
1. Collection selector dropdown
2. Local documents search option
3. Results display with filename and similarity scores

## Collections Available:
- `Family-Documents` - 11 family-related documents
- `USA-History` - Historical documents
- `My-Literature` - Literature collection

## Storage Structure:
```
server/s01_server-first-app/data/
├── embeddings/
│   ├── Family-Documents/
│   │   ├── index.json
│   │   └── vectors.json
│   ├── USA-History/
│   └── My-Literature/
```

## Next Steps:
1. Run `npm install fs-extra`
2. Run `npm run process-docs` to index all documents
3. Test API endpoints
4. Integrate with frontend search interface