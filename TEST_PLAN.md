# Local Documents Test Plan

## Phase 1: Setup & Dependencies

### 1.1 Install Dependencies
```bash
cd server/s01_server-first-app
npm install fs-extra
```

### 1.2 Verify Ollama
```bash
ollama pull nomic-embed-text
ollama list | grep nomic-embed-text
```

### 1.3 Start Server
```bash
npm start
# Should see: Server running on port 3001
```

## Phase 2: Basic API Tests

### 2.1 Test Collections Endpoint
```bash
curl http://localhost:3001/api/documents/collections
# Expected: {"collections":["Family-Documents","USA-History","My-Literature"]}
```

### 2.2 Test File Listing
```bash
curl http://localhost:3001/api/documents/collections/Family-Documents/files
# Expected: List of .md files
```

### 2.3 Test Document Reading
```bash
curl http://localhost:3001/api/documents/collections/Family-Documents/files/Will_Dubie_Duk.md
# Expected: Document content
```

## Phase 3: Embedding & Indexing Tests

### 3.1 Process All Documents
```bash
npm run process-docs
# Expected: Processing messages for all collections
```

### 3.2 Verify Index Creation
```bash
ls -la data/embeddings/
# Expected: Family-Documents/, USA-History/, My-Literature/ directories
```

### 3.3 Check Index Files
```bash
cat data/embeddings/Family-Documents/index.json | jq .
# Expected: JSON with documents array
```

## Phase 4: Search Functionality Tests

### 4.1 Basic Search Test
```bash
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "insurance", "limit": 3}'
```

### 4.2 Specific Search Tests
```bash
# Test 1: Insurance-related search
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "life insurance policy beneficiary", "limit": 5}'

# Test 2: Property-related search  
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "house property deed mortgage", "limit": 5}'

# Test 3: Financial search
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "bank account investment 401k", "limit": 5}'
```

### 4.3 Cross-Collection Search
```bash
# Test USA-History collection
curl -X POST http://localhost:3001/api/documents/collections/USA-History/search \
  -H "Content-Type: application/json" \
  -d '{"query": "constitution", "limit": 3}'

# Test My-Literature collection  
curl -X POST http://localhost:3001/api/documents/collections/My-Literature/search \
  -H "Content-Type: application/json" \
  -d '{"query": "character", "limit": 3}'
```

## Phase 5: CRUD Operations Tests

### 5.1 Create New Document
```bash
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/files/test_document.md \
  -H "Content-Type: application/json" \
  -d '{"content": "# Test Document\n\nThis is a test document for CRUD operations."}'
```

### 5.2 Update Document
```bash
curl -X PUT http://localhost:3001/api/documents/collections/Family-Documents/files/test_document.md \
  -H "Content-Type: application/json" \
  -d '{"content": "# Updated Test Document\n\nThis document has been updated."}'
```

### 5.3 Index New Document
```bash
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/index/test_document.md
```

### 5.4 Search for New Document
```bash
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "updated test document", "limit": 3}'
```

### 5.5 Delete Document
```bash
curl -X DELETE http://localhost:3001/api/documents/collections/Family-Documents/files/test_document.md
```

## Phase 6: Performance & Quality Tests

### 6.1 Check Similarity Scores
Look for similarity scores > 0.7 for relevant matches, < 0.3 for irrelevant

### 6.2 Test Edge Cases
```bash
# Empty query
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "", "limit": 3}'

# Very long query
curl -X POST http://localhost:3001/api/documents/collections/Family-Documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "very long query with many words that should still work properly and return relevant results", "limit": 3}'
```

## Expected Results Summary

### Success Criteria:
- ✅ All API endpoints return 200 status
- ✅ Collections list shows 3 collections
- ✅ Family-Documents shows 11 files
- ✅ Processing script completes without errors
- ✅ Search returns relevant results with similarity scores
- ✅ CRUD operations work correctly
- ✅ Cross-collection searches work independently

### Key Test Queries for Family-Documents:
1. "insurance" → Should find Life_Insurance_Policy.md, Auto_Insurance_Policy.md
2. "mortgage property" → Should find Property_Deed.md, Property_Insurance_Policy.md  
3. "will testament" → Should find Will_Dubie_Duk.md
4. "bank account" → Should find Bank_Statements_2025.md
5. "medical doctor" → Should find Medical_Records_Summary.md

Run tests in order - each phase depends on the previous one completing successfully.