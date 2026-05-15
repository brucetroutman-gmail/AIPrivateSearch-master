# AIPrivateSearch Product Roadmap

**Version**: 20.22 | **Last Updated**: 2025

---

## Vision

AIPrivateSearch becomes the standard tool for private AI document search in regulated industries — medical, legal, and professional services — where data privacy is non-negotiable.

---

## Current State (v20.22)

✅ 7 search methods (exact + AI)
✅ Focused pages: Exact Search, AI Search
✅ AI scoring with weighted percentage
✅ Document collections with indexing and embedding
✅ Role-based access control (tier + role)
✅ Session authentication
✅ MySQL result storage
✅ Fabric prompt enhancement pipeline (tested, not yet in UI)
✅ Remote Mac deployment
✅ Multi-app suite (search, custmgr, web)

---

## Near-Term (v20.x)

### Fabric Integration (2-047)
Bring the tested Fabric+Ollama pipeline into the search UI.

**Phase 1 — Core**
- `FabricService.mjs` with timeout, retry, circuit breaker
- "Enhance" button on AI Search with spinner and cancel
- Graceful fallback to standard prompt if Fabric unreachable
- `fabricEnabled` toggle in `app.json`

**Phase 2 — Pattern Management**
- `safeDomainContext.json` — sanitized domain templates per collection
- Auto-generate Fabric patterns when collections are created/updated
- "Generate Pattern" button in Collections

**Phase 3 — Polish**
- Enhance level selector (Concise / Balanced / Thorough)
- Before/after diff of enhanced prompt
- Auto-enhance toggle per collection

### Search Quality
- Fix Smart Search to return only matches (2-006)
- Consistent "View Document" links across all search types (2-007)
- User prompts by source type, collection, and search type (2-019, 2-020, 2-021)
- Test multi prompts and ASCII/Unicode character handling (2-005)

### RAG Upgrade: Level 2 → Level 4 (2-045)
Current RAG is Level 2 (basic semantic search). Target Level 4:
- Hybrid search: semantic + BM25 keyword matching with alpha tuning
- Cross-encoder reranking — improves "correct chunk in top 3" from ~68% to ~89%
- Confidence scoring for production reliability
- Priority order: reranking first (biggest gain), then hybrid, then confidence thresholds

---

## Medium-Term (v21.x)

### User Experience
- Mobile-responsive design (2-013)
- Search history and saved searches (2-016)
- Bulk document upload with progress indicators (2-017)
- Keyboard shortcuts for power users (2-014)
- User onboarding tutorial/wizard (2-015)
- Search result export — PDF/CSV (2-026)

### Analytics & Monitoring
- Admin dashboard with usage analytics (2-024)
- Privacy-compliant usage telemetry (2-025)
- Backup/restore for user data and collections (2-027)

### Performance
- Search result caching (2-022)
- Chunking strategy review — optimize chunk size for small/large documents (2-009)
- DocumentSearch performance optimization with testCodes (2-008)

---

## Long-Term (v22.x+)

### Enterprise Features
- Multi-user collaboration on collections
- EHR and practice management system integrations
- Advanced audit trails and compliance reporting
- HIPAA certification documentation

### Platform Expansion
- Windows support
- Linux support
- Cloud-hybrid option (local processing, cloud sync for settings/metadata only)

### Business
- Partner program for medical/legal resellers (2-039)
- Case studies for medical practices and law firms (2-040)
- Competitive analysis and positioning (2-038)
- Professional product screenshots and demo videos (2-029)

---

## Completed Milestones

| Version | Key Achievement |
|---------|----------------|
| v20.22 | Unified footer, version display on all pages |
| v20.21 | Menu fix — inline style approach, exact/ai search pages working |
| v20.20 | Exact Search + AI Search focused pages, Fabric pipeline tested |
| v20.18 | Fabric server on formr (systemd), Line Search improvements |
| v20.16 | Unified highlighting, always-on wildcards, show-first-5 results |
| v20.15 | Device registration fix, document viewer highlighting |
| v20.13 | Full automated installer (Node, Ollama, Chrome, models) |
| v20.05 | Public IP collection during device registration |
| v20.02 | Fast device identification (PC code from serial number) |
| v20.00 | Session timeout fix, stable authentication |
| v19.95 | Device-based licensing (replaced JWT) |
| v19.88 | Role-based access control, user management |

---

## Prioritization Principles

1. **Stability first** — fix known issues before adding features
2. **Search quality** — improvements to core search accuracy have highest ROI
3. **User experience** — reduce friction for non-technical users
4. **Business enablement** — features that support sales and customer retention
5. **Platform expansion** — only after core is solid
