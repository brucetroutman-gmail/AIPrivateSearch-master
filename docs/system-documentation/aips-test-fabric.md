# AIPS Fabric Integration Test Plan

**Version**: 20.26 | **Date**: 2025
**Scope**: Fabric pattern generation, prompt enhancement, view/edit pattern
**Collections used**: USA-History (safe), Family-Documents (sensitive)
**Test user**: Premium admin (adm-prem@a.com)

---

## Prerequisites

- [ ] App running on remote Mac (v20.26+)
- [ ] Fabric server running: `curl https://fabric.formr.net/patterns/names` returns list
- [ ] USA-History collection has index cards (Create Doc Index Cards already run)
- [ ] Logged in as Premium admin

---

## Section 1 — Pattern Generation (Collections Editor)

### Test 1-001: Auto-generate pattern via Process Source Files
1. Go to **Collections → Edit** on USA-History
2. Select all `.md` files
3. Click **Process Source Files**
4. Watch the log output
- **Expected**: After Step 2 completes, log shows `✨ Fabric pattern generation started for USA-History`
- **Expected**: No error in log for pattern generation step
- **Expected**: Step 3 (Embed) continues normally after fire-and-forget

### Test 1-002: Verify pattern exists on Fabric server
After Test 1-001 completes:
```bash
curl https://fabric.formr.net/patterns/names | grep enhance_USA-History
```
- **Expected**: `enhance_USA-History` appears in the list

### Test 1-003: View Fabric Pattern button visible to Premium
1. Go to **Collections → Edit** on USA-History
- **Expected**: `✨ View/Edit Fabric Pattern` button is visible (doc-index-edit-only group)

### Test 1-004: View Fabric Pattern button NOT visible to Standard
1. Log in as Standard user (adm-std@a.com)
2. Go to **Collections → Edit** on USA-History
- **Expected**: `✨ View/Edit Fabric Pattern` button is NOT visible

### Test 1-005: View pattern content
1. Log in as Premium admin
2. Go to **Collections → Edit** on USA-History
3. Click **✨ View/Edit Fabric Pattern**
- **Expected**: Modal opens with title `enhance_USA-History`
- **Expected**: Pattern text is populated (not empty, not "Loading...")
- **Expected**: Status shows "Pattern loaded from Fabric server."
- **Expected**: Pattern text contains collection-relevant content (topics, keywords from index cards)

### Test 1-006: Edit and save pattern
1. In the pattern modal, add a line to the pattern text: `# Test edit`
2. Click **Save to Fabric**
- **Expected**: Status shows `✅ Pattern saved to Fabric server.`
3. Close and reopen the modal
- **Expected**: Edited text is still there (persisted on Fabric)

### Test 1-007: View pattern for collection with no pattern
1. Click **✨ View/Edit Fabric Pattern** on a collection that has never been indexed
- **Expected**: Modal opens, textarea is empty
- **Expected**: Status shows "No pattern exists yet — generate one first or write your own."

### Test 1-008: Fabric not reachable
1. Temporarily set `FABRIC_URL` to an invalid URL in `.env-aips`
2. Restart backend
3. Click **✨ View/Edit Fabric Pattern**
- **Expected**: Status shows `⚠️ Could not reach Fabric server`
4. Restore correct URL and restart

---

## Section 2 — Enhance Prompt (AI Search Page)

### Test 2-001: Enhance button hidden when no collection selected
1. Go to **AI Search**
2. Do not select a collection
- **Expected**: `✨ Enhance Prompt` button is NOT visible

### Test 2-002: Enhance button appears when collection selected
1. Go to **AI Search**
2. Select **USA-History** from collection dropdown
- **Expected**: `✨ Enhance Prompt` button appears below the query input

### Test 2-003: Enhance button requires query
1. Select USA-History collection
2. Leave query field empty
3. Click **✨ Enhance Prompt**
- **Expected**: Error message "Please enter a query first"

### Test 2-004: Successful enhancement preview
1. Select USA-History collection
2. Enter query: `what were the founding principles`
3. Click **✨ Enhance Prompt**
- **Expected**: Button shows "Enhancing..." while processing
- **Expected**: Preview modal opens showing:
  - ORIGINAL: `what were the founding principles`
  - ENHANCED: A longer, structured version of the query
- **Expected**: Enhanced text is meaningfully different and more detailed than original

### Test 2-005: Use Enhanced replaces query
1. After Test 2-004, click **Use Enhanced**
- **Expected**: Modal closes
- **Expected**: Query input now contains the enhanced prompt text
- **Expected**: Original query is replaced

### Test 2-006: Cancel keeps original query
1. Repeat Test 2-004
2. Click **Cancel**
- **Expected**: Modal closes
- **Expected**: Query input still contains the original query

### Test 2-007: Run search with enhanced prompt
1. After using enhanced prompt (Test 2-005)
2. Select a model and click **Search Selected Methods**
- **Expected**: Search runs normally with the enhanced query
- **Expected**: Results are relevant to the original intent

### Test 2-008: Fallback when collection has no pattern
1. Select a collection that has no Fabric pattern
2. Enter a query and click **✨ Enhance Prompt**
- **Expected**: Enhancement still works (falls back to `improve_prompt` pattern)
- **Expected**: Modal shows enhanced result (may be less domain-specific)

### Test 2-009: Graceful degradation when Fabric unreachable
1. Temporarily break Fabric URL
2. Select collection, enter query, click **✨ Enhance Prompt**
- **Expected**: Warning message "Prompt enhancement unavailable — using original query"
- **Expected**: Query field unchanged
- **Expected**: No crash, page still functional

---

## Section 3 — Enhance Prompt (Search Page)

### Test 3-001: Enhance button hidden when no collection in scope
1. Go to **Search**
2. Select source type "Local Model Only" (no collection)
- **Expected**: `✨ Enhance Prompt` button is NOT visible

### Test 3-002: Enhance button appears when collection selected
1. Go to **Search**
2. Select source type that includes a collection
3. Select **USA-History**
- **Expected**: `✨ Enhance Prompt` button appears below the query textarea

### Test 3-003: Successful enhancement on Search page
1. Select USA-History collection
2. Enter query: `how was the constitution ratified`
3. Click **✨ Enhance Prompt**
- **Expected**: Preview modal opens with original and enhanced versions
- **Expected**: Enhanced version is more structured and detailed

### Test 3-004: Use Enhanced on Search page
1. After Test 3-003, click **Use Enhanced**
- **Expected**: Modal closes
- **Expected**: Query textarea contains the enhanced prompt

---

## Section 4 — Sensitive Collection Safety

### Test 4-001: Pattern for sensitive collection contains no PII
1. Run Process Source Files on Family-Documents collection
2. After completion, click **✨ View/Edit Fabric Pattern**
3. Read the pattern text carefully
- **Expected**: No patient names, family member names, account numbers, or specific dates
- **Expected**: Pattern contains only generic domain vocabulary (insurance, financial, medical, legal)
- **Expected**: No filenames referenced in the pattern

### Test 4-002: Enhancement of sensitive query
1. Go to **AI Search**, select Family-Documents
2. Enter query: `insurance policy`
3. Click **✨ Enhance Prompt**
- **Expected**: Enhanced prompt is domain-appropriate
- **Expected**: No PII added by the enhancement

---

## Section 5 — Edge Cases

### Test 5-001: Collection name with hyphens
1. Use a collection named `USA-History` (contains hyphen)
- **Expected**: Pattern name `enhance_USA-History` works correctly on all endpoints

### Test 5-002: Very long query
1. Enter a query of 1000+ characters
2. Click **✨ Enhance Prompt**
- **Expected**: Query is truncated to 1000 chars before sending to Fabric
- **Expected**: No server error

### Test 5-003: Special characters in query
1. Enter query with quotes, ampersands: `"founding fathers" & liberty`
2. Click **✨ Enhance Prompt**
- **Expected**: Enhancement works without error
- **Expected**: Special characters handled correctly

---

## Pass/Fail Tracking

| Test | Description | Result | Notes |
|------|-------------|--------|-------|
| 1-001 | Auto-generate pattern via Process Source Files | | |
| 1-002 | Pattern exists on Fabric server | | |
| 1-003 | View button visible to Premium | | |
| 1-004 | View button hidden from Standard | | |
| 1-005 | View pattern content | | |
| 1-006 | Edit and save pattern | | |
| 1-007 | No pattern state | | |
| 1-008 | Fabric unreachable (view) | | |
| 2-001 | Enhance button hidden (no collection) | | |
| 2-002 | Enhance button visible (collection selected) | | |
| 2-003 | Enhance requires query | | |
| 2-004 | Successful enhancement preview | | |
| 2-005 | Use Enhanced replaces query | | |
| 2-006 | Cancel keeps original | | |
| 2-007 | Search with enhanced prompt | | |
| 2-008 | Fallback — no collection pattern | | |
| 2-009 | Graceful degradation — Fabric down | | |
| 3-001 | Enhance hidden (no collection) on Search | | |
| 3-002 | Enhance visible (collection selected) on Search | | |
| 3-003 | Successful enhancement on Search page | | |
| 3-004 | Use Enhanced on Search page | | |
| 4-001 | Sensitive collection — no PII in pattern | | |
| 4-002 | Sensitive collection — safe enhancement | | |
| 5-001 | Collection name with hyphens | | |
| 5-002 | Very long query | | |
| 5-003 | Special characters in query | | |
