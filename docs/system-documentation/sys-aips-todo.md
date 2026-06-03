# AIPrivateSearch ToDo

**Version**: 20.50 | Active task tracking

---

## IMMEDIATE PRIORITY

### I-001 — Fix ScoringService Path Bug ✅ v20.51
`ScoringService.mjs` uses a hardcoded relative path to load `score-settings` config:
```
path.join(process.cwd(), '..', '..', 'client', 'c01_client-first-app', 'config', 'score-settings')
```
This resolves to `/Users/Shared/AIPrivateSearch/client/...` which does not exist.
Should use `AppConfig.getConfigLocation()` like all other services.
- [x] Fix path in `ScoringService.mjs` to use `AppConfig.getConfigLocation()`
- [x] Verify server starts cleanly with `node server/s01_server-first-app/server.mjs`

### I-002 — User Feedback (Thumbs Up/Down) ✅ v20.52
Cannot measure 80% good response goal without feedback data.
- [x] Add thumbs up/down buttons to AI Document Chat response in UI
- [x] Log feedback to `logs/search-evaluations.jsonl` — include query, collection, model, parameters, rating
- [x] Add feedback endpoint `POST /api/search-feedback`
- [x] Show feedback confirmation to user

### I-003 — Release Uncommitted Changes ✅ v20.52
Current repo has AIDocumentChat exhaustive query fix and fetch timeout fix not yet released.
- [x] Sync installed app → repo (release command)
- [x] Commit and push v20.53

---

## ACTIVE DEVELOPMENT

### A-001 — Embedding-Based Query Type Detection
Replace keyword-based exhaustive query detection with embedding similarity against prototype queries.
Query types: `fact` | `analysis` | `creative` | `general`
Each type adjusts temperature, topK, contextSize automatically.
- [ ] Implement prototype embedding cache (4 examples per type)
- [ ] Detect query type on each AI Document Chat search
- [ ] Apply modifiers to parameters before search
- [ ] Test across Medical-Practice, Law-Office, Federalist-Papers, My-Emails
- [ ] Compare results to baseline

### A-002 — Test Query Set + Baseline Measurement
Required before BM25/reranking experiment.
- [ ] Define 15 diverse queries across 4 collections (fact, list, analysis, ambiguous)
- [ ] Document expected answers for each query
- [ ] Run all queries with current system, rate responses (good/bad)
- [ ] Record baseline score (e.g. 9/15 = 60%)

### A-003 — BM25 + LLM Reranking Experiment
Validate whether these improve results — implement, test against baseline, keep or discard based on data.
- [ ] Implement BM25 as parallel retrieval path alongside cosine similarity
- [ ] Merge BM25 + cosine results before PRF expansion
- [ ] Run test query set, compare to baseline
- [ ] Implement LLM reranking as optional post-retrieval step
- [ ] Run test query set with reranking, compare to baseline
- [ ] Decision: keep or discard each based on data

### A-004 — Mixed Collection Profile
Current system only detects `structured` vs `long prose`. Add `mixed` profile for collections like Law-Office (short chunks, analytical answers needed).
- [ ] Add `mixed` profile to search-settings calculation
- [ ] Adjust temperature and tokenLimit for mixed profile
- [ ] Re-run Process Source Files on Law-Office, Family-Documents
- [ ] Verify improved settings

### A-005 — Improved topK Formula
Replace linear formula with logarithmic for better large-collection coverage.
```
Current:  min(30, max(10, ceil(n * 0.05)))
Proposed: min(45, max(10, ceil(n * 0.042 + log2(n+1) * 2.2)))
```
- [ ] Update search-settings endpoint formula
- [ ] Re-run Process Source Files on all collections
- [ ] Verify My-Literature topK increases from 30 to ~45

### A-006 — Medical-Practice Fabric Pattern
Current auto-generated pattern lacks medical synonyms. Update manually with cancer/sarcoma/tumor/diabetes vocabulary.
- [ ] Update `fabric-pattern.md` for Sample_Medical-Practice
- [ ] Update `fabric-pattern.md` for Sample_Medical-Practice-II
- [ ] Test cancer and diabetes queries after update

### A-007 — Breadcrumb Logging Fixes
- [ ] Verify `search_submitted` crumb appears after search on AI Search page
- [ ] Verify `search_submitted` crumb appears after search on Search page
- [ ] Verify `page_load` crumbs appear for each page visited
- [ ] Test full trail: login → search → exact search → logout
- [ ] Verify error crumbs trigger POST to `/api/breadcrumbs/report`

---

## SEARCH & AI QUALITY

### Q-001 — AI Document Chat: P001 and P007 Missing from Cancer Query
P001 (Osteosarcoma) and P007 (Ewing sarcoma) not appearing in top chunks for cancer query.
Low cosine similarity to "cancer" query despite being cancer patients.
- [ ] Investigate why P001/P007 rank below topK threshold
- [ ] Consider if fabric pattern vocabulary injection helps
- [ ] Test after embedding-based query type detection (A-001) is implemented

### Q-002 — Exhaustive Query Detection Refinement
Current keyword pattern (`find`, `show`, `list`, `all`, etc.) is too broad — matches almost every query.
PRF expansion then matches all 25 chunks in Medical-Practice, sending 17 to model.
- [ ] Narrow exhaustive detection to only trigger when keyword-filtered > topK
- [ ] Consider minimum confidence threshold before expanding chunk limit
- [ ] Test that normal queries still respect topK

### Q-003 — Mistral 7b Timeout
Mistral 7b times out even with 5-minute timeout on 17-chunk prompts.
- [ ] Investigate if issue is model loading time vs. inference time
- [ ] Consider streaming response instead of `stream: false`
- [ ] Test with smaller prompt (topK=5) to isolate loading vs. inference

### Q-004 — Embedding Fails for Large Documents
Error: `Ollama embedding error: 500 - input length exceeds context length`
Affects large documents that exceed nomic-embed-text's 2048 token context.
- [ ] Detect oversized chunks before embedding
- [ ] Split oversized chunks further before embedding
- [ ] Show clear user-facing error instead of silent failure

---

## COLLECTIONS & DATA

### C-001 — Medical-Practice-II: Add to Search Settings
Medical-Practice-II has 6 docs, 21 chunks. Process Source Files generates settings correctly.
- [ ] Verify all 5 JSON files convert and embed correctly
- [ ] Test normalized data queries across patient_info + patient_medical_histories + medications

### C-002 — Sample_ Collections: Re-run Process Source Files
After collection name fix (name field now matches folder name), all collections need settings regenerated.
- [ ] Re-run Process Source Files on all 11 Sample_ collections
- [ ] Verify View Manifest shows correct name and searchSettings for each

### C-003 — DocType-Test Collection
Verify all 19 document types convert and embed correctly.
- [ ] Test each file type converts without error
- [ ] Verify embeddings created for all 19 files

---

## SYSTEM & INFRASTRUCTURE

### S-001 — Architectural Rule: Ollama Calls Through SearchOrchestrator
All AI model interactions must go through SearchOrchestrator → search method classes.
No route or client should call `http://localhost:11434/api/generate` directly.
- [ ] Audit all routes and client files for direct Ollama calls
- [ ] Add code comment to `SearchOrchestrator.mjs` documenting this rule
- [ ] Add to `sys-aips-contributing.md`

### S-002 — Update Installer for Sample_ Collections
Update script already syncs Sample_ folders. Verify on fresh install.
- [ ] Test fresh install — confirm all 11 Sample_ folders land correctly
- [ ] Test Update — confirm Sample_ folders are replaced, user collections untouched
- [ ] Verify collection.json name fields are correct after install

### S-003 — Server Startup Reliability
Server crashes on manual start due to ScoringService path bug (see I-001).
After fix, verify clean startup in all environments.
- [ ] Test `node server/s01_server-first-app/server.mjs` from repo directory
- [ ] Test startup via aipr.app start button
- [ ] Test startup after Update on remote Mac

---

## USER EXPERIENCE

### U-001 — Search Page: Collection Dropdown Width
Collection dropdown on Search page may still truncate Sample_ names.
- [ ] Verify `Sample_Medical-Practice-II` displays fully on Search page
- [ ] Verify on AI Search page

### U-002 — AI Search: Parameter Labels
Temperature, Context, Tokens, TopK labels added in v20.49.
- [ ] Verify labels display correctly on all screen sizes
- [ ] Verify prem-only hiding works correctly for non-premium users

### U-003 — Collections Editor: View Manifest
View Manifest button added in v20.50.
- [ ] Test shows correct name, searchSettings, documents for each collection
- [ ] Test with legacy collection (no manifest) — verify graceful error

---

## ANALYTICS & MONITORING

### M-001 — Search Evaluation Logging
Log all AI Document Chat searches to `logs/search-evaluations.jsonl`.
Include: query, collection, model, parameters, chunks sent, response, latency.
Prerequisite for measuring 80% good response goal.
- [ ] Implement logging in AIDocumentChat.mjs
- [ ] Add analytics endpoint `GET /api/search-analytics`
- [ ] Add basic analytics view to Options page

---

## FUTURE / ROADMAP

- Multi-turn conversation memory for AI Document Chat
- Per-collection embedding model selection
- Visual analytics dashboard
- A/B testing interface for parameter tuning
- Mobile-responsive design
- Search history and saved searches
- Bulk document upload with progress
- Admin dashboard with usage analytics
- HIPAA compliance documentation
- Marketing website / landing page
- **LanceDB migration** — replace SQLite vector storage with LanceDB for native ANN indexing. Recommended when any collection exceeds ~5,000 chunks or search latency becomes noticeable. Requires re-embedding all collections and rewriting `UnifiedEmbeddingService`. Not a bottleneck at current collection sizes.

---

## LIGHTWEIGHT ENTITY GRAPH

For structured record collections (Medical, HR, Law), build a simple entity index during Process Source Files to enable reliable relationship queries without full GraphRAG complexity.

**Problem it solves**: "Find all patients with cancer" misses patients whose records use `sarcoma`, `tumor` etc. instead of the word "cancer". Standard RAG retrieves by similarity — guaranteed exhaustive retrieval requires traversing entity relationships.

**Approach**: During Process Source Files Step 1 (Convert), extract entities from each converted `.md` file using the already-running LLM. Store as a simple JSON index per collection — no graph database needed.

**Structure** (`entity-index.json` in collection folder):
```json
{
  "entities": [
    {
      "chunkId": "chunk_1",
      "filename": "patient_info.md",
      "entities": {
        "patient_id": "P002",
        "name": "Maria L. Gonzalez",
        "conditions": ["Type 2 diabetes", "Osteoarthritis"],
        "medications": ["Metformin", "Oxycodone"],
        "procedures": ["Hip replacement"]
      }
    }
  ]
}
```

**Query use**: When AI Document Chat detects a relationship query ("find all patients with X"), search the entity index first to guarantee all matching chunks are included, regardless of topK or embedding similarity.

**Collections that benefit most**: Medical-Practice, Medical-Practice-II, Human-Resources, Law-Office

**Collections with low benefit**: Federalist-Papers, My-Literature, USA-History (prose — no structured entities)

**Prerequisites before starting**:
- [ ] Establish baseline measurement from feedback data (I-002)
- [ ] Complete BM25 + reranking experiment (A-003)
- [ ] Implement embedding-based query type detection (A-001)

**Tasks**:
- [ ] Define entity schema per collection profile (medical / legal / HR / general)
- [ ] Add entity extraction step to Process Source Files (Step 2b — after Fabric, before Embed)
- [ ] Store `entity-index.json` in collection folder
- [ ] Add entity index lookup to AIDocumentChat for relationship queries
- [ ] Fall back to standard PRF expansion when no entity index exists
- [ ] Test: "Find all patients with cancer" — verify all 11 returned
- [ ] Test: "Which employees have CDL expiring in 30 days?" on Human-Resources
- [ ] Test: "Who are the beneficiaries in John Smith's trust?" on Law-Office
- [ ] Measure improvement vs baseline

---

## RECENTLY COMPLETED

### v20.50
- Fixed `collection.json` name field mismatch for all 10 Sample_ collections
- Added View Manifest button to Collections Editor
- Updated `aips-collection-process-source-steps.md` documentation

### v20.49
- AI Search page: labeled dropdowns for Temperature/Context/Tokens/TopK
- Collection select full width in shared styles

### v20.48
- Per-collection search settings (topK/temp/contextSize/tokenLimit) calculated and stored in collection.json
- parameterManager loads all 4 dropdowns from config JSON files
- Collection change → auto-applies searchSettings to all 4 dropdowns
- Removed No Limit token option
- Fixed model.html script load order (apiConfig.js before license-checker.js)
- Removed index card UI from all pages (backend code preserved)
- Process Source Files: all steps now awaited, no silent failures

### v20.47
- Fix collection.json name field for Sample_ prefix
- Add View Manifest button

### v20.46
- Redesigned index cards: slim 12-field schema, 10-field AI prompt with fabric vocabulary
- Removed NLP dependency from index card generation

### v20.45
- Replaced hardcoded synonym map with PRF (Pseudo-Relevance Feedback) query expansion
- Collection vocabulary drives keyword expansion automatically

### v20.44
- Update script now refreshes Sample_ collections on update
- Installer leaves user collections untouched

### v20.43
- Renamed all sample collections to Sample_ prefix
- AIDocumentChat keyword pre-filter to prevent hallucination

### v20.42
- AI Document Chat major fix: added missing `method: 'POST'` to Ollama fetch
- Removed silent fallback, removed chunk truncation
- topK increased from 3 to 10
- Header-aware chunking added
- Chunk size increased to 2000

### v20.41 and earlier
- Collection manifest system (collection.json)
- JSON conversion fixes
- Embedding improvements
- Breadcrumb logging
- Post-login redirect fix
