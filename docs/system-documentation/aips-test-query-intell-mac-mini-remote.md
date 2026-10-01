# AIPrivateSearch v21.40 — Remote Mac Mini Test Plan

**Version under test**: 21.40
**Features**: Query Intelligence Layer (Auto mode) + v21.40 changes: test-suite auto method selection, unpdf PDF extraction, fail-hard document processing, DB-required startup, and Category 1/2/3 fail-fast (no silent fallbacks)
**Environment**: Remote Mac mini
**Created**: 2026-09-25 • **Updated**: 2026-10-01
**Related docs**: `aips-upgrade-Kiro-auto-select-plan.md`, `aips-upgrade-Kiro-auto-select-spec.md`, `sys-aips-deployment.md`, `sys-aips-changelog.md`

---

## 1. Scope

This plan validates the Query Intelligence Layer plus the v21.40 hardening changes **as actually implemented**. It covers:

- `QueryAnalyzer.mjs` behavior (classification, improvement, method/param selection)
- `POST /api/search/analyze-query` endpoint
- Main `POST /api/search` route integration (`searchType: "auto"`, `useIntelligence`, `queryMetadata`)
- Frontend Auto/Advanced toggle and 🧠 Smart Search Details on `search.html` and `ai-search.html`
- `test-query-intelligence.html` page
- **NEW v21.40**: `test-collections.html` sends `searchType:'auto'` (no hardcoded method)
- **NEW v21.40**: PDF extraction via `unpdf` (no `pdftotext`/poppler)
- **NEW v21.40**: fail-hard document processing (no error text written into `.md`)
- **NEW v21.40**: database **required** — server fails to start without DB config
- **NEW v21.40**: fail-fast config/credential/feature behaviors (no silent fallbacks)
- Regression of existing search methods and test pages
- Security/lint and performance

> **IMPORTANT — fail-hard behavior (changed in v21.40).** The Query Intelligence Layer no longer silently falls back on error. If analysis/parse fails (e.g. `gemma2:2b` unavailable or returns unparseable output), the search request **throws → HTTP 500** instead of degrading to `type:'analysis'` defaults. Sending a `testCode` still does **not** bypass the layer; the only full opt-out remains `useIntelligence:false`. Explicitly supplied `searchType`/`temperature`/`topK`/`context`/`systemPrompt` are preserved (auto-config only fills unset values).

---

## 2. Environment & Endpoints

| Item | Value |
|------|-------|
| Frontend | `http://[remote-host]:56305` |
| Backend API | `http://[remote-host]:56306` |
| Analysis model | `gemma2:2b` (Ollama at `localhost:11434` on the remote Mac) |
| Repo path | `/Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch` |
| Config path (runtime) | `/Users/Shared/AIPrivateSearch/config/` |

Replace `[remote-host]` with the Mac mini's hostname/IP. All `curl` examples below run **on the remote Mac** (use `localhost:56306`) or from another machine (use `[remote-host]:56306`).

---

## 3. Pre-Test Setup & Smoke Checks

| # | Step | Expected | Pass/Fail |
|---|------|----------|-----------|
| 0.1 | Deploy: `aiprivatesearch.app` → Start App (does `git pull`, config sync, starts Ollama/back/front) | App reports started, no errors | |
| 0.2 | Confirm version is 21.40 in footer and README | Shows v21.40 | |
| 0.3 | `ollama list \| grep gemma2` on remote | `gemma2:2b` present | |
| 0.3b | Node version on remote: `node -v` | **v22+** (required by `unpdf`) | |
| 0.3c | DB config present: all `DB_*` vars set in `/Users/Shared/AIPrivateSearch/.env-aips` | Server started (DB now **required** — see §15) | |
| 0.4 | Open `http://[remote-host]:56305` | Landing page loads, enter email, gains access | |
| 0.5 | Backend health: `curl -s http://localhost:56306/api/search/analyze-query -X POST -H "Content-Type: application/json" -d '{"query":"test"}'` | HTTP 200, valid JSON with `analysis`/`recommendedMethod` | |
| 0.6 | Confirm a collection exists (e.g. Law-Office) that is embedded (for hybrid/ai-document-chat) | Collection present & embedded | |

Record the collection name(s) used for the rest of the plan: `_______________`

---

## 4. Backend — QueryAnalyzer & analyze-query Endpoint

Endpoint: `POST http://localhost:56306/api/search/analyze-query` with body `{"query": "<q>"}`.

Response shape to verify: `{ original, analysis{type,quality,improved_query,reasoning}, improved{original,enhanced,wasImproved,reasoning}, recommendedMethod, recommendedParams{temperature,topK,context,systemPrompt,reasoning} }`.

| # | Query | Expected `analysis.type` | Expected `recommendedMethod` | Notes | Pass/Fail |
|---|-------|--------------------------|------------------------------|-------|-----------|
| 4.1 | `which clients have durable power of attorney` | `fact` | `hybrid-search` | Likely `quality: good`, no improvement | |
| 4.2 | `clients POA` | `fact` | `hybrid-search` | `wasImproved: true`, `improved.enhanced` expanded | |
| 4.3 | `summarize all estate planning documents` | `analysis` | `ai-document-chat` | | |
| 4.4 | `compare the Smith and Jones trusts` | `analysis` | `ai-document-chat` | | |
| 4.5 | `draft a cover letter for a new client` | `creative` | `ai-document-chat` | | |
| 4.6 | `estate` (very vague) | `fact` or `analysis` | matches type | Should be `needs-improvement` + improved | |
| 4.7 | Empty body `{}` | — | — | HTTP 400 `{"error":"Query is required"}` | |

Param sanity per type (from `getOptimalParameters`):
- fact → temp 0.1, topK 10, ctx 4096
- analysis → temp 0.3, topK 15, ctx 8192
- creative → temp 0.7, topK 10, ctx 8192

Batch helper (run on remote):
```bash
for q in "which clients have durable power of attorney" "clients POA" \
         "summarize all estate planning documents" "draft a cover letter" "estate"; do
  echo "== $q =="
  curl -s -X POST http://localhost:56306/api/search/analyze-query \
    -H "Content-Type: application/json" -d "{\"query\": \"$q\"}" \
    | jq '{type: .analysis.type, quality: .analysis.quality, improved: .improved.wasImproved, method: .recommendedMethod}'
done
```

**Fail-hard check (4.8) — CHANGED in v21.40**: With the analysis model unavailable (e.g. unload `gemma2:2b`, or point to a missing model), the analyzer must **throw**, not substitute defaults.
- `POST /api/search/analyze-query` → **HTTP 500** `{ "error": "Analysis failed", ... }` (no `type:'analysis'` default returned).
- `POST /api/search` in Auto mode → **HTTP 500** (`Query Intelligence Layer failed: ...`), NOT a silent degraded search.
- Restore the model and confirm normal 200 behavior resumes.

---

## 5. Backend — Main Search Route Integration

Endpoint: `POST http://localhost:56306/api/search`. Requires auth (route uses `requireAuthWithRateLimit`). Use a valid session/token as the app does, or drive these through the UI (Section 6) if direct curl auth is impractical. Verify the `queryMetadata` object in each response.

`queryMetadata` fields: `originalQuery, wasImproved, detectedType, autoSelectedMethod, testMode, intelligenceUsed`, plus optional `improvementReason, autoConfiguredTemp/TopK/Context/Prompt, configReasoning`.

| # | Request | Expected behavior | Key `queryMetadata` assertions | Pass/Fail |
|---|---------|-------------------|-------------------------------|-----------|
| 5.1 Auto fact | `{query:"clients POA", collection:<C>, model:"gemma2:2b"}` (no searchType) | Query improved, method auto = hybrid-search | `intelligenceUsed:true, autoSelectedMethod:true, wasImproved:true, detectedType:"fact", testMode:false` | |
| 5.2 Auto analysis | `{query:"summarize estate plans", collection:<C>, model:"gemma2:2b"}` | Method auto = ai-document-chat | `detectedType:"analysis", autoSelectedMethod:true` | |
| 5.3 Explicit method (partial intel) | `{query:"clients POA", collection:<C>, model:"gemma2:2b", searchType:"ai-document-chat"}` | Query still improved; method stays `ai-document-chat` | `wasImproved:true, autoSelectedMethod:false` | |
| 5.4 Explicit params preserved | `{query:"clients POA", collection:<C>, model:"gemma2:2b", temperature:0.9, topK:3}` | Auto-selects method; keeps temp 0.9 & topK 3 | `autoConfiguredTemp` absent/false, `autoConfiguredTopK` absent/false | |
| 5.5 Test mode still analyzes | `{query:"clients POA", collection:<C>, model:"gemma2:2b", testCode:"TEST-001"}` | Intelligence STILL runs (per shipped behavior) | `testMode:true, intelligenceUsed:true`; response echoes `testCode:"TEST-001"` | |
| 5.6 Intelligence disabled | `{query:"clients POA", collection:<C>, model:"gemma2:2b", useIntelligence:false}` | No analysis, no improvement, no auto-select | `intelligenceUsed:false, wasImproved:false, autoSelectedMethod:false`; query unchanged | |
| 5.7 Test + disabled | `{..., testCode:"TEST-002", useIntelligence:false}` | Pure pass-through for test | `testMode:true, intelligenceUsed:false`; query unchanged | |
| 5.8 Missing query | `{collection:<C>}` | HTTP 400 | `{"error":"Query is required"}` | |
| 5.9 No results path | Auto query guaranteed to match nothing | Graceful "No relevant documents found." | Response still includes `queryMetadata` | |

> Note for 5.5 vs 5.6: This is the single most important behavior change to confirm. Original plan expected `testCode` to bypass; shipped code does NOT. `useIntelligence:false` is the real bypass.

---

## 6. Frontend — search.html (Auto/Advanced + Smart Search Details)

URL: `http://[remote-host]:56305/search.html`

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 6.1 | Load page | Mode toggle visible; **Auto selected by default**; manual controls hidden (`.hidden`) | |
| 6.2 | Click **Advanced** | `#manualControlsSection` becomes visible (method/params) | |
| 6.3 | Click **Auto** | Manual controls hide again | |
| 6.4 | Auto search: "clients POA" on collection <C> | Runs; 🧠 Smart Search Details panel appears | |
| 6.5 | Inspect Smart Details | Shows detected type badge, "auto-selected" method badge; if improved, shows improved query text | |
| 6.6 | Auto search with a clear query "which clients have durable power of attorney" | Details show type=fact; no improvement shown (used as written) | |
| 6.7 | Advanced search: pick a method manually, submit | Uses chosen method; Smart Details reflects manual method (not auto-selected) | |
| 6.8 | Browser console during all above | No JS errors | |

---

## 7. Frontend — ai-search.html

URL: `http://[remote-host]:56305/ai-search.html`

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 7.1 | Load page | Auto/Advanced toggle present; Auto default | |
| 7.2 | Auto analysis query "summarize the estate plans" | Runs ai-document-chat; Smart Details shown | |
| 7.3 | Auto query whose recommendation is a non-AI method (e.g. very literal lookup) | Falls back to **Hybrid Search** (AI page stays within AI methods) — per search-methods doc | |
| 7.4 | Toggle Advanced, manually select method | Manual controls appear; chosen method used | |
| 7.5 | Console | No JS errors | |

---

## 8. Frontend — test-query-intelligence.html

URL: `http://[remote-host]:56305/test-query-intelligence.html`

| # | Query | Expected display | Pass/Fail |
|---|-------|------------------|-----------|
| 8.1 | `clients with POA` | Type: fact, Quality: needs-improvement, improved version shown, method Hybrid Search | |
| 8.2 | `which clients have durable power of attorney documents` | Type: fact, Quality: good, no improvement | |
| 8.3 | `summarize all estate plans` | Type: analysis, method AI Document Chat | |
| 8.4 | `draft a cover letter` | Type: creative, method AI Document Chat | |
| 8.5 | Badges & layout | Correct colors, no inline-style breakage | |
| 8.6 | Console | No JS errors | |

---

## 9. Regression — Existing Search & Test Pages

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| 9.1 | `exact-search.html` (Line/Document/Index) | Works unchanged (these are non-AI, no auto layer needed) | |
| 9.2 | `test-collections.html` full run | Completes; **each test now auto-selects method** (v21.40: sends `searchType:'auto'`). Fact tests (e.g. L1 POA) run **Hybrid Search**, not AI Document Chat | |
| 9.2b | Verify L1 "Which clients have durable power of attorney documents?" | Routes to Hybrid Search; returns the POA docs with real content (not 0% keyword / empty) — confirms the auto-selection + unpdf fixes together | |
| 9.3 | `test-nodocuments.html` full run | Completes without errors | |
| 9.4 | Scoring (enable scores + score model) | Scores still generated (Accuracy 3x / Relevance 2x / Org 1x) | |
| 9.5 | Search logs / `search-logs.html` | New searches logged, `searchMethod` recorded | |
| 9.6 | Document view links | Clickable filename links resolve (`/api/documents/...` on backend port) | |

> Baseline note: `test-collections.html` now uses `searchType:'auto'`, so method per test is chosen by the intelligence layer (fact→hybrid, analysis/creative→ai-document-chat). Results will differ from any pre-21.40 baseline that was pinned to `ai-document-chat`. Record a fresh baseline. Also: because the layer now fails hard, a test will **error (not silently default)** if `gemma2:2b` is unavailable.

---

## 10. Security & Lint

| # | Check (run in repo on remote or dev) | Expected | Pass/Fail |
|---|--------------------------------------|----------|-----------|
| 10.1 | `npm run lint:security` | Passes, no new violations | |
| 10.2 | No `innerHTML` in new/modified search JS | `search.js`, `ai-search.js`, `test-query-intelligence.html` use `textContent`/`createElement` | |
| 10.3 | No inline `style="display:none"` in new HTML | New sections use `class="hidden"` | |
| 10.4 | Logging | QueryAnalyzer uses `logger.log/error` (sanitized) | |

---

## 11. Performance

| # | Measure | Target | Actual | Pass/Fail |
|---|---------|--------|--------|-----------|
| 11.1 | analyze-query latency (gemma2:2b) | < 3 s | | |
| 11.2 | Auto search total (analysis + search) | < 12–15 s | | |
| 11.3 | 20 sequential auto searches | No memory growth / instability | | |
| 11.4 | Baseline non-intel search (`useIntelligence:false`) vs auto | Delta ≈ 1–3 s | | |

Timing helper:
```bash
time curl -s -X POST http://localhost:56306/api/search/analyze-query \
  -H "Content-Type: application/json" -d '{"query":"clients POA"}' > /dev/null
```

---

## 12. PDF Extraction via unpdf (NEW v21.40)

`pdftotext`/poppler is removed; PDFs are extracted with `unpdf` (pure JS, needs Node ≥22).

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| 12.1 | `which pdftotext` on remote | Not required anymore (may be absent); extraction must still work | |
| 12.2 | Re-embed a PDF collection (Collections → Embed Source MDs) for a collection with `.pdf` sources (e.g. Sample_Law-Office) | Completes; generated `.md` contains **real document text**, not `[Error extracting PDF content]` | |
| 12.3 | Inspect a converted doc, e.g. `Durable Power of Attorney of Thomas Hall.md` | Contains actual legal text ("I, Thomas Hall… Appointment of Agent…"), no `pdftotext: command not found` | |
| 12.4 | Hybrid search "durable power of attorney" on that collection | Non-zero **keyword** score (body text now present), real chunks (not `[{},{}...]`) | |
| 12.5 | Image-based/scanned PDF (if available) | Extraction **throws** (fails hard: "no usable text / may be image-based"), does not index an error placeholder | |

> The 18 previously-corrupted docs (14 Sample_Law-Office, 4 Sample_USA-History) must be re-converted + re-embedded on a Node ≥22 host so their `.md` holds real text.

---

## 13. Fail-Hard Document Processing (NEW v21.40)

All format processors now **throw** on failure instead of writing `[Error extracting …]` into the `.md`.

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| 13.1 | Upload/process a corrupt or unsupported file (e.g. a `.pdf` that is actually not a PDF) | Processing **fails with a clear error**; no `.md` with error text is created/embedded | |
| 13.2 | Grep sources for leftover error placeholders: `grep -rl "Error extracting" sources/local-documents/` | **No** `.md` files contain extraction-error text (after re-embed) | |
| 13.3 | Normal supported docs (.md, .txt, .docx, .pdf) | Process and embed normally | |

---

## 14. Database Required at Startup (NEW v21.40)

The server now **fails fast** if any `DB_*` env var is missing (DB is no longer optional).

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| 14.1 | Normal start with full `.env-aips` | Server starts, "Shared DB pool created" | |
| 14.2 | Start with a DB var removed (test env only — **do not** do on live data host) | Server **refuses to start**: "CRITICAL: Missing required database configuration: …" | |
| 14.3 | Restore `.env-aips`; restart | Starts normally | |

> Caution: 14.2 is a startup-failure test. Perform on a scratch/staging instance, not the production remote, since it stops the app.

---

## 15. Fail-Fast Config / No Silent Fallbacks (NEW v21.40)

Config/credential/feature silent defaults were removed (Cat 1/2/3).

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| 15.1 | Ports come from `app.json` only | App binds `ports.frontend`/`ports.backend` (56305/56306 default); no silent 3000/3001 | |
| 15.2 | Corrupt/missing `app.json` (staging only) | Server throws at startup (`AppConfig.getPorts()` / config-not-found), does not bind defaults | |
| 15.3 | custmgr config present in `app.json` | Licensing initializes; missing `protocol`/`host` → throws (no `https`/default host guess) | |
| 15.4 | Create-admin without `subscriptionTier` (`POST /api/auth/create-and-login-admin`) | **HTTP 400** `subscriptionTier is required` (no silent grant of "professional") | |
| 15.5 | Query-intel failure (model down) | Search **500s** (see 4.8), does not silently default | |
| 15.6 | Least-privilege tier defaults retained | Missing/unknown tier in session/license still resolves to lowest tier (fail-closed), not an error | |

---

## 16. Exit Criteria (Launch Blockers)

- [ ] 0.x smoke checks pass (incl. 0.3b Node≥22, 0.3c DB configured)
- [ ] Section 4 classifications correct (allowing analyzer variance on 4.6)
- [ ] **4.8 fail-hard**: analyzer/search return 500 when model unavailable (no silent default)
- [ ] 5.5 confirms test mode runs intelligence; 5.6 confirms `useIntelligence:false` bypasses
- [ ] Auto/Advanced toggle + Smart Details work on both search pages (6, 7)
- [ ] test-query-intelligence.html works (8)
- [ ] **9.2b**: L1 POA routes to Hybrid Search with real content
- [ ] **§12 unpdf**: PDFs extract real text; no `pdftotext` dependency; image-PDF fails hard
- [ ] **§13**: no error-placeholder `.md` files remain after re-embed
- [ ] **§14**: server fails fast without DB config; starts with it
- [ ] **§15**: fail-fast config/credential/tier behaviors verified
- [ ] `npm run lint:security` passes (see §10.1)
- [ ] Performance within targets (see §11)

---

## 17. Defect Log

| ID | Test # | Severity | Description | Status |
|----|--------|----------|-------------|--------|
| | | | | |

---

## 18. Rollback (if blockers found)

Per deployment guide, revert on remote by:
1. In repo: `git log --oneline | head` → identify the pre-21.40 commit; `git revert <hash>` (non-destructive) and restart via `aiprivatesearch.app`.
2. Or disable the layer at the request level via `useIntelligence:false` (UI can default to Advanced).
3. Confirm remote picks up change on next `Start App` (`git pull`).

> Note: v21.40 makes the DB **required** and the intelligence layer **fail-hard**. If a rollback is needed specifically for those, reverting the relevant commits restores prior (optional-DB / silent-fallback) behavior.

---

**Sign-off**

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester | | | |
| Reviewer | | | |
