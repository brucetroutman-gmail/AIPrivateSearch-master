# AIPrivateSearch Embedding Architecture

## Overview
AIPrivateSearch uses a **per-collection embedding database architecture** where each document collection maintains its own isolated SQLite database for embeddings and metadata.

## Architecture Design

### Per-Collection Database Structure
```
sources/local-documents/
├── Collection-Name/
│   ├── embeddings.db          # Collection-specific database
│   ├── document1.txt
│   ├── document2.pdf
│   └── ...
└── Another-Collection/
    ├── embeddings.db          # Separate database
    └── ...
```

### Database Schema (per collection)
Each `embeddings.db` contains:

**documents table**:
- `id` - Unique document identifier
- `filename` - Original filename
- `content_hash` - SHA-256 hash for deduplication
- `full_content` - Complete document text
- `document_embedding` - Full document embedding vector
- `processed_at` - Processing timestamp

**chunks table**:
- `id` - Unique chunk identifier
- `document_id` - Reference to parent document
- `chunk_index` - Sequential chunk number
- `content` - Chunk text content
- `embedding` - Chunk embedding vector
- `start_char`/`end_char` - Position in original document
- `chunk_type` - Chunking method used

**collection_documents table**:
- `document_id` - Links documents to collections
- `filename` - Collection-specific filename
- `added_at` - When added to collection

## Benefits of Per-Collection Architecture

### ✅ Performance Advantages
- **Isolated Performance**: Large collections don't impact small ones
- **Faster Queries**: Smaller databases = faster search operations
- **Parallel Processing**: Multiple collections can be processed simultaneously
- **Optimized Indexing**: Collection-specific optimization possible

### ✅ Management Benefits
- **Independent Backup**: Backup/restore individual collections
- **Selective Maintenance**: Rebuild only affected collections
- **Collection Portability**: Easy to move/share specific collections
- **Granular Control**: Per-collection settings and configurations

### ✅ Scalability
- **Linear Scaling**: Performance scales with collection size, not total system size
- **Memory Efficiency**: Only load embeddings for active collections
- **Storage Distribution**: Spread across filesystem naturally
- **Concurrent Access**: Multiple collections can be accessed simultaneously

## Implementation Details

### Service Class: UnifiedEmbeddingService
Despite the name "Unified", this service manages per-collection databases:

```javascript
getCollectionDbPath(collection) {
  return path.join(CollectionsUtil.getCollectionsPath(), collection, 'embeddings.db');
}

async getCollectionDb(collection) {
  if (!this.dbs.has(collection)) {
    const dbPath = this.getCollectionDbPath(collection);
    this.dbs.set(collection, new SqlJsWrapper(dbPath));
  }
  return this.dbs.get(collection);
}
```

### Embedding Process
1. **Document Processing**: Each document processed into semantic chunks
2. **Embedding Generation**: Both document-level and chunk-level embeddings created
3. **Storage**: Embeddings stored in collection-specific database
4. **Deduplication**: Content hash prevents duplicate processing
5. **Indexing**: Automatic indexing for fast similarity search

### Search Process
1. **Query Embedding**: Convert search query to embedding vector
2. **Collection Selection**: Target specific collection database
3. **Similarity Calculation**: Cosine similarity against chunk embeddings
4. **Result Ranking**: Return top-K most similar chunks
5. **Metadata Enrichment**: Include filename and position information

## Current Collections Status

| Collection | Database Size | Documents | Status |
|------------|---------------|-----------|---------|
| My-Literature | 33MB | ~Large corpus | ✅ Active |
| Federalist-Papers | 18MB | ~85 papers | ✅ Active |
| Family-Documents | 1.2MB | ~Mixed docs | ✅ Active |
| Law-Office | 900KB | ~Legal docs | ✅ Active |
| USA-History | 832KB | ~Historical | ✅ Active |
| Medical-Practice | 376KB | ~Medical | ✅ Active |
| A-Poem | 64KB | ~Poetry | ✅ Active |

## Maintenance Operations

### Adding Documents
```javascript
await embeddingService.processDocument(filename, content, collection);
```

### Searching Collections
```javascript
const results = await embeddingService.findSimilarChunks(query, collection, topK);
```

### Collection Statistics
```javascript
const stats = await embeddingService.getStats(collection);
// Returns: { documents: N, chunks: N, collection: "name" }
```

### Removing Documents
```javascript
await embeddingService.removeDocument(collection, filename);
```

## Performance Characteristics

### Typical Performance (per collection)
- **Small Collections** (< 1MB): Sub-second search
- **Medium Collections** (1-10MB): 1-3 second search
- **Large Collections** (10MB+): 3-10 second search

### Memory Usage
- **Per Collection**: ~10-50MB RAM during active use
- **Idle Collections**: Minimal memory footprint
- **Concurrent Collections**: Linear memory scaling

## Migration Notes

### From Unified Database (if needed)
The system was designed for per-collection from the start. No migration needed.

### Adding New Collections
1. Create collection folder in `sources/local-documents/`
2. Add documents to folder
3. Process via collections interface
4. Database created automatically

### Backup Strategy
```bash
# Backup specific collection
cp sources/local-documents/Collection-Name/embeddings.db backup/

# Backup all collections
tar -czf collections-backup.tar.gz sources/local-documents/*/embeddings.db
```

## Future Considerations

### Potential Enhancements
- **Cross-Collection Search**: Search across multiple collections simultaneously
- **Collection Merging**: Combine related collections
- **Distributed Storage**: Store collections on different drives
- **Compression**: Compress inactive collection databases

### Monitoring
- Database size growth tracking
- Query performance metrics
- Collection usage statistics
- Embedding quality assessment

---

**Architecture Type**: Per-Collection Isolated Databases  
**Primary Benefits**: Performance, Scalability, Management Flexibility  
**Trade-offs**: No cross-collection search (by design)  
**Status**: Production Ready ✅