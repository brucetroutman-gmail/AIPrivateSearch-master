# AIPrivateSearch ToDo

**Version**: 20.22 | Active task tracking

---

## IMMEDIATE PRIORITY

### 2-005 — Test multi prompts and ASCII/Unicode characters (Remote Mac)
- [ ] Verify user prompts load on Exact Search — select "Local Model Only", confirm 5 prompts appear (KNOWLEDGE, REASON, CREATE, CODE, INSTRUCT)
- [ ] Test prompt selection fills query field
- [ ] Test collection-specific prompts — switch to "Local Documents Only", select USA-History, confirm 5 USA-specific prompts appear
- [ ] Test prompt switching between collections — change to Family-Documents, confirm prompts update
- [ ] Test prompts on AI Search page — select collection, confirm prompts filter correctly
- [ ] Test ASCII special characters: quotes (`"`), ampersand (`&`), angle brackets (`<>`), apostrophe (`'s`)
- [ ] Test Unicode: accented chars (é, ñ, ü), em-dash (—), curly quotes (""), bullet (•)
- [ ] Test query persistence with special chars — reload page, confirm query restores from localStorage
- [ ] Test prompt with special chars in results — confirm no HTML entities showing
- [ ] Test empty/no prompts state — confirm dropdown shows "Select a prompt..." without errors

---

## CORE SYSTEM

### 2-047 — Fabric Integration
**Phase 1 — Core Integration**
- [ ] Create `FabricService.mjs` in `lib/services/` — enhance prompt, pattern check, SSE, 8-10s timeout, 1-2 retries, circuit breaker
- [ ] Create `fabric.mjs` route in `routes/` — rate limiting, query sanitization
- [ ] Register fabric route in `server.mjs`
- [ ] Add `FABRIC_URL` and `FABRIC_API_KEY` to `.env-aips`
- [ ] Add `fabricEnabled` toggle to `app.json`
- [ ] Add "Enhance" button to AI Search with spinner and cancel
- [ ] Implement graceful degradation — fallback to `addMetaPrompt` with toast if Fabric unreachable
- [ ] Test: USA-History query, sensitive collection, offline mode, malformed collection name

**Phase 1b — Auto Pattern Generation on Process Source Files**
- [ ] Create `generatePattern.mjs` in `server/scripts/` — aggregates all index cards for collection, builds sanitized domain pattern, uploads to Fabric (fire-and-forget)
- [ ] Trigger at end of Step 2 (Create Doc Index Cards) in `processSourceFiles()` in `collections-editor.html`
- [ ] Pattern content: aggregate document_type, topics, keywords across all cards — no PII, no filenames, no summaries
- [ ] Test: Run Process Source Files on USA-History, confirm `enhance_USA-History` appears on Fabric server

**Phase 2 — Pattern Management**
- [ ] Create `safeDomainContext.json` in config — sanitized domain templates per collection type
- [ ] Create `generatePattern.mjs` in scripts — uses `safeDomainContext.json`, no PII
- [ ] Add pattern generation trigger to `POST /collections/create`
- [ ] Add pattern generation trigger to `POST /collections/:collection/upload`
- [ ] Add pattern generation trigger to `DELETE /collections/:collection/files/:filename`
- [ ] Add pattern generation trigger to `POST /document-index-create`
- [ ] Add "Generate Pattern" button to `collections.html`
- [ ] Test: Generate pattern for USA-History, verify in Fabric, run Enhance

**Phase 3 — Polish**
- [ ] Add local pattern existence cache with last-checked timestamp
- [ ] Add enhance level selector (Concise / Balanced / Thorough)
- [ ] Show before/after diff of enhanced prompt
- [ ] Add auto-enhance toggle per collection (with warning for sensitive collections)
- [ ] Test: Disable Fabric, confirm fallback toast shown and search completes normally

### 2-048 — Embedding fails when document exceeds model context length
Error: `Ollama embedding error: 500 - {"error":"the input length exceeds the context length"}`
Occurs during embedding of large documents:
- `patient_appointments_calendar.md` (Family-Documents collection)
- `gospel-john.md` (My-Literature collection)
Options:
- [ ] Detect oversized documents before embedding and split into smaller chunks
- [ ] Show a clear user-facing error message instead of silent failure
- [ ] Log which files failed so user knows what to re-try


Currently returns both matches and non-matches.

### 2-049 — One-time: Clean up any enhance_ patterns on Fabric server
New approach stores patterns locally in `sources/local-documents/[collection]/fabric-pattern.md`.
- [ ] Run: `curl https://fabric.formr.net/patterns/names | grep enhance_`
- [ ] Delete any found with: `curl -X DELETE https://fabric.formr.net/patterns/enhance_[name] -H "Authorization: Bearer [key]"`
- **Status**: Checked May 2025 — no enhance_ patterns found, nothing to clean up ✅

### 2-007 — Consistent View Document across all search types
Make Response matches and View Document consistent. Add View Index Card to Doc Index Cards response.

### 2-008 — TestCodes for DocumentSearch performance optimization

### 2-009 — Review chunking strategy
Many documents are only 2 chunks. Analyze chunk size for small and large documents. Evaluate pros/cons of changing chunk sizes.

### 2-010 — Enhance database saving to add documents only

### 2-045 — RAG upgrade Level 2 → Level 4
- [ ] Cross-encoder reranking (priority — biggest accuracy gain, ~68% → ~89% correct chunk in top 3)
- [ ] Hybrid search: semantic + BM25 keyword matching with alpha tuning
- [ ] Confidence scoring for production reliability

---

## USER EXPERIENCE

- 2-011 — Create comprehensive quick start video
- 2-012 — Display and layout improvements
- 2-013 — Mobile-responsive design
- 2-014 — Keyboard shortcuts for power users
- 2-015 — User onboarding tutorial/wizard
- 2-016 — Search history and saved searches
- 2-017 — Bulk document upload with progress indicators
- 2-018 — Document preview without full download

---

## SEARCH & AI ENHANCEMENTS

- 2-019 — User and system prompts by source type
- 2-020 — User prompts by source type, collection, and search type
- 2-021 — 3 prompts per sourcetype/collection/searchtype stored in JSON configs
- 2-022 — Search performance optimization and caching

---

## ANALYTICS & MONITORING

- 2-024 — Admin dashboard with usage analytics
- 2-025 — Privacy-compliant usage telemetry
- 2-026 — Search result export (PDF/CSV)
- 2-027 — Backup/restore for user data and collections

---

## BUSINESS & DEPLOYMENT

- 2-028 — Marketing website/landing page
- 2-029 — Professional product screenshots and demo videos
- 2-030 — Pricing strategy and subscription management
- 2-031 — Installer packages for easy deployment
- 2-032 — License key management system
- 2-033 — Customer support system and documentation

---

## COMPLIANCE & LEGAL

- 2-037 — HIPAA compliance documentation and certification
- 2-038 — Competitive analysis and positioning
- 2-039 — Partner program for resellers (medical/legal)
- 2-040 — Case studies for medical practices and law firms

---

## RECENTLY COMPLETED

### v20.22
- Unified footer — index.html now uses shared footer.html, removed Team members section
- Added app-version span to custmgr and web footers
- Added .env-aips to .gitignore
- Created sys-aips-* documentation suite (changelog, architecture, api, deployment, user-guide, security, search-methods, collections, executive-summary, scoring, troubleshooting, roadmap, todo)
- Renamed all system docs to lowercase aips- prefix

### v20.21
- Fixed menu — reverted to inline style display approach
- Updated nav links to exact-search.html and ai-search.html
- Added dual CSS classes (menu-search + menu-exact-search) to nav elements

### v20.20
- Added Exact Search page (exact-search.html) — Non-AI methods only
- Added AI Search page (ai-search.html) — AI methods only
- Updated multi-mode-search.js to detect page mode by filename
- Updated header.html with new menu links
- Fabric+Ollama pipeline tested and working (test-fabric.mjs)

### v20.19
- Enhanced Fabric integration plan: PII safety, safeDomainContext.json, pattern versioning, circuit breaker, graceful degradation

### v20.18
- Fabric server installed on formr (systemd, port 8081, fabric.formr.net)
- Line Search: deduplication, AND default, max 50 results cap
- Version number added to app footer

### v20.17
- Line Search deduplication (merge adjacent matches within 4 lines)
- QueryProcessor default changed OR → AND
- Max 50 results cap with score sorting

### v20.16
- Unified document viewer highlighting (?search= param)
- Always-on wildcard matching (removed checkbox UI)
- Show first 5 results with "Show all X" expandable link
- Fixed search page rendering to match multi-mode path
- Document Index Cards excerpt highlighting fix
- Added update-aips.sh for remote Mac deployment

### v20.15
- Fixed device registration (removed dead create-license call)
- 2-004 multi-search test plan: 14/14 steps passed
