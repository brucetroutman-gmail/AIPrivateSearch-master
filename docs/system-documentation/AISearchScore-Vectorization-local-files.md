# AISearchScore - Vectorization of Local Files

## Overview
AISearchScore uses vector embeddings to enable semantic search across local document collections. This document explains how vectorization works, where files are stored, and how to view and test the system.

## What is Vectorization?

### Concept
Vectorization converts text into numerical arrays (vectors) that represent the semantic meaning of the content. Similar content produces similar vectors, enabling semantic search rather than just keyword matching.

### Example
```
Text: "The Constitution establishes government framework"
Vector: [0.123, -0.456, 0.789, 0.234, -0.567, ...]
```

Similar texts like "Constitutional framework for governance" would produce vectors with high similarity scores when compared mathematically.

## Vectorization Pipeline in AISearchScore

### 1. Document Upload and Conversion
**Location**: `/sources/local-documents/{collection}/`

**Process**:
1. User uploads documents (PDF, TXT, MD) via Collections interface
2. Files stored in collection-specific folders
3. Non-MD files converted to Markdown format

**Example Structure**:
```
/sources/local-documents/
├── USA-History/
│   ├── constitution.pdf          # Original file
│   ├── constitution.md           # Converted to MD
│   ├── bill-of-rights.txt        # Original file
│   └── bill-of-rights.md         # Converted to MD
└── Family-Documents/
    ├── genealogy.pdf
    └── genealogy.md
```

### 2. Text Chunking
**File**: `server/lib/documents/embeddingService.mjs`

**Process**:
```javascript
chunkText(text, chunkSize = 500, overlap = 50) {
  // Splits text into ~500 character chunks with 50 character overlap
  // Ensures chunks don't break mid-sentence
  // Returns array of text chunks
}
```

**Example**:
```
Original: "The Constitution of the United States establishes the framework..."
Chunks: [
  "The Constitution of the United States establishes the framework for federal government...",
  "...framework for federal government and defines the separation of powers between...",
  "...separation of powers between legislative, executive, and judicial branches..."
]
```

### 3. Embedding Generation
**File**: `server/lib/documents/embeddingService.mjs`

**Process**:
```javascript
async generateEmbedding(text) {
  // Calls Ollama API to generate embeddings
  // Uses nomic-embed-text model by default
  // Returns 768-dimensional vector array
}

async generateBatchEmbeddings(chunks) {
  // Processes multiple chunks efficiently
  // Returns array of embedding vectors
}
```

**API Call**:
```javascript
const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'nomic-embed-text',
    prompt: text
  })
});
```

### 4. Vector Storage
**Location**: `server/data/embeddings/{collection}/`

**Files**:
- `index.json` - Document metadata
- `vectors.json` - Actual embeddings and content

**File**: `server/lib/documents/vectorStore.mjs`

## File Locations and Structure

### Source Documents
```
/sources/local-documents/{collection}/
├── document1.pdf          # Original uploaded file
├── document1.md           # Converted markdown
├── document2.txt          # Original text file
├── document2.md           # Converted markdown
└── .chunks/               # Temporary folder during chunked uploads
```

### Vector Database
```
/server/data/embeddings/{collection}/
├── index.json             # Document index and metadata
└── vectors.json           # Vector embeddings and content chunks
```

### Processing Code
```
/server/lib/documents/
├── embeddingService.mjs   # Text chunking and embedding generation
├── vectorStore.mjs        # Vector storage and similarity search
├── documentSearch.mjs     # High-level search interface
├── collectionManager.mjs  # File management operations
└── documentProcessor.mjs  # Document conversion (PDF→MD)
```

## Vector Database Format

### index.json Structure
```json
{
  "documents": [
    {
      "id": "USA-History_constitution.md",
      "filename": "constitution.md",
      "collection": "USA-History",
      "chunks": 47,
      "metadata": {
        "processedAt": "2024-01-15T10:30:00.000Z",
        "originalLength": 23456
      }
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### vectors.json Structure
```json
{
  "vectors": [
    {
      "id": "USA-History_constitution.md_chunk_0",
      "documentId": "USA-History_constitution.md",
      "filename": "constitution.md",
      "collection": "USA-History",
      "chunkIndex": 0,
      "content": "The Constitution of the United States establishes...",
      "embedding": [0.123, -0.456, 0.789, 0.234, -0.567, ...]
    },
    {
      "id": "USA-History_constitution.md_chunk_1",
      "documentId": "USA-History_constitution.md",
      "filename": "constitution.md",
      "collection": "USA-History",
      "chunkIndex": 1,
      "content": "Article I establishes the legislative branch...",
      "embedding": [0.234, -0.345, 0.678, 0.123, -0.789, ...]
    }
  ]
}
```

## How to View Vector Data

### 1. View Document Index
```bash
# Navigate to embeddings directory
cd /Users/Shared/repos/AISearchScore-bruce/server/s01_server-first-app/data/embeddings

# List collections
ls -la

# View collection index
cat USA-History/index.json | jq '.'
```

### 2. View Vector Data (Partial)
```bash
# View first few vectors (vectors.json is large)
head -50 USA-History/vectors.json

# Count total vectors
cat USA-History/vectors.json | jq '.vectors | length'

# View specific vector structure
cat USA-History/vectors.json | jq '.vectors[0]'
```

### 3. View Source Documents
```bash
# Navigate to source documents
cd /Users/Shared/repos/AISearchScore-bruce/sources/local-documents

# List collections
ls -la

# View collection contents
ls -la USA-History/

# View converted markdown
head -20 USA-History/constitution.md
```

## How to Test Vectorization

### 1. Test Document Processing
**Via Collections Interface**:
1. Go to `http://localhost:3000/collections.html`
2. Select a collection (e.g., "USA-History")
3. Upload a document (PDF or TXT)
4. Click "Convert to MD" for the uploaded file
5. Click "Process MD Files" to generate embeddings

**Check Results**:
```bash
# Verify MD file was created
ls -la /Users/Shared/repos/AISearchScore-bruce/sources/local-documents/USA-History/

# Verify embeddings were generated
ls -la /Users/Shared/repos/AISearchScore-bruce/server/s01_server-first-app/data/embeddings/USA-History/

# Check vector count
cat /Users/Shared/repos/AISearchScore-bruce/server/s01_server-first-app/data/embeddings/USA-History/vectors.json | jq '.vectors | length'
```

### 2. Test Semantic Search
**Via Search Interface**:
1. Go to `http://localhost:3000/search.html`
2. Select "Local Documents Only" from Source Type
3. Select collection from dropdown
4. Enter search query (e.g., "constitutional framework")
5. Submit search

**Expected Results**:
- AI response based on relevant document chunks
- Source attribution showing which documents were used
- Similarity scores in server logs

### 3. Test Direct Vector Search
**Via Collections Test Search**:
1. Go to `http://localhost:3000/collections-editor.html?collection=USA-History`
2. Click "Test Search" button
3. Enter query (e.g., "bill of rights")
4. View raw similarity results

**Expected Output**:
```
✓ Found 3 results:
  1. constitution.md (similarity: 0.847)
     "The Bill of Rights comprises the first ten amendments..."
  2. amendments.md (similarity: 0.623)
     "Constitutional amendments protect individual liberties..."
```

## Similarity Search Algorithm

### Cosine Similarity
**File**: `server/lib/documents/vectorStore.mjs`

```javascript
cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### Search Process
1. **Query Vectorization**: Convert search query to embedding vector
2. **Similarity Calculation**: Compare query vector to all stored vectors
3. **Ranking**: Sort results by similarity score (0-1, higher = more similar)
4. **Filtering**: Return top N results (default: 5)

## Performance Characteristics

### Embedding Generation
- **Speed**: ~100-500ms per chunk (depends on model)
- **Model**: nomic-embed-text (768 dimensions)
- **Batch Processing**: Multiple chunks processed together

### Search Performance
- **Vector Comparison**: ~1-50ms for typical collections
- **Memory Usage**: Entire vector database loaded in memory
- **Scalability**: Linear with number of chunks

### Storage Requirements
- **Text Content**: ~1KB per chunk
- **Vector Data**: ~3KB per chunk (768 floats)
- **Total**: ~4KB per chunk storage overhead

## Troubleshooting

### Common Issues

#### 1. No Embeddings Generated
**Symptoms**: Search returns "No results found"
**Check**:
```bash
# Verify vectors.json exists and has content
ls -la server/data/embeddings/USA-History/
cat server/data/embeddings/USA-History/vectors.json | jq '.vectors | length'
```

**Solution**: Re-process MD files via Collections interface

#### 2. Ollama Connection Issues
**Symptoms**: Embedding generation fails
**Check**:
```bash
# Test Ollama connection
curl http://localhost:11434/api/tags

# Test embedding endpoint
curl -X POST http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text", "prompt": "test"}'
```

**Solution**: Ensure Ollama is running and nomic-embed-text model is installed

#### 3. Large File Processing
**Symptoms**: Processing fails for large documents
**Check**: Server logs for memory or timeout errors
**Solution**: Break large documents into smaller files

### Debug Commands

#### View Processing Status
```bash
# Check server logs
tail -f server/s01_server-first-app/server.log

# Check collection processing status
curl http://localhost:3001/api/documents/collections/USA-History/indexed
```

#### Manual Vector Search Test
```bash
# Test vector search API directly
curl -X POST http://localhost:3001/api/documents/collections/USA-History/search \
  -H "Content-Type: application/json" \
  -d '{"query": "constitution", "limit": 3}'
```

## Advanced Usage

### Custom Embedding Models
**File**: `server/lib/documents/embeddingService.mjs`

```javascript
// Change embedding model
this.model = 'nomic-embed-text';  // Default
// this.model = 'all-minilm';     // Alternative
```

### Chunk Size Optimization
```javascript
// Adjust chunk size for different content types
const chunks = this.embeddingService.chunkText(content, 750, 75);  // Larger chunks
const chunks = this.embeddingService.chunkText(content, 300, 30);  // Smaller chunks
```

### Similarity Threshold
```javascript
// Filter results by minimum similarity
const results = similarities
  .filter(result => result.similarity > 0.5)  // Only results > 50% similar
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, limit);
```

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Dependencies**: Ollama, nomic-embed-text model