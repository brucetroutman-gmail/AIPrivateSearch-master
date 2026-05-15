# AIPrivateSearch Collections Guide

**Version**: 20.22

---

## What is a Collection?

A collection is a folder of documents that AIPrivateSearch can search. Each collection lives in:
```
/Users/Shared/AIPrivateSearch/sources/local-documents/[collection-name]/
```

Collections are the foundation of all document search. You must have at least one collection to use document-based search methods.

---

## Built-in Collections

| Collection | Contents |
|------------|----------|
| USA-History | US historical documents (Declaration of Independence, Constitution, Articles of Confederation) |
| Federalist-Papers | The Federalist Papers |
| Family-Documents | Sample personal documents |
| My-Literature | Literary works |

---

## Creating a Collection

### Via the UI
1. Go to **Collections**
2. Click **Create Collection**
3. Enter a name — use hyphens, no spaces (e.g. `my-documents`, `legal-contracts`)
4. Click **Create**

### Via filesystem
Create a folder directly:
```bash
mkdir /Users/Shared/AIPrivateSearch/sources/local-documents/my-collection
```

---

## Adding Documents

### Upload via UI
1. Go to **Collections**
2. Select your collection
3. Click **Upload Document**
4. Select file(s) — `.md`, `.txt`, or `.pdf`

### Copy directly
Place files in the collection folder:
```bash
cp my-document.md /Users/Shared/AIPrivateSearch/sources/local-documents/my-collection/
```

### Supported formats
| Format | Notes |
|--------|-------|
| `.md` | Recommended — native format, best search results |
| `.txt` | Plain text, works well |
| `.pdf` | Converted to markdown on upload |

---

## Collection Setup for Search Methods

Different search methods require different setup steps. Do these in order:

### Step 1: Upload documents
Required for all methods. No additional setup needed for Line Search and Document Search.

### Step 2: Create Doc Indexes (for Document Index Cards)
Generates AI-powered summary cards for each document.

1. Go to **Collections**
2. Select your collection
3. Click **Create Doc Indexes**
4. Wait for completion — progress shown per document

What gets created per document:
- Title
- Summary (2-3 sentences)
- Key topics
- Keywords
- Document type

### Step 3: Embed Documents (for Smart Search, Hybrid Search, AI Document Chat)
Generates vector embeddings for semantic search.

1. Go to **Collections**
2. Select your collection
3. Click **Embed Source MDs**
4. Wait — this is the slowest step (30s–several minutes depending on collection size)

What happens:
- Each document split into chunks (~500 chars with overlap)
- Each chunk converted to a vector embedding
- Embeddings stored in LanceDB

---

## Managing Collections

### View collection status
Collections page shows for each document:
- File size
- Index status (indexed / not indexed)
- Embedding status (embedded / not embedded)

### Re-index a document
If you update a document, re-index it:
1. Collections → select collection
2. Find the document
3. Click **Re-index** or **Re-embed**

### Delete a document
1. Collections → select collection
2. Find the document
3. Click **Delete**
4. Re-index/re-embed the collection if needed

### Delete a collection
1. Collections → select collection
2. Click **Delete Collection**
3. Confirm — this removes all documents and embeddings

---

## Document Index Cards — Editing

Index cards can be manually edited to improve search accuracy.

1. Go to **Collections**
2. Select collection → select document → **View Index**
3. Edit: title, summary, topics, keywords, comments
4. Click **Save**

This is useful when the AI-generated summary missed important content.

---

## Best Practices

- **Use markdown** — `.md` files give the best search results across all methods
- **One topic per collection** — keeps search results focused and relevant
- **Descriptive filenames** — filenames appear in results, make them meaningful
- **Re-embed after updates** — if you edit a document, re-embed to keep semantic search current
- **Index card comments** — use the comments field to add context the AI missed
- **Collection names** — keep them short and descriptive, hyphens only (e.g. `hr-policies`, `client-contracts`)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Document Index Cards returns no results | Run Create Doc Indexes for the collection |
| Smart/Hybrid Search returns no results | Run Embed Source MDs for the collection |
| PDF not uploading | Check file isn't password-protected |
| Index seems outdated | Re-run Create Doc Indexes after document changes |
| Embeddings seem wrong | Re-run Embed Source MDs after document changes |
| Collection not appearing in dropdown | Check folder exists in `sources/local-documents/` |
