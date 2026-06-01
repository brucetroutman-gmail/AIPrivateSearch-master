# Process Source Files — Step-by-Step Reference

## Overview

**Process Source Files** is the main collection preparation workflow. It converts raw source documents into a fully search-ready collection. It is triggered from the Collections Editor by selecting one or more source files and clicking **Process Source Files**.

The workflow runs 4 sequential steps — all awaited, none fire-and-forget.

---

## Pre-conditions

- A collection must exist with a valid `collection.json` manifest
- The `collection.json` `name` field must match the folder name exactly
- At least one source file must be selected in the document table
- The server must be running with Ollama available for embedding and Fabric pattern generation

---

## Step 1 — Convert Documents

**API**: `POST /api/documents/convert-selected`

Converts each selected source file to Markdown (`.md`). Supported source formats:

| Format | Conversion |
|--------|-----------|
| `.txt` | Wrapped in Markdown |
| `.json` | Grouped by ID field, each group as a paragraph block |
| `.csv` / `.tsv` | Rows converted to Markdown tables or paragraph blocks |
| `.pdf` | Text extracted and wrapped in Markdown |
| `.eml` | Email headers and body extracted to structured Markdown |
| `.md` | Used as-is (no conversion needed) |
| `.yaml` / `.xml` / `.html` / `.sql` / `.py` / `.js` / `.java` / `.cpp` / `.c` / `.h` / `.css` / `.tex` / `.htm` | Wrapped in fenced code blocks |

**Output**: One `.md` file per source file, saved in the collection folder.

**On failure**: Processing stops. Errors are shown in the processing log.

**Manifest update**: `collection.json` is updated with `convertedFile` for each document.

---

## Step 2 — Generate Fabric Pattern

**API**: `POST /api/fabric/generate-pattern`

Awaited — processing waits for completion before moving to Step 3.

Analyzes all converted `.md` files in the collection and generates a `fabric-pattern.md` file containing:
- Collection description
- Document count
- Key domain vocabulary (top 25 terms extracted from content by frequency)
- Query enhancement instructions for the AI

**Output**: `fabric-pattern.md` saved in the collection folder.

**Used by**:
- AI Document Chat — injects domain vocabulary into the prompt as context
- Smart Search / Hybrid Search — query enhancement

**On failure**: Warning logged in processing log, processing continues to Step 3.

---

## Step 3 — Embed Converted Files

**API**: `DELETE /api/documents/collections/:collection/embeddings` (wipe first)
**API**: `POST /api/documents/collections/:collection/index/:filename` (per file)

### 3a — Wipe existing embeddings

Deletes `embeddings.db` before batch embedding to ensure no stale chunks remain. This guarantees a clean rebuild every time Process Source Files is run.

### 3b — Embed each file

For each converted `.md` file:

1. Reads the `.md` content
2. Runs **semantic chunking** (see Chunking Strategy below)
3. Creates an embedding vector for each chunk using `nomic-embed-text` via Ollama
4. Stores chunks + vectors in `embeddings.db` (SQLite)

**Output**: `embeddings.db` in the collection folder containing all chunk embeddings.

**Used by**: Smart Search, Hybrid Search, AI Document Chat

---

## Step 4 — Calculate Search Settings

**API**: `POST /api/documents/collections/:collection/search-settings`

Awaited — runs after embedding completes, result shown in processing log.

Calculates optimal AI search parameters based on chunk statistics:

```
topK        = min(30, max(10, ceil(totalChunks * 0.05)))
temperature = 0.1 (structured/short docs) | 0.3 (long prose)
contextSize = next power of 2 of (topK × avgChunkSize / 4 + 1024), capped at 32768
tokenLimit  = 1024 (default) | 2048 (long prose)
```

**Collection profile detection:**
- **Short docs** — avgChunkSize < 600 or ≤ 1.5 chunks/doc → temp=0.1, tokens=1024
- **Long prose** — avgChunkSize > 1500 and > 10 chunks/doc → temp=0.3, tokens=2048
- **Structured records** — everything else → temp=0.1, tokens=1024

**Examples**:
| Collection | Chunks | topK | temp | ctx | tokens |
|---|---|---|---|---|---|
| Sample_My-Emails | 500 | 25 | 0.1 | 4096 | 1024 |
| Sample_Federalist-Papers | 658 | 30 | 0.3 | 16384 | 2048 |
| Sample_My-Literature | 1366 | 30 | 0.3 | 16384 | 2048 |
| Sample_Medical-Practice | 25 | 10 | 0.1 | 8192 | 1024 |
| Sample_Human-Resources | 46 | 10 | 0.1 | 8192 | 1024 |

**Output**: `searchSettings` object written to `collection.json`:
```json
"searchSettings": {
  "topK": 10,
  "temperature": 0.1,
  "contextSize": 8192,
  "tokenLimit": 1024,
  "totalChunks": 25,
  "totalDocs": 1,
  "avgChunkSize": 1422,
  "generatedAt": "2026-01-01T00:00:00.000Z"
}
```

**Used by**: AI Search page and Search page — `searchManager.js` reads all 4 settings from the manifest when a collection is selected, using them as defaults. User can override in the UI.

**Important**: The `collection.json` `name` field must match the folder name or settings will not be saved correctly.

---

## Chunking Strategy

Chunking is performed by `UnifiedEmbeddingService.semanticChunking()` with `chunkSize=2000`, `overlap=150`.

### Header-aware chunking (primary)
Used when the document contains 2 or more `##` Markdown headers.

- Splits on `##` header boundaries
- Accumulates sections up to `chunkSize`
- If a single section exceeds `chunkSize`, it is further split by `splitLargeParagraph()`
- No overlap — headers are clean semantic boundaries
- Best for: JSON-converted records (Medical, HR, Law), structured documents

### Paragraph chunking (fallback)
Used when no `##` headers are present.

- Splits on blank lines (`\n\n`)
- Accumulates paragraphs up to `chunkSize` with `overlap` carry-forward
- Large paragraphs are split by sentences, then by fixed size if needed
- Best for: prose documents (Literature, USA-History, Federalist Papers)

### Chunk size rationale
- `chunkSize=2000` chars ≈ 400-500 tokens — fits within `nomic-embed-text`'s 2048 token context
- Medical-Practice patient records average ~1422 chars — one patient per chunk
- Federalist Papers sections average ~1754 chars — one section per chunk

---

## Output Files per Collection

After a successful Process Source Files run, the collection folder contains:

| File | Created by | Used by |
|------|-----------|---------| 
| `*.md` | Step 1 | All search methods |
| `fabric-pattern.md` | Step 2 | AI Document Chat, Smart Search |
| `embeddings.db` | Step 3 | Smart Search, Hybrid Search, AI Document Chat |
| `collection.json` (updated) | Step 4 | AI Search, Search page (all 4 settings) |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Conversion fails | Processing stops, error shown in log |
| Fabric generation fails | Warning logged, processing continues |
| Single file embed fails | Error logged, next file continues |
| Search settings fails | Warning logged, settings not saved — defaults used |

---

## Re-running Process Source Files

Safe to re-run at any time:
- Step 1 overwrites existing `.md` files
- Step 3 wipes `embeddings.db` before rebuilding — no stale data
- Steps 2 and 4 regenerate `fabric-pattern.md` and `searchSettings` fresh

**Note**: Re-running is required after any source file changes, or after chunking/embedding code updates.

---

## collection.json Name Field

The `name` field in `collection.json` must exactly match the folder name. A mismatch causes `searchSettings` to be written incorrectly and the collection to behave unexpectedly.

**Correct**: folder = `Sample_Medical-Practice`, name = `Sample_Medical-Practice`  
**Wrong**: folder = `Sample_Medical-Practice`, name = `Medical-Practice`

Use the **View Manifest** button in Collections Editor to quickly verify.

---

*Last updated: v20.50*
