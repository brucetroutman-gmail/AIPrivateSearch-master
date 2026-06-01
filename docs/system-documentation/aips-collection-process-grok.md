✅ Here is the refined and final documentation with exact current file names, structure, and all features we've built.

Markdown# Process Source Files & Advanced Adaptive AI Search System — Complete Reference

**Version**: v21.00  
**Last Updated**: June 2026

## System Overview

This system provides a complete pipeline for turning raw documents into intelligent, self-optimizing RAG collections with advanced AI search capabilities.

### Key Features
- Collection profile detection (structured / narrative / mixed)
- Embedding-based query type detection (`fact`, `analysis`, `creative`)
- Hybrid Vector + BM25 retrieval
- LLM reranking
- Real-time LLM-as-Judge evaluation
- Structured logging + analytics
- Automatic parameter optimization
- User feedback loop
- Smart Search with Fabric pattern enhancement

---

## File Structure
services/
├── search/
│   ├── AdaptiveSearchParameters.js     # Adaptive params + embedding query detection
│   ├── SearchExecutor.js               # Main search pipeline (hybrid, rerank, eval)
│   ├── ParameterOptimizer.js           # Auto-optimization from logs & feedback
│   └── index.js                        # Barrel export
├── db/
│   └── embeddings.js                   # embeddings.db helpers
└── analytics/
└── SearchAnalytics.js              # (Optional) Advanced stats
routes/
├── search.js                           # /search, /smart-search, /search-feedback
├── analytics.js                        # /search-analytics
├── collections.js
└── feedback.js
logs/
└── search-evaluations.jsonl            # Auto-generated log file
text---

## Process Source Files Workflow

### Step 4 — Calculate Search Settings (Enhanced)

**API**: `POST /api/documents/collections/:collection/search-settings`

Uses `AdaptiveSearchParameters.calculate()` to generate intelligent defaults.

**Output in `collection.json`**:

```json
{
  "name": "Sample_Medical-Practice",
  "searchSettings": {
    "topK": 22,
    "temperature": 0.14,
    "contextSize": 12288,
    "tokenLimit": 1536,
    "profile": "structured",
    "totalChunks": 28,
    "avgChunkSize": 1422,
    "adaptiveEnabled": true,
    "autoOptimized": true,
    "lastOptimized": "2026-06-01T11:00:00.000Z"
  }
}

Core Modules
1. AdaptiveSearchParameters.js

Collection profile detection
Embedding-based query type detection (with prototype caching)
Adaptive topK, temperature, contextSize calculation

2. SearchExecutor.js
Main search methods:

executeSearch(query, collectionName, overrides?)
smartSearch(query, collectionName, overrides?)

Pipeline:

Adaptive parameter calculation
Hybrid retrieval (Vector + BM25)
LLM reranking
Context building
Response generation
LLM-as-Judge evaluation
Structured logging

3. ParameterOptimizer.js

Analyzes logs and user feedback
Auto-suggests and applies better parameters
Runs periodically or on negative feedback

API Endpoints

Method,Route,Description
POST,/api/search,Standard adaptive search
POST,/api/smart-search,Fabric-enhanced smart search
POST,/api/search-feedback,Submit thumbs up/down + comment
GET,/api/search-analytics,Dashboard statistics
POST,/api/collections/:collection/search-settings,Regenerate settings

Usage Examples

Basic Search:
JavaScriptconst result = await SearchExecutor.executeSearch("What is patient ID 1234?", "Medical-Practice");
Smart Search:
JavaScriptconst result = await SearchExecutor.smartSearch("Summarize treatment options", "Medical-Practice");
Send Feedback:
JavaScriptawait fetch('/api/search-feedback', {
  method: 'POST',
  body: JSON.stringify({
    feedbackToken: result.feedbackToken,
    rating: 1,           // 1 = positive, 0 = negative
    comment: "Very accurate"
  })
});

Logging & Analytics

All searches are logged to logs/search-evaluations.jsonl
Includes: query, parameters, evaluation scores, latency, feedback
Analytics available via /api/search-analytics?days=30


Re-running Process Source Files
Safe to re-run anytime. Recommended after:

Adding/removing source documents
Changing chunking logic
Updating embedding models


Best Practices

Ensure collection.json name exactly matches folder name
Keep Ollama running with nomic-embed-text and llama3.2 (or better)
Monitor logs/search-evaluations.jsonl for quality trends
Allow the system to collect feedback for auto-optimization
Use smart-search for domain-specific queries


Future Enhancements (Roadmap)

Multi-turn conversation memory
Per-collection embedding model selection
Visual analytics dashboard UI
A/B testing interface

This documentation reflects the complete system as of v21.00
text


































MethodRouteDescriptionPOST/api/searchStandard adaptive searchPOST/api/smart-searchFabric-enhanced smart searchPOST/api/search-feedbackSubmit thumbs up/down + commentGET/api/search-analyticsDashboard statisticsPOST/api/collections/:collection/search-settingsRegenerate settings

Usage Examples
Basic Search:
JavaScriptconst result = await SearchExecutor.executeSearch("What is patient ID 1234?", "Medical-Practice");
Smart Search:
JavaScriptconst result = await SearchExecutor.smartSearch("Summarize treatment options", "Medical-Practice");
Send Feedback:
JavaScriptawait fetch('/api/search-feedback', {
  method: 'POST',
  body: JSON.stringify({
    feedbackToken: result.feedbackToken,
    rating: 1,           // 1 = positive, 0 = negative
    comment: "Very accurate"
  })
});

Logging & Analytics

All searches are logged to logs/search-evaluations.jsonl
Includes: query, parameters, evaluation scores, latency, feedback
Analytics available via /api/search-analytics?days=30


Re-running Process Source Files
Safe to re-run anytime. Recommended after:

Adding/removing source documents
Changing chunking logic
Updating embedding models


Best Practices

Ensure collection.json name exactly matches folder name
Keep Ollama running with nomic-embed-text and llama3.2 (or better)
Monitor logs/search-evaluations.jsonl for quality trends
Allow the system to collect feedback for auto-optimization
Use smart-search for domain-specific queries


Future Enhancements (Roadmap)

Multi-turn conversation memory
Per-collection embedding model selection
Visual analytics dashboard UI
A/B testing interface

This documentation reflects the complete system as of v21.00
text---

This version is now fully aligned with all the code files provided.

Would you like me to:
- Provide the `services/search/index.js` barrel file?
- Create a **setup & integration guide**?
- Or generate a **React component** for the search interface + feedback?

Let me know how to proceed!