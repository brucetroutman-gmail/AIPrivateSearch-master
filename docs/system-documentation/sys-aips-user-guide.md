# AIPrivateSearch User Guide

**Version**: 20.22 | For end users of the AIPrivateSearch platform

---

## Getting Started

### Launch the App
- **Local Mac**: Double-click `load-aiss.command` in `/Users/Shared/`, then open http://localhost:3000
- **Remote Mac**: Open http://[host]:56305

### Login
Enter your email address on the home page. This is required for all features and result tracking.

---

## Pages Overview

| Page | Purpose |
|------|---------|
| Home | Login, app overview |
| Exact Search | Non-AI search methods (Line Search, Document Search, Document Index Cards) |
| AI Search | AI-powered search methods (Smart Search, Hybrid, AI Direct, AI Document Chat) |
| Collections | Manage document collections |
| Options | App settings and preferences |

---

## Exact Search

Best for finding specific text, phrases, names, or dates in your documents.

### Steps
1. Go to **Exact Search**
2. Select a **Collection** from the dropdown
3. Choose one or more search methods (Line Search, Document Search, Document Index Cards)
4. Enter your **query**
5. Click **Search Selected Methods**

### When to use each method

**Line Search**
- Finds exact text matches line by line
- Best for: specific phrases, names, dates, codes
- Returns: matching lines with line numbers and document links
- Always-on wildcards: `invest*` matches invest, investing, investment

**Document Search**
- Full-document ranking with relevance scoring
- Best for: topic-based searches, finding which documents cover a subject
- Returns: ranked document list with excerpts

**Document Index Cards**
- Searches AI-generated summaries and metadata for each document
- Best for: finding documents by topic when you don't know exact wording
- Requires: documents must be indexed first (see Collections)

---

## AI Search

Best for questions requiring understanding, reasoning, or synthesis across documents.

### Steps
1. Go to **AI Search**
2. Select a **Collection** (for document-based methods)
3. Select an **AI Model** (e.g. qwen2.5:3b, llama3.2:3b)
4. Choose one or more AI methods
5. Enter your **query**
6. Optionally enable **scoring** and select a score model
7. Click **Search Selected Methods**

### When to use each method

**Smart Search**
- Semantic similarity using AI embeddings
- Best for: conceptual searches, finding related content even with different wording
- Requires: documents must be embedded first (see Collections)

**Hybrid Search**
- Combines keyword matching and semantic similarity
- Best for: comprehensive coverage when you want both exact and conceptual matches

**AI Direct**
- Direct AI model response, no document context
- Best for: general knowledge questions, reasoning tasks, creative queries

**AI Document Chat**
- AI response using relevant document chunks as context (RAG)
- Best for: complex questions that need to be answered from your documents

---

## Scoring

Scoring evaluates AI response quality using a second AI model.

### Enable scoring
1. Check **Generate scores** on the AI Search page
2. Select a **Score Model** (separate from search model)
3. Run your search — scores appear with results

### Score criteria

| Criterion | Weight | What it measures |
|-----------|--------|-----------------|
| Accuracy | 3x | Factual correctness |
| Relevance | 2x | How well it answers the query |
| Organization | 1x | Clarity and structure |

Scores are 1-3. Weighted percentage = `(accuracy×3 + relevance×2 + organization×1) / 18 × 100`

---

## Reading Results

### Result cards show:
- **Excerpt**: Matching text with search terms highlighted
- **Document link**: Click to open the full document
- **View Document**: Opens document viewer with your search terms highlighted and scrolled to the match
- **Line number**: For Line Search results, links directly to the matching line

### Show all results
By default, the first 5 results are shown. Click **Show all X results** to expand.

---

## Document Collections

### View collections
Go to **Collections** to see all available document collections and their files.

### Create a collection
1. Go to **Collections**
2. Click **Create Collection**
3. Enter a name (no spaces — use hyphens, e.g. `my-documents`)
4. Upload documents (`.md`, `.txt`, `.pdf` supported)

### Index a collection (for Document Index Cards)
1. Go to **Collections**
2. Select your collection
3. Click **Create Doc Indexes**
4. Wait for indexing to complete

### Embed a collection (for Smart Search and Hybrid Search)
1. Go to **Collections**
2. Select your collection
3. Click **Embed Source MDs**
4. Wait — this takes longer as it generates vector embeddings for each document

### Supported document formats
- Markdown (`.md`) — recommended
- Plain text (`.txt`)
- PDF (`.pdf`) — converted to markdown on upload

---

## Tips

- **Start with Exact Search** for known terms, switch to AI Search for conceptual questions
- **Line Search** is the fastest method — good for quick lookups
- **AI Document Chat** gives the most thorough answers but takes the longest
- **Scoring** adds time — use it when comparing models or evaluating response quality
- **Collections** must be indexed/embedded before AI methods can use them
- Use the **document viewer** (click View Document) to see full context around a match

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No results from Smart/Hybrid Search | Collection needs to be embedded first |
| No results from Document Index Cards | Collection needs to be indexed first |
| AI methods very slow | Normal — AI processing takes 5-30s depending on model and query |
| Scores not appearing | Ensure score model is selected before searching |
| Document viewer not highlighting | Try a simpler search term, check for special characters |
