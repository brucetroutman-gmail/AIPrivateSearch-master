# AIPrivateSearch Architecture

## System Overview

AIPrivateSearch is a local-first AI document search platform. All AI processing runs on-device via Ollama — no data leaves the machine.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                       │
│  (Vanilla JS, HTML, CSS — served as static files)        │
│                                                          │
│  exact-search.html  │  ai-search.html  │  index.html     │
│  collections.html   │  options.html    │  ...            │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP (localhost:3000)
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js / Express Backend                   │
│              (server/s01_server-first-app)               │
│                                                          │
│  Routes:                                                 │
│  /api/search          /api/multi-search                  │
│  /api/documents       /api/models                        │
│  /api/database        /api/config                        │
│  /api/auth            /api/license                       │
└──────┬──────────────────────┬───────────────────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐      ┌────────────────┐
│   Ollama    │      │     MySQL      │
│ (port 11434)│      │  (optional)    │
│             │      │                │
│ AI Models:  │      │ test_results   │
│ qwen2:0.5b  │      │ users          │
│ qwen2.5:3b  │      │ sessions       │
│ llama3.2:3b │      │ licenses       │
│ mistral:7b  │      └────────────────┘
│ gemma2:2b   │
│ phi3:3.8b   │
└─────────────┘
```

---

## Directory Structure

```
aiprivatesearch/
├── client/c01_client-first-app/    # Frontend
│   ├── shared/
│   │   ├── header.html             # Shared nav (loaded by common.js)
│   │   ├── footer.html             # Shared footer with version number
│   │   ├── common.js               # Shared JS: auth, menu, header/footer load
│   │   ├── styles.css              # Global styles
│   │   └── utils/
│   │       ├── tierAccessManager.js
│   │       └── ...
│   ├── config/                     # JSON config files (template)
│   │   ├── app.json                # App name, ports, feature flags
│   │   ├── tier-access.json        # Role/tier CSS show/hide rules
│   │   ├── models-list.json        # Available Ollama models
│   │   └── ...
│   ├── exact-search.html           # Exact match methods only
│   ├── ai-search.html              # AI methods only
│   ├── multi-mode-search.html      # All 7 methods
│   ├── multi-mode-search.js        # Shared JS for all 3 search pages
│   └── ...
│
├── server/s01_server-first-app/    # Backend
│   ├── server.mjs                  # Express app entry point
│   ├── routes/
│   │   ├── search.mjs
│   │   ├── multiSearch.mjs
│   │   ├── documents.mjs
│   │   ├── models.mjs
│   │   ├── database.mjs
│   │   ├── config.mjs
│   │   └── auth.mjs
│   └── lib/
│       ├── search/
│       │   ├── LineSearch.mjs
│       │   ├── DocumentSearch.mjs
│       │   ├── SmartSearch.mjs
│       │   ├── HybridSearch.mjs
│       │   ├── AIDirectSearch.mjs
│       │   ├── AIDocumentChat.mjs
│       │   └── DocumentIndexSearch.mjs
│       ├── utils/
│       │   ├── queryProcessor.mjs  # AND/OR/wildcard query parsing
│       │   ├── highlightFormatter.mjs
│       │   ├── excerptFormatter.mjs
│       │   └── ...
│       └── services/
│           └── AppConfig.mjs       # Reads config from /Users/Shared/AIPrivateSearch/config/
│
├── sources/local-documents/        # Document collections
│   └── [collection-name]/          # One folder per collection
│
├── data/                           # Runtime data (sessions, users)
├── docs/system-documentation/      # All project docs
└── security/                       # ESLint security config
```

---

## Config Location

The server reads config from `/Users/Shared/AIPrivateSearch/config/` — NOT from the repo.

- Repo `client/c01_client-first-app/config/` is the template
- Release process syncs: parent config → repo
- `Start App` (via `aiprivatesearch.app`) syncs: repo → remote Mac parent config

---

## 7 Search Methods

| Method | Type | Description |
|--------|------|-------------|
| Line Search | Exact | Line-by-line text matching with AND logic, wildcards, deduplication |
| Document Search | Exact | Indexed full-text search with ranking and stemming |
| Document Index Cards | Exact | Structured metadata queries against document index |
| Smart Search | AI | Semantic similarity using LanceDB embeddings |
| Hybrid Search | AI | Combined keyword + semantic scoring |
| AI Direct | AI | Direct Ollama model response, no document context |
| AI Document Chat | AI | Ollama response with retrieved document chunks as context |

---

## Authentication & Authorization

- Email-based session authentication
- Sessions stored in `data/sessions.json`
- Tier system: Standard (1), Premium (2), Professional (3)
- Role system: admin, searcher
- Menu visibility controlled by `tier-access.json` CSS show/hide rules
- `tierAccessManager.js` applies rules client-side on page load
- Server enforces auth via `requireAuth` middleware on all API routes

---

## Scoring System

Optional AI-powered response scoring using a second Ollama model:

| Criterion | Weight | Scale |
|-----------|--------|-------|
| Accuracy | 3x | 1-3 |
| Relevance | 2x | 1-3 |
| Organization | 1x | 1-3 |

Weighted percentage = `(accuracy×3 + relevance×2 + organization×1) / 18 × 100`

---

## Key Design Decisions

- **Vanilla JS frontend** — no framework, fast load, easy to maintain
- **Static file serving** — frontend served directly by Express, no build step
- **Config outside repo** — allows config changes without git commits on deployed machines
- **Ollama local** — installed at `/Users/Shared/AIPrivateSearch/ollama`, added to PATH via `~/.zshrc`
- **MySQL optional** — app works without it; only needed for test result persistence
- **Fabric integration** — optional prompt enhancement via `https://fabric.formr.net` (Ubuntu server, port 8081, systemd)

---

## Ports

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Local dev | 3000 | 3001 |
| Remote Mac | 56305 | 56306 |
