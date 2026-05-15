# AIPrivateSearch Search Methods Guide

**Version**: 20.22

---

## Overview

AIPrivateSearch provides 7 search methods split into two categories:

| Category | Methods | Page |
|----------|---------|------|
| Exact | Line Search, Document Search, Document Index Cards | Exact Search |
| AI | Smart Search, Hybrid Search, AI Direct, AI Document Chat | AI Search |

---

## Quick Selection Guide

| Your goal | Best method |
|-----------|-------------|
| Find a specific phrase or name | Line Search |
| Find which documents cover a topic | Document Search |
| Browse documents by subject | Document Index Cards |
| Find conceptually related content | Smart Search |
| Comprehensive coverage | Hybrid Search |
| General knowledge / reasoning | AI Direct |
| Answer a question from your documents | AI Document Chat |

---

## Exact Methods

### 1. Line Search

Scans documents line by line for exact text matches.

**How it works:**
- Reads each document file line by line
- Matches query terms using AND logic (all terms must appear)
- Wildcards always on: `invest*` matches invest, investing, investment
- Deduplicates adjacent matches within 4 lines
- Scores by: full word vs substring, term coverage, line density, position in file
- Max 50 results

**Best for:** specific phrases, names, dates, codes, IDs

**Returns:** matching lines with line numbers, document links, highlighted terms

**Speed:** very fast (file I/O only)

**Example queries:**
- `George Washington` — finds lines containing both words
- `constitu*` — finds constitution, constitutional, constitutionally
- `article section` — finds lines with both words

---

### 2. Document Search

Full-document ranking with relevance scoring and stemming.

**How it works:**
- Indexes all documents in the collection
- Scores documents by term frequency and relevance
- Returns ranked document list with excerpts
- Supports fuzzy matching

**Best for:** topic-based searches, finding which documents are most relevant to a subject

**Returns:** ranked documents with relevance scores and excerpts

**Speed:** fast

**Example queries:**
- `taxation without representation`
- `executive branch powers`
- `freedom of speech`

---

### 3. Document Index Cards

Searches AI-generated summaries and metadata for each document.

**How it works:**
- Each document has an index card: title, summary, key topics, keywords
- Index cards created by AI during indexing process
- Search matches against the index card content
- Much faster than full-text search for topic discovery

**Requires:** collection must be indexed (Collections → Create Doc Indexes)

**Best for:** finding documents by topic when you don't know exact wording, browsing a collection

**Returns:** matching document cards with summaries

**Speed:** very fast (searches metadata, not full documents)

**Example queries:**
- `military defense`
- `voting rights`
- `trade commerce`

---

## AI Methods

All AI methods require an Ollama model to be selected. Processing time varies by model size.

### 4. Smart Search

Semantic similarity search using vector embeddings.

**How it works:**
- Documents pre-processed into vector embeddings stored in LanceDB
- Query converted to embedding at search time
- Cosine similarity used to find closest matching chunks
- Returns most semantically similar document chunks

**Requires:** collection must be embedded (Collections → Embed Source MDs)

**Best for:** conceptual searches, finding related content even with different wording

**Returns:** document chunks ranked by semantic similarity

**Speed:** medium (embedding lookup + similarity calculation)

**Example queries:**
- `how did early Americans govern themselves` — finds relevant content even without those exact words
- `rights of citizens` — finds content about civil liberties, freedoms, protections

---

### 5. Hybrid Search

Combines keyword matching and semantic similarity.

**How it works:**
- Runs both keyword (BM25-style) and semantic (embedding) search
- Merges and reranks results using weighted scoring
- Balances exact term matching with conceptual relevance

**Requires:** collection must be embedded

**Best for:** comprehensive coverage, when you want both exact and conceptual matches

**Returns:** merged results from both methods, reranked

**Speed:** medium (runs both methods)

---

### 6. AI Direct

Direct AI model response with no document context.

**How it works:**
- Query sent directly to Ollama model
- Model responds from its training knowledge only
- No document retrieval

**Best for:** general knowledge questions, reasoning tasks, creative queries, questions not tied to your documents

**Returns:** AI-generated response with token and timing metrics

**Speed:** slow (AI inference, 5-30s depending on model)

**Model recommendations:**
- Fast answers: `qwen2:0.5b`, `qwen2.5:3b`
- Better quality: `llama3.2:3b`, `mistral:7b`, `gemma2:9b`

---

### 7. AI Document Chat

AI response using relevant document chunks as context (RAG — Retrieval Augmented Generation).

**How it works:**
1. Query converted to embedding
2. Most relevant document chunks retrieved from LanceDB
3. Chunks provided as context to Ollama model
4. Model generates response grounded in your documents

**Requires:** collection must be embedded

**Best for:** complex questions that need to be answered from your specific documents, synthesis across multiple documents

**Returns:** AI response with source document references

**Speed:** slowest (embedding lookup + AI inference)

**Example queries:**
- `What were the main arguments for a strong federal government?`
- `How did the Articles of Confederation differ from the Constitution?`
- `What rights were guaranteed to citizens?`

---

## Performance Comparison

| Method | Speed | Requires Setup | Uses AI Model | Best Result Type |
|--------|-------|---------------|---------------|-----------------|
| Line Search | ⚡⚡⚡ | None | No | Exact lines |
| Document Search | ⚡⚡⚡ | None | No | Ranked docs |
| Document Index Cards | ⚡⚡⚡ | Index | No | Doc summaries |
| Smart Search | ⚡⚡ | Embed | No | Similar chunks |
| Hybrid Search | ⚡⚡ | Embed | No | Mixed results |
| AI Direct | ⚡ | None | Yes | AI response |
| AI Document Chat | ⚡ | Embed | Yes | Grounded AI response |

---

## Collection Setup Requirements

| Method | Needs Index | Needs Embed |
|--------|-------------|-------------|
| Line Search | No | No |
| Document Search | No | No |
| Document Index Cards | Yes | No |
| Smart Search | No | Yes |
| Hybrid Search | No | Yes |
| AI Direct | No | No |
| AI Document Chat | No | Yes |

**Index** = Collections → Create Doc Indexes (fast, AI-generated summaries)
**Embed** = Collections → Embed Source MDs (slower, generates vector embeddings)
