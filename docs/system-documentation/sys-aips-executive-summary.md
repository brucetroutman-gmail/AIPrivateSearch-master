# AIPrivateSearch Executive Summary

**Version**: 20.22 | **License**: CC BY-NC-ND | **Website**: AIPrivateSearch

---

## What It Is

AIPrivateSearch is a local-first AI document search platform. It enables professionals and individuals to search, analyze, and interact with their private documents using AI models that run entirely on their own machine — no data ever leaves the device.

---

## The Problem It Solves

Most AI search tools send your documents to cloud servers for processing. For medical practices, law firms, and anyone handling sensitive information, this is unacceptable. AIPrivateSearch solves this by running all AI processing locally via Ollama, giving users the power of AI search with complete data privacy.

---

## Key Capabilities

**7 Search Methods**
- Exact methods: Line Search, Document Search, Document Index Cards
- AI methods: Smart Search, Hybrid Search, AI Direct, AI Document Chat

**AI Scoring**
- Automated response quality evaluation on a 1-3 scale
- Weighted scoring: Accuracy (3x), Relevance (2x), Organization (1x)
- Uses a second local AI model — no external scoring service

**Document Collections**
- Organize documents into named collections
- Support for markdown, text, and PDF
- Vector embeddings for semantic search (LanceDB)
- AI-generated index cards per document

**Model Flexibility**
- Works with any Ollama model: qwen2, llama3.2, mistral, gemma2, phi3, and more
- Choose different models for search vs scoring

**Multi-Application Suite**
- `aiprivatesearch` — main search app
- `aiprivatesearchcustmgr` — customer and license management
- `aiprivatesearchweb` — marketing website

---

## Target Markets

| Market | Use Case |
|--------|----------|
| Medical practices | Patient records, clinical notes, HIPAA-compliant search |
| Law firms | Case files, contracts, legal research |
| Professional services | Policies, procedures, client documents |
| Family / personal | Personal records, financial documents, family history |
| Research | Academic papers, reference materials |

---

## Subscription Tiers

| Tier | Price | Computers | Key Features |
|------|-------|-----------|-------------|
| Standard | $49/yr | 1 | Search, scoring, collections |
| Premium | $199/yr | 5 | + Model management, config editing, doc index editing |
| Professional | $2,999 one-time | Unlimited | Full access, all features |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, HTML, CSS (no framework) |
| Backend | Node.js / Express |
| AI Models | Ollama (local) |
| Vector Search | LanceDB |
| Database | MySQL (optional, for test results) |
| Prompt Enhancement | Fabric (optional, via fabric.formr.net) |
| Platform | macOS (tested on macOS 12+) |

---

## Competitive Advantages

- **Privacy-first**: All processing on-device, zero cloud dependency for core features
- **No per-query cost**: Local models mean no API fees
- **7 search methods**: Exact and AI methods in one platform
- **Model agnostic**: Use any Ollama-compatible model
- **Open scoring**: Transparent weighted scoring methodology
- **CC BY-NC-ND license**: Source available, non-commercial use protected

---

## Current Status (v20.22)

✅ All 7 search methods implemented and tested
✅ Scoring system with weighted percentage output
✅ Document collections with indexing and embedding
✅ Role-based access control (tier + role)
✅ Session authentication
✅ MySQL result storage
✅ Focused search pages (Exact Search, AI Search)
✅ Fabric prompt enhancement pipeline (tested)
✅ Remote Mac deployment via update-aips.sh

---

## Near-Term Roadmap

- Fabric integration into search UI (enhance button, graceful fallback)
- RAG upgrade: Level 2 → Level 4 (hybrid search + cross-encoder reranking)
- User prompts by source type and collection
- Mobile-responsive design improvements
- Admin analytics dashboard

---

## Multi-App Architecture

```
aiprivatesearchweb          → Public marketing site
aiprivatesearch             → Core search application (this repo)
aiprivatesearchcustmgr      → Customer registration, licensing, payments
```

Config flows: `aiprivatesearchcustmgr` manages licenses → `aiprivatesearch` validates them locally.
