# AIPrivateSearch — Test Plan (Remote Mini)

**Target machine:** Mac mini (PcCode `G934T7`, Apple M4, 16 GB)
**Build under test:** v21.69 (changes since v21.59: recommender, local store, DB-optional startup, search-logs export removal, test-nodocuments fixes)
**How to use:** tick the box when a test passes. If a test fails, leave it unticked and write what you saw on the `Result:` line (error text, server log line, or console error).

Legend: `[x]` done / passed · `[ ]` not yet run · `[!]` failed (add a note)

---

## What this plan verifies

1. The remote MySQL DB is a **testing sink only**: written solely by `test-collections.html` and `test-nodocuments.html`.
2. All end-user activity (interactive search, the Benchmark button, the recommender) uses a **local store** on the machine and never touches the remote DB.
3. The app **starts and runs without** the remote DB configured.
4. The AI Search page shows **model recommendations** and **context-fit** notes from the local store.

Local store location: `/Users/Shared/AIPrivateSearch/recommender/recommender-<PcCode>.json`

Helper query used throughout (note `MAX(Id)` before and after a step to tell new rows from old):

```sql
SELECT MAX(Id) FROM searches;
```

DB access: `mysql -h 92.112.184.206 -P 3306 -u aips-readwrite -p aiprivatesearch`

---

## Status summary

| Section | Tests | Status |
|---|---|---|
| Pre-flight | T0 | done (run on v21.65) |
| A. DB-optional startup | T1–T3 | done (run on v21.65) |
| B. Remote DB = testing only | T4–T6 | done (T4, T5, T6 pass) |
| C. Local recommender store | T7–T9 | T7, T8 done · T9 next |
| D. Recommender UI | T10, T10b, T11–T13 | reworked in v21.69 (chips replaced by dropdown entry) — re-test |
| E. Search-logs removal | T14–T15 | not started |
| F. Regression sanity | T16–T17 | not started |

---

## Pre-flight

- [x] **T0 — Upgrade.** Pull the build on the mini and restart the server.
  - Pass: footer shows the expected version; server starts with no crash in the logs.
  - Note: T0–T3 were run on v21.65. Re-confirm the footer reads **v21.67** before continuing with section B onward.
  - Result: OK (v21.65). Re-check footer for v21.67: `[ ]`

---

## A. DB-optional startup

- [x] **T1 — Starts WITHOUT the DB.** Comment out the five `DB_*` lines in `/Users/Shared/AIPrivateSearch/.env-aips`, restart.
  - Pass: app starts; server log shows `Remote database not configured (missing: …); database-backed test endpoints are disabled.`; AI Search loads and a normal search works.
  - Fail: app will not start, or any crash mentioning database config.
  - Result: OK

- [x] **T2 — Login works without the DB.** With `DB_*` still commented out, log in as the default admin.
  - Pass: login succeeds (confirms the `.env-aips` admin variables still load).
  - Result: OK

- [x] **T3 — Restore the DB.** Un-comment the `DB_*` lines, restart.
  - Pass: app starts; no errors.
  - Result: OK

---

## B. Remote DB = testing only

- [x] **T4 — `test-collections.html` writes to the remote DB.** Run one collection group × 1–2 models with the gemma4:12b scorer, then query the DB.
  ```sql
  SELECT Id, `ModelName-search`, `WeightedScore-pct`, `ResidentMB-search`, CreatedAt
  FROM searches ORDER BY Id DESC LIMIT 5;
  ```
  - Pass: new rows appear with non-null `ResidentMB-search` and `WeightedScore-pct`.
  - Result: OK

- [x] **T5 — `test-nodocuments.html` writes to the remote DB.** Run `t1112310` on gemma4:12b.
  - Pass: run completes and reports `Saved to database (ID: …)`.
  - Result: PASS on v21.67 — row **3038**. Verified: `TestCode t1112310`, category `Performance Tests Local Model Only`, Local Model Only, ctx 8192, temp 0.6, token limit `No Limit`, `ResidentMB-search` 7646, `LoadedContext-search` 8192, digest present, scorer/score NULL (correct for "No Scoring").
  - History: failed twice before passing — v21.66 fixed the stale prompt/code parser, v21.67 fixed the null token limit.
  - Known gap (not a failure): `SystemPrompt` (name) is NULL on the row; `SystemPromptText` is saved. See *Open items*.

- [x] **T6 — Interactive search does NOT write to the remote DB.**
  1. Record `SELECT MAX(Id) FROM searches;` → 3038
  2. On `ai-search.html`, run one search with a RAG method (hybrid, ai-document-chat, or ai-direct) on any collection.
  3. Re-run `SELECT MAX(Id) FROM searches;` → 3038
  - Pass: `MAX(Id)` is unchanged.
  - Result: PASS — `MAX(Id)` 3038 → 3038 (unchanged); the search ran and returned an answer.
  - Search answer (evidence): None of the wills or trusts listed in the provided excerpts contain assets over $1 million. The specific asset values mentioned are limited to a $15,000 distribution to Springfield Arts Foundation (Source 1), a $20,000 distribution to Olivia Baker (Source 5), and a $10,000 bequest to Springfield Community Charity (Source 6). While some documents reference real property, brokerage accounts, or savings accounts without specifying total balances exceeding one million dollars, no excerpt explicitly states that any client's total assets surpass this threshold.


---

## C. Local recommender store

- [x] **T7 — Interactive search creates the local store.** Run T6's search (or another RAG search), then:
  ```
  ls -la /Users/Shared/AIPrivateSearch/recommender/
  cat /Users/Shared/AIPrivateSearch/recommender/recommender-*.json
  ```
  - Pass: a `recommender-<PcCode>.json` exists with a `resource` entry for the model you ran, with non-zero `maxResidentMB` and a real `context`. (`scores` may be empty — interactive runs record resources only.)
  - Fail: no file, or a file with no resource entry.
  - Store contents (as reported):
    ```json
    {
      "schemaVersion": 1,
      "pcCode": "G934T7",
      "pcRamMB": 16384,
      "updatedAt": "2026-11-09T19:09:34.545Z",
      "resource": {
        "qwen3.5:9b|d63f830f28d515fefea546f213fca7a7|8192": {
          "model": "qwen3.5:9b",
          "digest": "d63f830f28d515fefea546f213fca7a7",
          "context": 8192,
          "runs": 2,
          "sumResidentMB": 15200,
          "maxResidentMB": 7650,
          "lastSeen": "2026-11-09T19:09:34.545Z"
        }
      },
      "scores": {}
    }
    ```
  - Result: PASS — file created for `G934T7`; RAM read locally (16384 MB); one resource entry for `qwen3.5:9b` (ctx 8192, 2 runs, peak 7650 MB, avg 7600 MB); `scores` empty as expected for interactive runs.
  - Side effect worth using: 2 runs at 8192 meets the "proven to fit" threshold, so the context-fit note (T12) can already be exercised with `qwen3.5:9b`.

- [x] **T8 — Benchmark writes to the local store, not the remote DB.**
  1. Record `SELECT MAX(Id) FROM searches;` → 3038
  2. In `collections-editor.html`, pick a collection that **has authored prompts** and run **Run Benchmark** with 2+ models and the gemma4 scorer.
  3. Re-check `MAX(Id)` → 3038 and re-read the local JSON.
  - Pass: the log says `recorded to this machine's local store`; the local JSON now has `scores` entries (`collection|model` with runs and average); remote `MAX(Id)` is unchanged.
  - Result: PASS (reported) — remote `MAX(Id)` 3038 → 3038 (unchanged), so the benchmark wrote nothing to the remote DB. Verified from the local JSON: `Sample_Medical-Practice` has 5 scored runs each for `gemma4:12b` (avg 96.6, range 83–100) and `qwen3.5:9b` (avg 77.6, range 58–100) — 5 prompts × 2 models. Resource entries: gemma4 @8192 (5 runs, peak 9125 MB); qwen3.5:9b @4096 (3 runs, peak 7762 MB), @8192 (6 runs, peak 7650 MB), @12288 (1 run, 7779 MB). RAM budget 16384 × 0.65 = 10649 MB, so all fit.

- [ ] **T9 — Generic-prompt fallback.** Run **Run Benchmark** on a collection with **no** authored prompts.
  - Pass: the log notes it is using generic benchmark prompts; the run completes and records `scores` entries locally.
  - Result:

---

## D. Recommender UI

- [ ] **T10 — "Model(s)" title and Recommended Model List entry.** On `ai-search.html` select the benchmarked collection (`Sample_Medical-Practice`).
  - Pass: a **Model(s)** title sits above the model dropdown, and the **first entry** in the dropdown reads `Recommended Model List: gemma4:12b, qwen3.5:9b` (order = best score first). The list is enabled and your current model selection is unchanged. There are no chips under the dropdown.
  - History: v21.61–v21.68 showed a line of chips instead; it rendered correctly but was not visible on screen, so that approach was dropped in v21.69.
  - Result:

- [ ] **T10b — Choosing the Recommended Model List runs each model.** Select **Recommended Model List**, enter a query, and search (Auto mode, or Advanced with one or more methods ticked).
  - Pass: the results column shows one headed section per model — `Model: gemma4:12b`, then `Model: qwen3.5:9b`. While the first model runs, the second shows `Waiting...`; it changes to `Searching...` only after the first has finished (models run **one after another**, never together). The performance table has one row per method and model, labelled like `Hybrid Search · gemma4:12b`.
  - Also check: re-reading `/Users/Shared/AIPrivateSearch/recommender/recommender-*.json` shows `updatedAt` moved and `runs` increased for both models.
  - Also check: picking a single real model still behaves as before — no `Model:` headings, one result.
  - Result:

- [ ] **T11 — Cold-start fallback.** Select a collection that has **not** been benchmarked (after at least one other benchmark exists).
  - Pass: the first dropdown entry reads `Recommended Model List (all collections): <models>` (a machine-wide ranking, clearly labelled). If the store has no scores at all, the entry is disabled and reads `Recommended Model List (none yet — run a benchmark)`.
  - Also check: with the recommended entry **selected**, switching to a collection that has no data at all moves the selection to the first real model.
  - Result:

- [ ] **T12 — Context-fit note.** Pick a benchmarked model and set Context **above** its observed value (e.g. 32768).
  - Pass: a ⚠ note appears (`… has only been observed to fit <N> …; … will be clamped`). Setting Context to the observed value shows a ✓ "fits" note.
  - Expected from the T8 data: `gemma4:12b` observed only at 8192 → 16384 or 32768 shows ⚠, 8192 or 4096 shows ✓. `qwen3.5:9b` proven at 4096 and 8192 → 12288 also shows ⚠ (only 1 run there; the rule needs at least 2 observations), 8192 or 4096 shows ✓.
  - Also check with **Recommended Model List** selected and Context 32768: one ⚠ line naming the models that would be clamped (e.g. `gemma4:12b → 8192`); at 4096 a ✓ `fits every recommended model`.
  - Result:

- [ ] **T13 — Empty store shows nothing (optional).** With an empty/fresh store, select any collection.
  - Pass: no hint and no JS error in the console.
  - Result:

---

## E. Search-logs removal

- [ ] **T14 — Export button gone.** Open `search-logs.html`.
  - Pass: the viewer loads and lists local logs; there is **no** "Export to Database" button.
  - Result:

- [ ] **T15 — Export endpoint gone.**
  ```
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:56306/api/search-logs/export-logs-to-database
  ```
  (adjust the port if your server differs)
  - Pass: `404`. The viewer's own `GET /api/search-logs` still works in the page.
  - Result:

---

## F. Regression sanity

- [ ] **T16 — Scores still clean.** In the T4 batch, spot-check the scorer and the E4-type answers.
  - Pass: scorer is `gemma4:12b`; no bare "Source 1, Source 2…" list-dumps scoring 33.
  - Result:

- [ ] **T17 — No console errors.** Watch the browser console on `ai-search.html` during T6–T12.
  - Pass: no uncaught errors; recommender fetch failures degrade silently rather than throw.
  - Result:

---

## Open items (not part of pass/fail)

- [ ] **Review `test-nodocuments.html` in full** — it was broken for a long time and every fix has exposed the next stale spot. Known items:
  - `SystemPrompt` name is NULL on new rows: `/api/search` does not return `systemPromptName`, so the save step has nothing to store (one-line server fix).
  - `config/model-tests.json` description for `t1543311` says "Max Context=16384, 250 Tokens" but the code means 8192 and no limit (the correct code for that description would be `t1543421`).
  - Two TestCode layouts exist (8-char in the config, 10-char in `docs/system-documentation/archive/aips-testcodes.md`); `model-tests.json` flipped between them in v19.59 and v19.63. Decide which is canonical.
  - `getTestCategoryAndDescription` still contains legacy 8-char code lists; the page actually uses `getTestCategoryAndDescriptionFromJSON`, so the legacy function is only a fallback.
- [ ] **Search Logs page** — only the database export was removed. Decide whether to remove the whole viewer.
- [ ] **Medical test codes** in `test-collections.html` encode tokens/topK values that differ from what actually runs (4096/20 vs 2048/25).
- [ ] **Context for Federalist / Literature** — decide whether to use 32768 based on real memory observed on the mini.
- [ ] **Deferred:** capture real `prompt_eval_count` (needs threading through each search class).

---

## Reporting results

Reply with the test number and outcome, for example:

> T6 PASS · T7 PASS (JSON pasted) · T8 FAIL: log says "recorded" but local JSON has no `scores`

For any failure include the exact error text plus, if available, the server log line or browser console error.
