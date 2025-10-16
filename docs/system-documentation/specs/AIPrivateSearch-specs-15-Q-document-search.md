# AIPrivateSearch Specs v15 - Local Document Search

## Overview
Local document search functionality that enables users to search their own document collections using AI-powered semantic search instead of internet sources.

## Feature Summary
- **Source Type**: "Local Documents Only" option in search interface
- **Collection Selection**: Dropdown to choose from available document collections
- **Assistant Type**: Automatic filtering to "Documents Only" assistant
- **Semantic Search**: Vector-based similarity search through processed documents
- **AI Processing**: Retrieved documents are processed by AI model for intelligent responses
- **Source Attribution**: Results include source document names and similarity scores

## User Interface

### Search Form Updates
- **Source Type Dropdown**: Added "Local Documents Only" option
- **Collection Dropdown**: Appears when local documents source is selected
- **Assistant Type Filtering**: Shows only "Documents Only" for local document searches
- **Validation**: Requires collection selection for local document searches

### UI Behavior
```
User Flow:
1. Select "Local Documents Only" from Source Type
2. Collection dropdown appears with available collections
3. Assistant Type automatically filters to "Documents Only"
4. User selects collection and enters query
5. Search returns AI-processed results from selected documents
```

## Technical Implementation

### Frontend Changes
**Files Modified:**
- `search.html` - Added collection dropdown section
- `search.js` - Added collection loading and filtering logic
- `services/api.js` - Added collection parameter to search function

**Key Functions:**
- `loadCollections()` - Loads available collections from API
- `filterAssistantTypes()` - Filters assistants based on source type
- Collection validation in form submission

### Backend Changes
**Files Modified:**
- `routes/search.mjs` - Added DocumentSearch routing logic

**Search Flow:**
```javascript
if (collection) {
  // 1. Initialize DocumentSearch for collection
  const documentSearch = new DocumentSearch(collection);
  
  // 2. Search documents using vector similarity
  const searchResults = await documentSearch.searchDocuments(query, 5);
  
  // 3. Create document context for AI model
  const documentContext = searchResults.map(result => 
    `Document ${i + 1} (${result.filename}):\n${result.content}`
  ).join('\n\n');
  
  // 4. Enhanced prompt with document context
  const enhancedQuery = `Based on the following documents, please answer: ${query}\n\nRelevant documents:\n${documentContext}`;
  
  // 5. Process through AI model
  const result = await scorer.process(enhancedQuery, ...params);
  
  // 6. Add source attribution
  result.collection = collection;
  result.documentSources = searchResults.map(r => ({
    filename: r.filename, 
    similarity: r.similarity 
  }));
}
```

## Data Flow

### Document Processing Pipeline
1. **Document Upload** → Collections interface
2. **Format Conversion** → PDF/TXT to Markdown
3. **Text Chunking** → Break into ~500 character chunks
4. **Embedding Generation** → Create vector embeddings using AI
5. **Vector Storage** → Store in collection-specific vector database

### Search Pipeline
1. **Query Input** → User enters search query
2. **Query Embedding** → Convert query to vector embedding
3. **Similarity Search** → Find most relevant document chunks
4. **Context Assembly** → Combine relevant chunks into context
5. **AI Processing** → Send context + query to AI model
6. **Response Generation** → AI generates intelligent response
7. **Result Display** → Show response with source attribution

## Vector Database Structure

### Storage Location
```
server/data/embeddings/{collection}/
├── index.json     # Document metadata and index
└── vectors.json   # Vector embeddings and content chunks
```

### Index Format
```json
{
  "documents": [
    {
      "id": "collection_filename",
      "filename": "document.md",
      "collection": "USA-History",
      "chunks": 45,
      "metadata": {
        "processedAt": "2024-01-15T10:30:00Z",
        "originalLength": 25000
      }
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Vector Format
```json
{
  "vectors": [
    {
      "id": "collection_filename_chunk_0",
      "documentId": "collection_filename",
      "filename": "document.md",
      "collection": "USA-History",
      "chunkIndex": 0,
      "content": "The Constitution of the United States...",
      "embedding": [0.123, -0.456, 0.789, ...]
    }
  ]
}
```

## API Endpoints

### Collection Management
- `GET /api/documents/collections` - List available collections
- `POST /api/documents/collections/create` - Create new collection
- `GET /api/documents/collections/{collection}/files` - List collection files

### Document Processing
- `POST /api/documents/collections/{collection}/upload` - Upload documents
- `POST /api/documents/collections/{collection}/index/{filename}` - Process document
- `POST /api/documents/collections/{collection}/search` - Search collection

### Search Integration
- `POST /api/search` - Enhanced to handle collection parameter

## Search Results Format

### Response Structure
```json
{
  "response": "AI-generated response based on documents...",
  "query": "What is the constitution about?",
  "sourceType": "Local Documents Only",
  "collection": "USA-History",
  "documentSources": [
    {
      "filename": "constitution.md",
      "similarity": 0.847
    }
  ],
  "metrics": {
    "search": { /* AI model metrics */ }
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "testCode": "t2111110"
}
```

## Configuration

### Source Types
```json
{
  "source_types": [
    { "name": "Local Model Only" },
    { "name": "Local Documents Only" },
    { "name": "Local Model and Documents" }
  ]
}
```

### System Prompts
- **Documents Only**: Special assistant for document-based queries
- **Other Assistants**: Filtered out for local document searches

## Performance Characteristics

### Search Performance
- **Vector Search**: ~50-200ms for typical collections
- **AI Processing**: 2-15s depending on model and context size
- **Memory Usage**: Scales with collection size and embedding dimensions

### Scalability Limits
- **Collection Size**: Tested up to 1000 documents per collection
- **Document Size**: Individual documents up to 50MB
- **Concurrent Users**: Limited by AI model processing capacity

## Error Handling

### Validation Errors
- Missing collection selection
- Empty collections
- Invalid collection names

### Processing Errors
- Document conversion failures
- Embedding generation errors
- Vector database corruption

### Search Errors
- No matching documents found
- AI model processing failures
- Network connectivity issues

## Security Considerations

### Data Privacy
- Documents stored locally on server filesystem
- No external API calls for document content
- Vector embeddings contain document content

### Access Control
- No authentication currently implemented
- All collections accessible to all users
- File system permissions control access

## Future Enhancements

### Planned Features
- Multi-collection search across multiple collections
- Document preview in search results
- Advanced filtering by document type or date
- Collection sharing and permissions
- Search result ranking improvements

### Technical Improvements
- Incremental indexing for large documents
- Compressed vector storage
- Distributed vector database support
- Real-time document updates

## Testing

### Test Scenarios
1. **Basic Search**: Select collection, enter query, verify results
2. **Empty Collection**: Search empty collection, verify no results message
3. **Large Documents**: Upload and search large PDF files
4. **Multiple Collections**: Switch between different collections
5. **Error Handling**: Test without collection selection

### Performance Tests
- Search response time under load
- Memory usage with large collections
- Concurrent user handling
- Document processing throughput

## Deployment Notes

### Dependencies
- Node.js with ES modules support
- File system access for document storage
- Ollama for AI model processing
- Sufficient disk space for vector storage

### Configuration
- Ensure document upload directories exist
- Configure AI model endpoints
- Set appropriate file size limits
- Monitor disk space usage

---

**Version**: 15.0  
**Date**: January 2024  
**Status**: Implemented  
**Next Version**: Multi-collection search and advanced filtering