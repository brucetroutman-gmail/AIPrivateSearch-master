# AIPrivateSearch Changelog

All notable changes to this project are documented here.
Format: `vMAJOR.MINOR: Description`

---

## v20.22 (current)
- Unified footer: index.html now uses shared footer.html
- Removed hardcoded footer and Team members section from index.html
- Added app-version span to custmgr and web app footers
- Added .env-aips to .gitignore

## v20.21
- Fixed menu: reverted to inline style display approach
- Updated nav links to exact-search.html and ai-search.html
- Removed dead .menu-exact-search / .menu-ai-search CSS classes from tier-access.json
- Added dual CSS classes to nav elements for forward compatibility

## v20.20
- Added Exact Search page (exact-search.html): Multi-Mode layout, Non-AI methods only
- Added AI Search page (ai-search.html): Multi-Mode layout, AI methods only
- Updated menu to use new focused pages
- Fabric+Ollama pipeline tested and working
- Updated tier access manager and license checker to use classList

## v20.19
- Enhanced Fabric integration plan: PII safety, sanitized domain templates
- Added resilience patterns, circuit breaker, graceful degradation
- Created safeDomainContext.json, pattern versioning docs

## v20.18
- Completed Fabric server install on formr (systemd, port 8081, fabric.formr.net)
- Line Search scoring improvements: deduplication, AND default, max 50 results
- Added aips-fabric-install.md and aips-fabric-integration.md

## v20.17
- Line Search enhancements: result deduplication (merge adjacent matches within 4 lines)
- QueryProcessor default changed from OR to AND
- Max 50 results cap
- Added version number to app footer

## v20.16
- Unified document viewer highlighting across all search types
- Always-on wildcard matching for Line Search, Document Search, Document Index Cards
- Removed wildcard checkbox UI
- Show first 5 results with expandable "Show all X results" link
- Fixed search page rendering to match multi-mode path
- Document Index excerpt highlighting fix
- Added update-aips.sh for remote Mac deployment

## v20.15
- Fixed device registration: removed dead create-license call
- Unified document viewer: server /view endpoint accepts ?search=term
- LineSearch documentPath changed to relative URL with &search= param
- commonResultFormatter.js passes window._lastSearchQuery to all document links
- 2-004 multi-search test plan: 14 steps, 12 passed

## v20.00 – v20.14
- Major version 20: licensing system, tier access, role-based menu visibility
- MySQL integration for test result storage
- Multi-mode search page with 7 search methods
- Document collections management
- Scoring system: 1-3 scale, weighted (Accuracy 3x, Relevance 2x, Organization 1x)
- Session-based authentication
- ESLint security hooks

---

## Version Numbering
- Minor bump: `release` → increments by 0.01 (e.g. 20.21 → 20.22)
- Major bump: `release N` → sets to N.00 (e.g. `release 21` → 21.00)
