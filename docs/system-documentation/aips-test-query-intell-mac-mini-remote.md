# AIPrivateSearch v21.38 — Remote Mac Mini Test Plan

**Version under test**: 21.38
**Feature**: Query Intelligence Layer (Auto mode, query improvement, auto method/param selection)
**Environment**: Remote Mac mini
**Created**: 2026-09-25
**Related docs**: `aips-upgrade-Kiro-auto-select-plan.md`, `aips-upgrade-Kiro-auto-select-spec.md`, `sys-aips-deployment.md`

---

## 1. Scope

This plan validates the Query Intelligence Layer changes **as actually implemented** (which differs from the original plan on test-mode behavior — see note below). It covers:

- New `QueryAnalyzer.mjs` behavior (classification, improvement, method/param selection)
- New `POST /api/search/analyze-query` endpoint
- Main `POST /api/search` route integration (`searchType: "auto"`, `useIntelligence`, `queryMetadata`)
- Frontend Auto/Advanced toggle and 🧠 Smart Search Details on `search.html` and `ai-search.html`
- New `test-query-intelligence.html` page
- Regression of existing search methods and test pages
- Security/lint and performance

> **IMPORTANT — behavior deviation from original plan.** In the shipped code the main route calls `analyzeQuery(query, { testMode: false })`, so **sending a `testCode` does NOT bypass the intelligence layer.** Analysis and query improvement still run for tests. Explicitly supplied `searchType`, `temperature`, `topK`, `context`, and `systemPrompt` are preserved (auto-config only fills unset values). The **only** full opt-out is `useIntelligence: false`. Test cases below reflect the shipped behavior, not the original plan text.

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
| 0.2 | Confirm version is 21.38 in footer and README | Shows v21.38 | |
| 0.3 | `ollama list \| grep gemma2` on remote | `gemma2:2b` present | |
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

**Fallback check (4.8)**: temporarily stop the analysis model path (e.g. query while model unloaded / or observe under load). On analyzer error the endpoint/route must not crash; analysis falls back to `type: analysis, quality: good`. Verify no 500 and search still returns.

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
| 9.2 | `test-collections.html` full run | Completes; results comparable to prior baseline | |
| 9.3 | `test-nodocuments.html` full run | Completes without errors | |
| 9.4 | Scoring (enable scores + score model) | Scores still generated (Accuracy 3x / Relevance 2x / Org 1x) | |
| 9.5 | Search logs / `search-logs.html` | New searches logged, `searchMethod` recorded | |
| 9.6 | Document view links | Clickable filename links resolve (`/api/documents/...` on 56306) | |

> Baseline note: because test-mode now runs analysis/improvement, `test-collections.html` results may differ from a pre-21.38 baseline for queries where the analyzer improves the prompt. If strict comparability is required, add `useIntelligence:false` to those tests, or accept and document the new baseline.

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

## 12. Exit Criteria (Launch Blockers)

- [ ] 0.x smoke checks pass
- [ ] Section 4 classifications correct (allowing analyzer variance on 4.6)
- [ ] 5.5 confirms test mode runs intelligence; 5.6 confirms `useIntelligence:false` bypasses
- [ ] Auto/Advanced toggle + Smart Details work on both search pages (6, 7)
- [ ] test-query-intelligence.html works (8)
- [ ] No regressions in existing pages/tests (9)
- [ ] `npm run lint:security` passes (10.1)
- [ ] Performance within targets (11)

---

## 13. Defect Log

| ID | Test # | Severity | Description | Status |
|----|--------|----------|-------------|--------|
| | | | | |

---

## 14. Rollback (if blockers found)

Per deployment guide, revert on remote by:
1. In repo: `git log --oneline | head` → identify pre-21.38 commit; `git revert <hash>` (non-destructive) and restart via `aiprivatesearch.app`.
2. Or disable the layer at the request level via `useIntelligence:false` defaults / UI defaulting to Advanced.
3. Confirm remote picks up change on next `Start App` (`git pull`).

---

**Sign-off**

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester | | | |
| Reviewer | | | |
