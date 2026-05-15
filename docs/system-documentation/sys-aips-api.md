# AIPrivateSearch API Reference

**Base URL (local dev)**: `http://localhost:3001`
**Base URL (remote Mac)**: `http://[host]:56306`
**Auth**: Session cookie required on all endpoints except `/api/auth/*` and `/api/license/*`

---

## Authentication

### POST `/api/auth/login`
Login with email.
```json
// Request
{ "email": "user@example.com" }

// Response
{ "success": true, "sessionId": "...", "user": { "email": "...", "role": "admin" } }
```

### POST `/api/auth/logout`
End session.

### GET `/api/auth/validate`
Validate current session. Returns user info if valid.

---

## Search

### POST `/api/search`
Primary search with optional AI scoring.

```json
// Request
{
  "query": "string",
  "model": "qwen2.5:3b",
  "sourceType": "local-documents | local-model",
  "collection": "collection-name",
  "searchType": "line-search | document-search | smart-search | ...",
  "score": false,
  "scoreModel": "gemma2:2b",
  "temperature": 0.7,
  "tokenLimit": 2048,
  "useWildcards": true
}

// Response
{
  "response": "...",
  "query": "...",
  "sourceType": "...",
  "searchType": "...",
  "scores": {
    "accuracy": 1-3,
    "relevance": 1-3,
    "organization": 1-3,
    "total": "weighted %"
  },
  "metrics": {
    "search": { "model": "...", "total_duration": 0, "eval_count": 0 },
    "scoring": { "model": "...", "total_duration": 0, "eval_count": 0 }
  }
}
```

**Rate limit**: 30 requests / 60s

---

## Multi-Search

### POST `/api/multi-search/multi-method`
Run multiple search methods in parallel.
```json
// Request
{ "query": "string", "methods": ["line-search", "smart-search"], "options": {} }

// Response
{
  "success": true,
  "results": {
    "line-search": { "results": [...], "count": 5, "executionTime": 0.2 },
    "smart-search": { "results": [...], "count": 3, "executionTime": 1.1 }
  },
  "summary": { "totalResults": 8, "totalTime": 1.3, "methodsUsed": 2 }
}
```

### Individual method endpoints
All accept `{ query, options }` and return method-specific results.

| Endpoint | Method |
|----------|--------|
| POST `/api/multi-search/line-search` | Line-by-line exact match |
| POST `/api/multi-search/document-search` | Indexed full-text |
| POST `/api/multi-search/document-index` | Metadata/index cards |
| POST `/api/multi-search/smart-search` | Semantic embeddings |
| POST `/api/multi-search/hybrid-search` | Keyword + semantic |
| POST `/api/multi-search/ai-direct` | Direct Ollama response |
| POST `/api/multi-search/ai-document-chat` | Ollama + document context |

### GET `/api/multi-search/methods`
Returns available search methods and descriptions.

### GET `/api/multi-search/collections`
Returns available document collections.

---

## Documents

### Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/collections/create` | Create collection — body: `{ name }` |
| GET | `/api/documents/collections/:collection/files` | List files in collection |
| DELETE | `/api/documents/collections/:collection` | Delete collection |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/collections/:collection/upload` | Upload file (FormData) |
| DELETE | `/api/documents/collections/:collection/files/:filename` | Delete file |
| GET | `/api/documents/:collection/:filename` | Serve file |
| GET | `/api/documents/view` | View document with highlighting — query: `?path=...&search=term&line=N` |

### Indexing (LanceDB embeddings)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/collections/:collection/indexed` | Get index status |
| POST | `/api/documents/collections/:collection/index/:filename` | Index a document |
| DELETE | `/api/documents/collections/:collection/index/:filename` | Remove embeddings |
| GET | `/api/documents/collections/:collection/embeddings-info` | Embedding stats |
| POST | `/api/documents/collections/:collection/search` | Search via embeddings — body: `{ query, limit }` |

### Document Index Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/multi-search/document-index-create` | Index all docs in collection |
| POST | `/api/multi-search/document-index-create-single` | Index single doc |
| POST | `/api/multi-search/document-index-status` | Get index status |
| POST | `/api/multi-search/document-index-view` | View index for a doc |
| POST | `/api/multi-search/document-index-update` | Update index comments |
| POST | `/api/multi-search/document-index-update-all` | Update all index fields |
| POST | `/api/multi-search/cleanup-meta-files` | Remove META_ files |

---

## Models

### GET `/api/models`
Returns available Ollama models (filtered and sorted).
```json
{ "models": ["qwen2:0.5b", "qwen2.5:3b", "llama3.2:3b", ...] }
```
**Rate limit**: 10 requests / 60s

---

## Database

### POST `/api/database/save`
Save search result to MySQL.
```json
// Request: full search result object with metrics
// Response
{ "success": true, "insertId": 123 }
```
**Rate limit**: 50 requests / 60s

### GET `/api/database/tests`
Get all saved test results for analysis.
**Rate limit**: 20 requests / 60s

---

## Config

### GET `/api/config/files`
List available config JSON files.

### GET `/api/config/:filename`
Get config file content. Response: `{ content: {...} }`

### PUT `/api/config/:filename`
Update config file. Body: `{ content: {...} }`

---

## Error Format

```json
{
  "error": "Error type",
  "message": "Detailed message",
  "code": "Error code (if applicable)"
}
```

---

## Rate Limits Summary

| Endpoint group | Limit |
|----------------|-------|
| Search | 30 req / 60s |
| Models | 10 req / 60s |
| Database save | 50 req / 60s |
| Database read | 20 req / 60s |

---

**Version**: 20.22 | Config files served from `/Users/Shared/AIPrivateSearch/config/`
