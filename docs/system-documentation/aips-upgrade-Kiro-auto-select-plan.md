# AIPrivateSearch Query Intelligence Layer — Implementation Plan

**Version**: 21.38  
**Created**: 2026-09-21  
**Status**: Ready for Implementation  
**Related Spec**: `aips-upgrade-Kiro-auto-select-spec.md`

---

## Overview

This document provides the step-by-step implementation plan for adding the Query Intelligence Layer to AIPrivateSearch. Follow this plan sequentially to ensure a smooth rollout with minimal risk.

**Goal**: Enable automatic query analysis, improvement, and search method selection while maintaining backward compatibility with existing test infrastructure.

**Total estimated time**: 8-10 hours across 3 phases

---

## Prerequisites

### Before Starting

- [ ] Read `aips-upgrade-Kiro-auto-select-spec.md` completely
- [ ] Ensure Ollama is running with `gemma2:2b` model available
- [ ] Verify current tests pass (run `test-collections.html` and `test-nodocuments.html`)
- [ ] Create a feature branch: `git checkout -b feature/query-intelligence-layer`
- [ ] Back up current `users.json` and `sessions.json` if running on production data

### Model Installation

```bash
# Verify gemma2:2b model is available (should already be installed)
ollama list | grep gemma2

# If not installed:
ollama pull gemma2:2b
```

### Baseline Testing

Run these tests and record results for comparison:

1. Open `test-collections.html`
2. Run test query: "which clients have durable power of attorney"
3. Note: search method used, results count, scores
4. Save results as baseline

---

## Phase 1: Backend Implementation (3-4 hours)

### Step 1.1: Create QueryAnalyzer Class

**File**: `server/s01_server-first-app/lib/search/QueryAnalyzer.mjs` (NEW)

**Actions**:
1. Create the file with full implementation from spec
2. Ensure security compliance:
   - No inline ESLint disables except documented ones
   - No fs operations (no `detect-non-literal-fs-filename` needed)
   - Use `logger.log()` for all logging (sanitization built-in)

**Code location**: See spec section "File 1: QueryAnalyzer.mjs"

**Testing**:
```bash
# Start the server to check for syntax errors
cd server/s01_server-first-app
node server.mjs
# Should start without errors

# Test the QueryAnalyzer directly
node -e "
import('./lib/search/QueryAnalyzer.mjs').then(async ({ QueryAnalyzer }) => {
  const analyzer = new QueryAnalyzer();
  const result = await analyzer.analyzeQuery('which clients have POA');
  console.log('Analysis:', result);
});
"
```

**Expected output**:
```json
{
  "type": "fact",
  "quality": "needs-improvement",
  "improved_query": "Which clients have power of attorney documents?",
  "reasoning": "Query is too vague, expanded for clarity"
}
```

**Checklist**:
- [ ] File created
- [ ] No syntax errors
- [ ] Test query returns valid JSON
- [ ] Imports work correctly
- [ ] Logger messages appear in console

---

### Step 1.2: Add Analyze-Query Endpoint

**File**: `server/s01_server-first-app/routes/search.mjs` (MODIFY)

**Actions**:
1. Add import at top: `import { QueryAnalyzer } from '../lib/search/QueryAnalyzer.mjs';`
2. Create instance: `const queryAnalyzer = new QueryAnalyzer();`
3. Add new endpoint AFTER the main POST route (see spec "File 6")

**Code location**: See spec section "File 6: Add Analyze Query Endpoint"

**Testing**:
```bash
# Test the endpoint with curl
curl -X POST http://localhost:3001/api/search/analyze-query \
  -H "Content-Type: application/json" \
  -d '{"query": "clients with POA"}'
```

**Expected output**:
```json
{
  "original": "clients with POA",
  "analysis": {
    "type": "fact",
    "quality": "needs-improvement",
    "improved_query": "Which clients have power of attorney documents?",
    "reasoning": "..."
  },
  "improved": {
    "original": "clients with POA",
    "enhanced": "Which clients have power of attorney documents?",
    "wasImproved": true,
    "reasoning": "..."
  },
  "recommendedMethod": "hybrid-search",
  "recommendedParams": {
    "temperature": 0.1,
    "topK": 10,
    "context": 4096,
    "systemPrompt": "..."
  }
}
```

**Checklist**:
- [ ] Endpoint responds
- [ ] Returns valid JSON
- [ ] Analysis type is correct
- [ ] Recommended method makes sense
- [ ] No server errors in logs

---

### Step 1.3: Integrate Intelligence Layer into Main Search Route

**File**: `server/s01_server-first-app/routes/search.mjs` (MODIFY)

**Actions**:
1. Locate the main `router.post('/', ...)` handler
2. Add Query Intelligence Layer section AFTER parameter extraction
3. Add test mode detection
4. Add conditional intelligence application
5. Add queryMetadata to response

**Code location**: See spec section "File 2: Modify search.mjs Route"

**CRITICAL**: Apply security corrections:
- Use `.textContent` not `.innerHTML` (this is server-side, but good practice)
- Ensure all user input is logged via `logger.log()` (already sanitized)
- Validate all analysis results before using them

**Testing**:
```bash
# Test 1: Regular search (intelligence enabled)
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "clients with POA",
    "collection": "Law-Office",
    "model": "gemma2:2b"
  }'
# Should auto-select hybrid-search and improve query

# Test 2: Test mode (intelligence disabled)
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "clients with POA",
    "collection": "Law-Office",
    "model": "gemma2:2b",
    "testCode": "TEST-001"
  }'
# Should use query as-is, no auto-selection

# Test 3: Manual method selection (partial intelligence)
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "clients with POA",
    "collection": "Law-Office",
    "model": "gemma2:2b",
    "searchType": "ai-document-chat"
  }'
# Should improve query but use specified method
```

**Checklist**:
- [ ] Test 1: Query improved, method auto-selected
- [ ] Test 2: Query unchanged, testMode flag in response
- [ ] Test 3: Query improved, user's method used
- [ ] Response includes `queryMetadata` object
- [ ] No errors in server logs
- [ ] Existing tests still pass

---

### Step 1.4: Verify Test Mode Bypass

**Actions**:
1. Run existing test page: `test-collections.html`
2. Verify test results match baseline from Prerequisites
3. Check that `queryMetadata.testMode === true` in responses
4. Confirm scores are comparable to previous runs

**Testing checklist**:
- [ ] Test page loads without errors
- [ ] Tests run with same queries as before
- [ ] Results are comparable (no major changes)
- [ ] `testCode` is preserved in response
- [ ] `intelligenceUsed: false` in metadata
- [ ] No unexpected query modifications

---

### Step 1.5: Backend Validation

**Run full backend test suite**:

```bash
# Test all query types
declare -a queries=(
  "which clients have durable power of attorney"
  "summarize all estate planning documents"
  "draft a cover letter"
  "clients POA"
  "how many wills signed 2024"
)

for query in "${queries[@]}"; do
  echo "Testing: $query"
  curl -s -X POST http://localhost:3001/api/search/analyze-query \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\"}" | jq '.analysis.type, .recommendedMethod'
  echo "---"
done
```

**Expected classifications**:
- "which clients..." → fact, hybrid-search
- "summarize all..." → analysis, ai-document-chat
- "draft a cover..." → creative, ai-document-chat
- "clients POA" → fact (improved), hybrid-search
- "how many..." → fact, hybrid-search

**Checklist**:
- [ ] All queries return valid responses
- [ ] Classifications are correct
- [ ] Method recommendations are appropriate
- [ ] No server crashes or errors
- [ ] Performance is acceptable (<5 seconds per query)

---

## Phase 2: Frontend Implementation (2-3 hours)

### Step 2.1: Add Styles to shared/styles.css

**File**: `client/c01_client-first-app/shared/styles.css` (MODIFY)

**Actions**:
1. Open the file
2. Scroll to end
3. Add all CSS from spec (corrected version, not inline styles)

**Code location**: See "Fix 1: Move CSS to shared/styles.css" in security corrections

**Styles to add**:
- `.mode-toggle` and related classes
- `.smart-search-details` and related classes
- `.hidden` utility class
- `.test-container`, `.result-card`, etc. for test page
- `.badge` and badge color variants

**Testing**:
```bash
# No syntax errors
# Styles should not break existing pages

# Visual check
open http://localhost:3000/search.html
# Page should look unchanged (styles not used yet)
```

**Checklist**:
- [ ] CSS added without syntax errors
- [ ] Existing pages load correctly
- [ ] No visual regressions
- [ ] `.hidden` class works (test with browser inspector)

---

### Step 2.2: Update search.html

**File**: `client/c01_client-first-app/search.html` (MODIFY)

**Actions**:
1. Add Search Mode toggle section (Auto/Advanced)
2. Wrap existing controls in `#manualControlsSection`
3. Add Smart Search Details display section
4. Use `class="hidden"` not inline styles

**Code location**: See spec section "File 3: Modify search.html UI" with security corrections

**SECURITY CORRECTIONS**:
- NO `<style>` blocks in HTML
- NO `style="display: none;"` inline styles
- USE `class="hidden"` for hidden elements
- ALL styles must be in `shared/styles.css`

**Testing**:
```bash
# Open in browser
open http://localhost:3000/search.html

# Verify structure
# - Mode toggle should be visible
# - Auto mode selected by default
# - Advanced controls hidden (class="hidden")
# - Smart Search Details hidden (class="hidden")
```

**Checklist**:
- [ ] Mode toggle renders correctly
- [ ] Auto selected by default
- [ ] Manual controls hidden initially
- [ ] Smart Search Details section exists but hidden
- [ ] No inline styles
- [ ] No console errors

---

### Step 2.3: Update search.js

**File**: `client/c01_client-first-app/search.js` (MODIFY)

**Actions**:
1. Add element references for new UI components
2. Add mode change handler
3. Modify form submit to include mode
4. Add `displayQueryMetadata()` function
5. Apply all security corrections

**Code location**: See spec section "File 4: Modify search.js" with security corrections

**SECURITY CORRECTIONS**:
- Replace ALL `.innerHTML` with `.textContent`
- Replace ALL `.style.display` with `.classList` operations
- Use `.classList.add('hidden')` and `.classList.remove('hidden')`
- No direct HTML string injection

**Key changes**:
```javascript
// WRONG
element.innerHTML = `<span>${data}</span>`;
element.style.display = 'none';

// RIGHT
element.textContent = data;
element.classList.add('hidden');
```

**Testing**:
```bash
# Test mode toggle
1. Open search.html
2. Click "Advanced" radio button
   → Manual controls should appear
3. Click "Auto" radio button
   → Manual controls should hide

# Test auto mode search
1. Enter query: "clients with POA"
2. Select collection: "Law-Office"
3. Leave mode on "Auto"
4. Submit search
5. Check Smart Search Details appears
6. Verify query improvement shown if applicable
```

**Checklist**:
- [ ] Mode toggle works (shows/hides manual controls)
- [ ] Auto mode sends `searchType: 'auto'`
- [ ] Advanced mode sends user-selected method
- [ ] Smart Search Details displays correctly
- [ ] Query metadata shown accurately
- [ ] No console errors
- [ ] No ESLint security warnings

---

### Step 2.4: Create Test Query Intelligence Page

**File**: `client/c01_client-first-app/test-query-intelligence.html` (NEW)

**Actions**:
1. Create new HTML file
2. Use shared header/footer
3. Reference `shared/styles.css` (not inline styles)
4. Implement test UI for query analyzer
5. Connect to `/api/search/analyze-query` endpoint

**Code location**: See spec section "File 5: Test Query Intelligence Page" with security corrections

**SECURITY CORRECTIONS**:
- NO `<style>` block in HTML
- Use `class="hidden"` for hidden sections
- All `.textContent` assignments, no `.innerHTML`
- Import shared styles only

**Testing**:
```bash
# Open test page
open http://localhost:3000/test-query-intelligence.html

# Test queries
1. "clients with POA"
   → Type: fact, Quality: needs-improvement, Improved version shown
2. "which clients have durable power of attorney documents"
   → Type: fact, Quality: good, No improvement
3. "summarize all estate plans"
   → Type: analysis, Method: ai-document-chat
4. "draft a cover letter"
   → Type: creative, Method: ai-document-chat
```

**Checklist**:
- [ ] Page loads without errors
- [ ] Test queries return analysis
- [ ] Results display correctly
- [ ] Badges show with correct colors
- [ ] Improvements shown when applicable
- [ ] Recommended methods make sense
- [ ] No inline styles
- [ ] No security warnings

---

### Step 2.5: Update ai-search.html and ai-search.js

**Files**: 
- `client/c01_client-first-app/ai-search.html` (MODIFY)
- `client/c01_client-first-app/ai-search.js` (MODIFY)

**Actions**:
Apply the same changes as `search.html` and `search.js`:
1. Add mode toggle
2. Add Smart Search Details section
3. Modify JS to handle auto/manual mode
4. Add metadata display

**Note**: The AI Search page may have different controls, but the pattern is the same.

**Testing**: Same as Steps 2.2 and 2.3 but on `ai-search.html`

**Checklist**:
- [ ] Mode toggle added
- [ ] Metadata display added
- [ ] Auto mode works
- [ ] No security violations
- [ ] No regressions

---

## Phase 3: Testing & Refinement (2 hours)

### Step 3.1: End-to-End Testing

**Test Scenario 1: Non-Technical User (Fact Query)**

```
User: Medical office staff
Query: "patients with diabetes"
Collection: Medical-Practice
Mode: Auto

Expected:
- Query improved or used as-is
- Method: hybrid-search
- Results: List of patient documents
- Smart Details: Shows fact-finding + hybrid-search
```

**Test Scenario 2: Non-Technical User (Analysis Query)**

```
User: Law firm paralegal
Query: "summarize Smith family estate plan"
Collection: Law-Office
Mode: Auto

Expected:
- Query used as-is (already good)
- Method: ai-document-chat
- Results: Comprehensive summary
- Smart Details: Shows analysis + ai-document-chat
```

**Test Scenario 3: Power User (Manual Override)**

```
User: Developer
Query: "clients with POA"
Collection: Law-Office
Mode: Advanced → Select "AI Document Chat"

Expected:
- Query improved
- Method: ai-document-chat (user's choice)
- Results: AI-generated response
- Smart Details: Shows query improved but method manual
```

**Test Scenario 4: Test Mode (Preserved Behavior)**

```
User: Running automated tests
Query: "clients with POA"
Collection: Law-Office
testCode: "TEST-001"

Expected:
- Query unchanged
- Method: As specified in test
- testMode: true in metadata
- Results comparable to baseline
```

**Checklist**:
- [ ] Scenario 1 passes
- [ ] Scenario 2 passes
- [ ] Scenario 3 passes
- [ ] Scenario 4 passes
- [ ] All results are sensible
- [ ] No errors in console or server logs

---

### Step 3.2: Performance Testing

**Measure latency impact**:

```bash
# Test 1: Regular search (no intelligence)
time curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "collection": "Law-Office", "model": "gemma2:2b", "testCode": "TEST", "searchType": "line-search"}'
# Note time: ~2-4 seconds

# Test 2: Auto mode (with intelligence)
time curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "clients with POA", "collection": "Law-Office", "model": "gemma2:2b"}'
# Note time: ~4-7 seconds

# Difference should be ~1-3 seconds (query analysis with gemma2:2b)
```

**Acceptable performance**:
- Query analysis: < 3 seconds
- Total search (analysis + search): < 12 seconds
- No memory leaks (run 20+ queries in sequence)

**Checklist**:
- [ ] Performance is acceptable
- [ ] No memory leaks observed
- [ ] Server remains responsive under load
- [ ] Analysis time logged correctly

---

### Step 3.3: Security Validation

**Run ESLint security checks**:

```bash
# From repo root
npm run lint:security

# Should pass with no new violations
```

**Manual security review**:

1. **No inline styles**: `grep -r 'style="' client/c01_client-first-app/*.html`
   - Should only return shared component files, not new code

2. **No innerHTML**: `grep -r '\.innerHTML' client/c01_client-first-app/*.js`
   - Should not include new search.js or ai-search.js

3. **No direct style.display**: `grep -r '\.style\.display' client/c01_client-first-app/*.js`
   - Should not include new code

4. **Proper logging**: All `logger.log()` calls automatically sanitize
   - Verify in QueryAnalyzer.mjs

**Checklist**:
- [ ] ESLint passes
- [ ] No inline styles in new code
- [ ] No innerHTML in new code
- [ ] No style.display manipulation
- [ ] All logging uses sanitized logger
- [ ] No new security warnings

---

### Step 3.4: Regression Testing

**Run existing test suite**:

1. Open `test-collections.html`
2. Run all existing tests
3. Compare results to baseline (from Prerequisites)
4. Verify:
   - Same queries return similar results
   - Scores are comparable
   - No unexpected changes in behavior

**Specific tests**:

```
Test 1: "which clients have durable power of attorney"
- testCode: "TEST-001"
- Collection: Law-Office
- Method: hybrid-search
- Expected: Results match baseline

Test 2: Same query WITHOUT testCode
- Collection: Law-Office  
- Mode: Auto
- Expected: Query improved, hybrid-search selected, better results

Test 3: "summarize estate plans"
- testCode: "TEST-002"
- Collection: Law-Office
- Method: ai-document-chat
- Expected: Results match baseline
```

**Checklist**:
- [ ] All existing tests pass
- [ ] Test results comparable to baseline
- [ ] No regressions in functionality
- [ ] Test mode properly bypasses intelligence
- [ ] Auto mode improves results

---

### Step 3.5: User Acceptance Preview

**Create preview demo**:

1. Prepare 5 sample queries (fact, analysis, creative, vague, good)
2. Run each in Auto mode
3. Document what happened (query improvement, method selection, results quality)
4. Take screenshots of Smart Search Details

**Demo script**:

```
Query 1: "clients POA" (vague fact query)
- Shows: "Improved to: Which clients have power of attorney documents?"
- Method: Hybrid Search
- Results: List of clients

Query 2: "which clients have durable power of attorney documents" (good fact query)
- Shows: "Query used as written (already clear)"
- Method: Hybrid Search
- Results: Precise list

Query 3: "summarize all trust documents" (analysis)
- Shows: "Query type: Analysis"
- Method: AI Document Chat
- Results: Comprehensive summary

Query 4: "draft introduction letter for new client" (creative)
- Shows: "Query type: Content generation"
- Method: AI Document Chat
- Results: Generated letter

Query 5: "estate" (very vague)
- Shows: "Improved to: What information about estate planning documents is available?"
- Method: Hybrid Search
- Results: Broad overview
```

**Checklist**:
- [ ] All demo queries work
- [ ] Improvements are sensible
- [ ] Method selections appropriate
- [ ] Results quality is good
- [ ] Screenshots captured
- [ ] Ready for stakeholder demo

---

## Phase 4: Documentation & Rollout (1 hour)

### Step 4.1: Update User Documentation

**Files to update**:

1. **`sys-aips-user-guide.md`**
   - Add section: "Using Auto Mode"
   - Explain Auto vs Advanced toggle
   - When to use which mode

2. **`sys-aips-search-methods.md`**
   - Add section: "Automatic Method Selection"
   - Query type classification explanation
   - Override instructions

3. **`sys-aips-troubleshooting.md`**
   - "Auto mode selected wrong method" → Use Advanced mode
   - "Query was changed but I want original" → See Smart Search Details
   - "Search is slower" → Query analysis adds 2-5 seconds

**Checklist**:
- [ ] User guide updated
- [ ] Search methods doc updated
- [ ] Troubleshooting doc updated
- [ ] Examples added
- [ ] Clear screenshots included

---

### Step 4.2: Update Developer Documentation

**Files to update**:

1. **`sys-aips-api.md`**
   - Document `searchType: 'auto'` option
   - Document `queryMetadata` response field
   - Document `/analyze-query` endpoint
   - Document `testMode` behavior

2. **`sys-aips-architecture.md`**
   - Add Query Intelligence Layer to architecture diagram
   - Document QueryAnalyzer component
   - Show data flow with intelligence layer

3. **`sys-aips-changelog.md`**
   - Add entry for version 21.39 (or next version)
   - List: Query Intelligence Layer added
   - Note: Auto mode, query improvement, smart method selection

**Checklist**:
- [ ] API documentation updated
- [ ] Architecture doc updated with diagram
- [ ] Changelog entry added
- [ ] Version number bumped

---

### Step 4.3: Prepare Release Notes

**Create**: `RELEASE_NOTES_v21.39.md` (or appropriate version)

**Content**:

```markdown
# Release v21.39 - Query Intelligence Layer

## New Features

### 🤖 Auto Mode (Smart Search)
Non-technical users can now use "Auto mode" which:
- Automatically detects if you're looking for facts, analysis, or creative content
- Improves vague queries to be more specific
- Selects the best search method automatically
- Configures optimal settings (temperature, topK, context)

### Query Improvement
System now recognizes unclear queries and enhances them:
- "clients POA" → "Which clients have power of attorney documents?"
- Shows original and improved versions transparently

### Smart Search Details
After each search, see what the system did:
- Query type detected
- Search method selected
- Parameters configured
- Why query was improved (if applicable)

## For Power Users

### Advanced Mode
Power users can still manually configure everything:
- Toggle "Advanced" mode to see all controls
- Manually select search method
- Set temperature, topK, context manually
- Override any auto-selection

## For Developers

### Test Mode Preserved
All existing tests continue to work unchanged:
- Queries with `testCode` bypass intelligence layer
- Ensures test result comparability
- No impact on automated testing

### New API Endpoint
`POST /api/search/analyze-query` - Analyze query without searching:
- Returns query type classification
- Returns improvement suggestions
- Returns recommended method and parameters

## Breaking Changes
None. Fully backward compatible.

## Migration Notes
No migration needed. Feature is opt-in via Auto mode toggle.
```

**Checklist**:
- [ ] Release notes written
- [ ] Feature highlights clear
- [ ] Migration notes (none needed)
- [ ] Breaking changes (none)

---

### Step 4.4: Create Rollout Plan

**Week 1: Silent Deploy (Backend Only)**
- Deploy backend changes to production
- Auto mode NOT yet default in UI
- Monitor error rates and performance
- Watch for query analysis failures

**Week 2: Opt-In (UI with Manual Default)**
- Deploy UI changes
- Default remains "Advanced" mode
- Add banner: "Try Auto mode for smarter searches"
- Collect early user feedback

**Week 3: Gradual Rollout (Auto Mode Default)**
- Change default to "Auto" mode
- Advanced mode still easily accessible
- Monitor usage patterns:
  - How many users stick with Auto?
  - How many switch to Advanced?
  - What queries are improved most?

**Week 4: Full Rollout & Optimization**
- Analyze query patterns from Week 3
- Refine routing rules if needed
- Update analysis prompt based on real queries
- Document common query improvements
- Create FAQ based on user questions

**Metrics to track**:
- % of searches using Auto mode
- % of queries improved
- % of auto-selections overridden by users
- Average query analysis time
- User satisfaction feedback

**Checklist**:
- [ ] Rollout plan documented
- [ ] Metrics tracking set up
- [ ] Monitoring dashboards ready
- [ ] Rollback plan prepared

---

## Rollback Plan

### If Critical Issues Found

**Immediate rollback** (< 5 minutes):

```bash
# Option 1: Disable intelligence via environment variable
# Add to .env-aips file:
echo "DISABLE_QUERY_INTELLIGENCE=true" >> /Users/Shared/AIPrivateSearch/.env-aips

# Then in server.mjs, check at startup:
const INTELLIGENCE_DISABLED = process.env.DISABLE_QUERY_INTELLIGENCE === 'true';

# Option 2: Revert to previous git commit
git log --oneline | head -5  # Find commit before feature
git revert <commit-hash>
npm run start

# Option 3: Change UI default back to Advanced
# In search.html, change:
<input type="radio" id="modeManual" name="searchMode" value="manual" checked>
```

**Partial rollback** (disable specific components):

1. Keep backend but disable auto mode in UI → users must use Advanced
2. Keep auto mode but disable query improvement → auto-selection only
3. Keep everything but increase analysis timeout → fail fast on slow queries

**Checklist**:
- [ ] Rollback procedures documented
- [ ] Environment variable approach tested
- [ ] Revert commits identified
- [ ] Team knows rollback steps

---

## Post-Implementation Tasks

### Week 1 After Launch

- [ ] Monitor error logs daily
- [ ] Check query analysis success rate
- [ ] Review first user feedback
- [ ] Document common issues in troubleshooting
- [ ] Adjust analysis prompt if needed

### Week 2 After Launch

- [ ] Analyze query patterns
- [ ] Identify most common query types
- [ ] Refine classification rules if needed
- [ ] Check performance metrics vs. targets
- [ ] Create usage report

### Week 3 After Launch

- [ ] User survey: "Did Auto mode help?"
- [ ] Review override patterns (when users switch to Advanced)
- [ ] Document best practices for query writing
- [ ] Plan Phase 2 enhancements

### Month 1 After Launch

- [ ] Complete usage analysis
- [ ] Write lessons learned document
- [ ] Identify optimization opportunities
- [ ] Plan next features:
  - Learning from user overrides
  - Query templates
  - Multi-stage search
  - Query history personalization

---

## Success Criteria

### Must Have (Launch Blockers)

- [ ] All backend tests pass
- [ ] All frontend pages load without errors
- [ ] Test mode preserves existing test behavior
- [ ] Auto mode works for sample queries
- [ ] No security violations (ESLint passes)
- [ ] Performance < 15 seconds total search time
- [ ] Documentation updated

### Should Have (Launch Goals)

- [ ] Query improvement rate > 30%
- [ ] Auto-selection accuracy > 85%
- [ ] User adoption of Auto mode > 50%
- [ ] No increase in "no results" complaints
- [ ] Performance < 10 seconds average

### Nice to Have (Future Goals)

- [ ] User adoption of Auto mode > 70%
- [ ] Auto-selection accuracy > 90%
- [ ] Performance < 8 seconds average
- [ ] Positive user feedback in surveys
- [ ] Reduced support tickets

---

## Risk Assessment

### High Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Analysis model not available | Search fails | Low | Fallback to defaults on error |
| Bad query improvements | Poor results | Medium | Show original, allow override |
| Performance too slow | User frustration | Medium | Use fast model, cache results |
| Test mode breaks | Test inconsistency | Low | Simple detection logic |

### Medium Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users don't understand Auto mode | Low adoption | Medium | Clear documentation, examples |
| Security violations | Deployment blocked | Low | ESLint pre-commit hooks |
| Auto-selection wrong | User override | Medium | Easy Advanced mode access |

### Low Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CSS conflicts | Visual issues | Low | Namespaced class names |
| Browser compatibility | Some users affected | Low | Use standard CSS/JS |
| Memory leaks | Server instability | Low | Proper cleanup in analyzer |

---

## Team Communication

### Daily Standups During Implementation

**What to report**:
- Which phase/step currently working on
- Any blockers encountered
- Any deviations from plan
- Estimated completion time

### Code Review Checklist

When submitting PR:
- [ ] All files from spec included
- [ ] Security corrections applied
- [ ] Tests pass locally
- [ ] ESLint passes
- [ ] Documentation updated
- [ ] Screenshots of UI changes
- [ ] Performance measured

### Stakeholder Updates

**After Phase 1** (backend complete):
- Demo analyze-query endpoint
- Show query classification working
- Demonstrate test mode bypass
- Confirm timeline for Phase 2

**After Phase 2** (frontend complete):
- Demo Auto mode UI
- Show query improvement in action
- Demo Smart Search Details
- Schedule UAT session

**After Phase 3** (testing complete):
- Share test results
- Review performance metrics
- Present rollout plan
- Get approval to deploy

---

## Appendix A: Quick Reference Commands

### Start/Stop Server
```bash
cd server/s01_server-first-app
node server.mjs  # Start
# Ctrl+C to stop
```

### Test Query Analysis
```bash
curl -X POST http://localhost:3001/api/search/analyze-query \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR_QUERY_HERE"}'
```

### Run Security Checks
```bash
npm run lint:security
```

### View Server Logs
```bash
tail -f server/s01_server-first-app/server.log
```

### Check Ollama Model
```bash
ollama list | grep gemma2
ollama run gemma2:2b "test"  # Quick test
```

### Clear Browser Cache
```bash
# Chrome: Cmd+Shift+Delete, select cache
# Or run your clear-browser-cache.sh script
./clear-browser-cache.sh
```

---

## Appendix B: Troubleshooting Common Issues

### Issue: Query analysis returns "unknown" type

**Symptom**: All queries classified as "unknown"

**Causes**:
- Model not responding
- JSON parsing failed
- Model returning non-JSON

**Fix**:
```bash
# Test model directly
ollama run gemma2:2b "Classify this query: which clients have POA. Return JSON only."

# Check server logs for parse errors
tail -f server/s01_server-first-app/server.log | grep QueryAnalyzer
```

### Issue: Auto mode not showing in UI

**Symptom**: Toggle not visible

**Causes**:
- HTML not updated
- CSS not loaded
- JavaScript error preventing render

**Fix**:
```bash
# Check browser console for errors
# Verify CSS loaded: inspect element, look for .mode-toggle styles
# Check HTML has mode toggle section
```

### Issue: Smart Search Details not appearing

**Symptom**: No metadata display after search

**Causes**:
- Response missing queryMetadata
- displayQueryMetadata() not called
- Element ID mismatch

**Fix**:
```javascript
// In browser console after search
console.log(lastSearchResult.queryMetadata);
// Should show intelligenceUsed, detectedType, etc.

// Check element exists
document.getElementById('smartSearchInfo');
// Should not be null
```

### Issue: Test mode not working

**Symptom**: Tests get query improvements when they shouldn't

**Causes**:
- testCode not being sent
- isTestMode detection failing
- Condition logic error

**Fix**:
```javascript
// In route handler, add debug log
console.log('testCode:', testCode, 'isTestMode:', isTestMode);

// Should show:
// testCode: "TEST-001" isTestMode: true
```

### Issue: Performance too slow

**Symptom**: Searches taking > 15 seconds

**Causes**:
- Analysis model slow to load
- Network issues with Ollama
- Model context too large

**Fix**:
```bash
# Check Ollama response time
time curl http://localhost:11434/api/generate \
  -d '{"model":"gemma2:2b","prompt":"test"}'
# Should be < 2 seconds

# Reduce context in QueryAnalyzer.mjs if needed
# Change num_ctx: 2048 to num_ctx: 1024
```

---

## Appendix C: File Change Summary

### Files Created (4)
1. `server/s01_server-first-app/lib/search/QueryAnalyzer.mjs`
2. `client/c01_client-first-app/test-query-intelligence.html`
3. `docs/system-documentation/aips-upgrade-Kiro-auto-select-spec.md` (reference doc)
4. `docs/system-documentation/aips-upgrade-Kiro-auto-select-plan.md` (this file)

### Files Modified (6)
1. `server/s01_server-first-app/routes/search.mjs` - Add analyzer, endpoint, intelligence layer
2. `client/c01_client-first-app/shared/styles.css` - Add mode toggle and details styles
3. `client/c01_client-first-app/search.html` - Add mode toggle and details sections
4. `client/c01_client-first-app/search.js` - Add mode handling and metadata display
5. `client/c01_client-first-app/ai-search.html` - Same as search.html
6. `client/c01_client-first-app/ai-search.js` - Same as search.js

### Files Updated (Documentation) (3)
1. `docs/system-documentation/sys-aips-user-guide.md`
2. `docs/system-documentation/sys-aips-search-methods.md`
3. `docs/system-documentation/sys-aips-api.md`

### Total: 13 files

---

## Sign-Off

### Implementation Team

- [ ] **Backend Developer**: Phase 1 complete, tested, documented
- [ ] **Frontend Developer**: Phase 2 complete, tested, documented  
- [ ] **QA Engineer**: Phase 3 complete, all tests pass
- [ ] **Tech Lead**: Code review complete, approve to deploy

### Stakeholders

- [ ] **Product Owner**: Features meet requirements
- [ ] **UX Designer**: UI changes approved
- [ ] **Security Lead**: No security violations
- [ ] **Operations**: Ready to deploy, monitoring in place

### Final Approval

- [ ] **Project Manager**: All phases complete, ready for rollout

**Date**: _________________  
**Approved by**: _________________  
**Next action**: Deploy to production per rollout plan

---

**End of Implementation Plan**
