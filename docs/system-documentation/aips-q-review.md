# AIPrivateSearch — Amazon Q Developer Review

**Reviewer**: Amazon Q Developer  
**Date**: 2026-09-02  
**Version**: 21.37  
**Scope**: Full codebase — server, client, scoring, database, architecture

---

## Executive Summary

AIPrivateSearch is a well-conceived local-first AI document search platform with a clear architectural vision. The codebase shows consistent development discipline — modular routing, shared utilities, ESLint security hooks, and a meaningful test/scoring framework. The recent scoring improvements (grounded evaluation with source chunks, CoT stripping, weight rebalancing) demonstrate active quality thinking.

The main areas for improvement are: scoring reliability, security hardening, client-side code organization, and a few architectural patterns that will become pain points as the system grows.

---

## I. Architecture

### Strengths

- **Clean separation of concerns** — server routes, search orchestration, scoring, licensing, and logging are all separate modules. The `SearchOrchestrator` pattern is solid.
- **Local-first design is well-executed** — Ollama integration, local MySQL, no external API dependencies for core functionality. This is the right architecture for the privacy use case.
- **Shared utilities** — `logger.mjs`, `appConfig.mjs`, and `db.mjs` are properly shared across the server. The `typeCast` fix in `db.mjs` shows good root-cause thinking.
- **Test framework** — having `TestCode`, `TestCategory`, `WeightedScore-pct` in the DB schema and dedicated test/analyze pages is a significant differentiator. Most local AI tools have no evaluation infrastructure at all.

### Areas for Improvement

- **`DeviceLicenseClient` instantiated per request** — in `search.mjs`, `new DeviceLicenseClient()` is called on every search request just to get system info. This should be instantiated once at module level or cached, not per-request.
- **Hardcoded `localhost:11434` and `localhost:56306`** — Ollama host and document server port appear in multiple files. These should be in config/environment variables so they can be changed in one place.
- **`search.mjs` is doing too much** — Phase 1 (search), Phase 2 (scoring), system info, logging, and response building are all in one 230-line function. Consider extracting scoring and logging into middleware or a pipeline pattern.
- **No retry logic on Ollama calls** — the DB pool has retry logic (`ECONNRESET`), but direct `fetch` calls to Ollama have none. A slow model load can cause a hard failure with no recovery.

---

## II. Scoring System

### Strengths

- **Grounded scoring with source chunks** — the recent addition of passing retrieved chunks to the scorer is the right approach. Blind scoring (answer only) is fundamentally unreliable for retrieval tasks.
- **CoT stripping** — stripping `<think>...</think>` blocks before scoring and saving is essential for qwen3.5/gemma4 correctness.
- **Weight rebalancing (4x/3x/1x)** — accuracy-dominant weighting is appropriate for a document retrieval tool.
- **Non-answer penalty rules** — the 15-word minimum and explicit "cannot determine" penalty are good heuristics.

### Areas for Improvement

- **Scorer model choice matters more than prompt** — the scoring prompt is now well-designed, but a 2B model will still fail to follow it reliably. The system should warn users if they select a model under 7B for scoring.
- **`parseScores` fallback is fragile** — the fallback that extracts "first 3 numbers in range 1-3" from free text will misfire on answers that contain numbers like "3 patients" or "1 document". The prompt should be strengthened to output a structured format like `A:2 R:3 O:2` and the parser updated to match.
- **`scoreSettings` loaded but never used** — `this.scoreSettings = this.loadScoreSettings()` in the constructor loads a config file, but `scoreSettings` is never referenced in `score()` or `parseScores()`. This is dead code and the file read on every server start is wasted I/O.
- **Context size hardcoded at 8192 for chunks** — 5 chunks of legal/medical text can easily exceed 8192 tokens. This should be configurable or calculated dynamically based on chunk sizes.
- **No scoring for non-document AI searches** — `chunks` is only populated for document searches. For `ai-direct` and `smart-search` without a collection, the scorer has no source context. This is a known gap but worth documenting.

---

## III. Database

### Strengths

- **`typeCast` fix** — returning BLOB/TEXT columns as strings globally is the correct fix. Avoids `[object Object]` issues across all routes.
- **Connection pooling** — `connectionLimit: 10` with `idleTimeout` is appropriate for a local single-user deployment.
- **Retry logic** — the `ECONNRESET` retry in `database.mjs` is good defensive coding.

### Areas for Improvement

- **`SELECT *` in tests API** — `SELECT * FROM searches-testresults` returns all columns including large `Answer-search` text fields for every row. For pages that only need metadata (compare page selectors, analyze pages), this is significant unnecessary data transfer. Add a lightweight metadata endpoint.
- **No connection release in all error paths** — verify that `connection.release()` is called in every catch/finally branch. A missed release under load will exhaust the pool.
- **`searches` and `searches-testresults` schema drift** — the `INSERT INTO searches-testresults SELECT * FROM searches` transfer assumes identical schemas. If columns are added to `searches` without updating `searches-testresults`, this will silently fail or error.
- **Password stored as empty string default** — `password: process.env.DB_PASSWORD || ''` means a misconfigured environment silently connects with no password. Should throw an error if `DB_PASSWORD` is not set in non-development environments.

---

## IV. Security

### Strengths

- **ESLint security hooks** — pre-commit ESLint with security rules is a meaningful control for a local app.
- **`requireAuthWithRateLimit`** — rate limiting on the search endpoint (30 req/60s) is appropriate.
- **Input sanitization** — `DOMSanitizer` usage in client JS is good practice.
- **CSRF protection** — present in the middleware stack.

### Areas for Improvement

- **`userEmail` from `localStorage` used as auth** — several API calls pass `X-User-Email` from `localStorage` as the identity header. This is not authentication — any value can be set in localStorage. Ensure server-side session/token validation is the actual auth gate, not the email header.
- **`localhost:11434` Ollama exposed without auth** — Ollama's API has no authentication by default. On a shared machine or network, any process can call it. Consider binding Ollama to `127.0.0.1` only and documenting this in deployment notes.
- **`fix-auth.js` and `fix-session.js` in repo root** — these files suggest past auth debugging. They should be removed from the repo if no longer needed, as they may contain sensitive patterns or workarounds.
- **`cookies.txt` committed to repo** — this file should be in `.gitignore`. Cookie files can contain session tokens.
- **`server.mjs.backup` in repo** — backup files should not be committed. Add `*.backup` to `.gitignore`.

---

## V. Client-Side Code

### Strengths

- **Consistent page structure** — all pages follow the same header/footer placeholder pattern with `common.js` loading shared nav. This is maintainable.
- **`localStorage` cache for selectors** — the `aips-compare-selectors` cache pattern on the compare page is a good UX optimization.
- **Shared `styles.css`** — the `.pc-tooltip` class addition to shared styles (rather than per-page) shows good CSS discipline.
- **Dark/light theme** — theme persistence via `localStorage` with immediate application before render (avoiding flash) is well implemented.

### Areas for Improvement

- **Inline `<style>` blocks duplicating shared CSS** — `analyze-container`, `analyze-section`, `compare-selectors`, `compare-group`, `checkbox-list` CSS is duplicated across `tests-compare.html`, `tests-compare-zoom.html`, and `result-analyst.html`. These should move to `shared/styles.css`.
- **`result-analyst.html` uses `api/search/ai-direct` for Ollama calls** — the Result Analyst peer review and chairman synthesis call the search API endpoint, which is designed for search, not general LLM generation. A dedicated `/api/generate` endpoint would be cleaner and avoid search logging side effects.
- **No loading state on Result Analyst** — the Run Analysis button has no disabled state during the multi-step async process. Users can click it multiple times, spawning duplicate analysis runs.
- **`window._lastGroups` and `window._lastMetrics`** — global state on `window` in `tests-compare.html` is a code smell. This data should be in a local variable or module-level variable.
- **Chart.js loaded on every compare page** — Chart.js (4.4, ~200KB) is loaded on `tests-compare.html` and `tests-compare-zoom.html` even when the user selects Table view. Consider lazy-loading it only when Bar Chart is selected.

---

## VI. Result Analyst Page

### Strengths

- **Model × Category advisor grid** — the concept of treating each model/category combination as an independent advisor is a sound evaluation methodology.
- **Progressive rendering** — advisor cards appear first, then peer review, then verdict. Good UX for a multi-step async process.
- **Chairman synthesis structure** — the 5-section verdict format (Agrees / Clashes / Blind Spots / Recommendation / One Thing) is well-designed.

### Areas for Improvement

- **Peer review uses same model for all reviewers** — the chairman model reviews all answers. Ideally each advisor's own model would review the others, but this requires knowing which model produced which answer. At minimum, document this limitation.
- **No timeout handling** — if a model takes >2 minutes per step and there are 4 advisors + 4 reviews + 1 chairman = 9 sequential calls, the total wait could be 18+ minutes with no feedback beyond the progress bar.
- **`ollamaGenerate` calls `/api/search/ai-direct`** — as noted above, this is the wrong endpoint for general generation. It will log every peer review and chairman call as a search event in the search logs.

---

## VII. Compare Tests Page

### Strengths

- **Cartesian product comparison** — the Model × Category × PC × QueryType × Test combination approach is powerful for systematic evaluation.
- **Zoom page** — the `tests-compare-zoom.html` single-metric deep-dive is a good UX pattern.
- **Answers result type** — the new 2-column answer card view with PcCode tooltip is well executed.

### Areas for Improvement

- **`testData` loaded fresh on every page visit** — `SELECT *` from `searches-testresults` on every page load with no caching means large datasets cause noticeable delays. The `localStorage` selector cache helps UX but the data itself is re-fetched every time.
- **No empty state for Answers view** — if no answers match the filter, the message "No answers found" appears but the selectors give no indication of why. A count of matching records before running would help.

---

## VIII. Quick Wins (Low Effort, High Impact)

1. **Remove `cookies.txt` and `server.mjs.backup` from repo** — add to `.gitignore`
2. **Move `DeviceLicenseClient` instantiation out of per-request scope** in `search.mjs`
3. **Remove dead `scoreSettings` code** from `ScoringService` constructor
4. **Add `*.backup` and `cookies.txt` to `.gitignore`**
5. **Strengthen `parseScores` parser** — use `A:N R:N O:N` format instead of free-text number extraction
6. **Disable Run Analysis button during execution** in `result-analyst.html`
7. **Move duplicate inline CSS** (`analyze-container`, `compare-group` etc.) to `shared/styles.css`

---

## Summary Table

| Area | Rating | Key Issue |
|---|---|---|
| Architecture | ★★★★☆ | DeviceLicenseClient per-request, hardcoded ports |
| Scoring | ★★★★☆ | Fragile score parser, dead scoreSettings code |
| Database | ★★★☆☆ | SELECT * on large tables, schema drift risk |
| Security | ★★★☆☆ | cookies.txt in repo, email-as-auth pattern |
| Client Code | ★★★☆☆ | Duplicate CSS, wrong endpoint for LLM generation |
| Result Analyst | ★★★★☆ | No timeout handling, wrong API endpoint |
| Compare Tests | ★★★★☆ | No data caching, SELECT * overhead |
| Overall | ★★★★☆ | Solid foundation, targeted improvements needed |

---

*This review was generated by Amazon Q Developer as part of the AIPrivateSearch development workflow. See the Code Issues Panel for the full automated findings list (30+ items).*
