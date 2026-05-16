# AIPS Project Executive Summary

**Project**: AIPrivateSearch (AIPS)
**Repos**: aiprivatesearch v20.22 | aiprivatesearchcustmgr v2.06 | aiprivatesearchweb v1.60
**License**: CC BY-NC-ND | **Website**: AIPrivateSearch.com

---

## The Problem

Every time someone uses ChatGPT or a cloud search tool to find something in their documents, those files are uploaded to someone else's server. For a medical practice, a law firm, or anyone handling confidential information, that's an unacceptable risk.

Most professionals know they shouldn't be uploading patient records or client files to the cloud. But until now, the alternative was giving up the power of AI entirely.

---

## The Solution

AIPrivateSearch gives you AI-powered document search that runs entirely on your own computer. Your files never leave your machine. Not to us, not to anyone.

The AI runs locally using open-source models. There's no cloud upload, no per-query fees, and no privacy trade-offs. You get the same intelligence as cloud AI tools — with zero data exposure.

---

## Who It's For

| Market | The Risk They Face |
|--------|-------------------|
| Medical practices | Patient records, clinical notes — HIPAA exposure if uploaded to cloud |
| Law firms | Client files, contracts — confidentiality obligations at risk |
| Professional services | Sensitive client and business documents |
| Family / personal | Financial records, medical history — data they don't want handed to tech companies |
| Research | Academic and proprietary materials |

---

## What It Does

**AIPrivateSearch** — the core product — gives users seven ways to search their documents:
- Exact methods: find specific phrases, rank documents by topic, search AI-generated index cards
- AI methods: semantic search, hybrid search, direct AI answers, AI document chat

All AI processing runs locally via Ollama. No internet required once installed.

**AI Scoring** evaluates response quality automatically — Accuracy, Relevance, and Organization — using a second local model. No external scoring service.

**Document Collections** let users organize their files, generate vector embeddings for semantic search, and create AI-generated index cards per document.

---

## The Full Suite

AIPrivateSearch is delivered as three applications:

```
User discovers product
        ↓
aiprivatesearchweb — marketing site
  "Your files never leave your computer"
  → Get Started (60-day free trial)
        ↓
aiprivatesearchcustmgr — licensing backend
  Customer registration, Stripe payments
  Device licensing, trial management
        ↓
aiprivatesearch — core search app
  Runs entirely on the user's machine
  No document content ever leaves
```

| App | Role |
|-----|------|
| `aiprivatesearch` | The product users interact with daily |
| `aiprivatesearchcustmgr` | Licensing, subscriptions, payments, device management |
| `aiprivatesearchweb` | Public-facing site, lead generation, registration entry point |

---

## Pricing

| Tier | Price | Computers | Key Features |
|------|-------|-----------|-------------|
| Standard | $49/yr | 1 | Search, scoring, collections |
| Premium | $199/yr | 5 | + Model management, config editing, doc index editing |
| Professional | $2,999 one-time | Unlimited | Full access, all features |

All tiers include a **60-day free trial** — users can search their own documents before paying anything.

---

## Why We Win

- **Your files never leave your computer** — the only AI search tool that can make this claim
- **No per-query cost** — local models mean no API fees, ever
- **Works offline** — no internet required after setup
- **Model agnostic** — works with any Ollama-compatible model
- **7 search methods** — exact and AI methods in one platform
- **60-day free trial** — low barrier to try, high confidence to buy

---

## Current Status

| App | Version | Status |
|-----|---------|--------|
| aiprivatesearch | v20.22 | Production — all 7 search methods working, Fabric pipeline tested |
| aiprivatesearchcustmgr | v2.06 | Production — Stripe sandbox tested, go-live checklist pending |
| aiprivatesearchweb | v1.60 | Production — marketing site live |

---

## Near-Term Roadmap

- custmgr go-live: Stripe production keys, live customer onboarding
- Fabric integration into search UI (enhance button, graceful fallback)
- RAG upgrade: Level 2 → Level 4 (better semantic accuracy)
- HIPAA compliance hardening (encryption at rest, audit logs)
- Mobile-responsive design

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, HTML, CSS (no framework) |
| Backend | Node.js / Express (ES modules) |
| AI Models | Ollama (local, on-device) |
| Vector Search | LanceDB |
| Payments | Stripe |
| Database | MySQL |
| Prompt Enhancement | Fabric (optional) |
| Platform | macOS (tested on macOS 14+) |
