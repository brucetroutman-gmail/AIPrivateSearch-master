# AIPrivateSearch Security Guide

**Version**: 20.22

---

## Security Model

AIPrivateSearch is a local-first application. All AI processing runs on-device via Ollama — no document content or queries are sent to external services. The primary security surface is the local network and session management.

---

## Authentication Flow

Every page load follows this sequence:

1. `common.js` DOMContentLoaded fires
2. `AuthUtils.requireAuth()` checks `localStorage` for `sessionId`
3. Session validated against backend: `GET /api/auth/me` with `Authorization: Bearer <sessionId>`
4. If invalid → redirect to login page
5. If valid → user role and tier loaded, menu visibility applied

### Session storage
- Sessions stored server-side in `data/sessions.json`
- `sessionId` stored client-side in `localStorage`
- No passwords — email-based authentication only

### Server-side middleware
All API routes (except `/api/auth/*` and `/api/license/*`) require `requireAuth` middleware:
```javascript
export async function requireAuth(req, res, next) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) return res.status(401).json({ error: 'Authentication required' });
  const user = await userManager.validateSession(sessionId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  req.user = user;
  next();
}
```

---

## Authorization — Tier & Role System

### Tiers
| Tier | Name | Description |
|------|------|-------------|
| 1 | Standard | Basic search and scoring |
| 2 | Premium | + model management, config editing, doc index editing |
| 3 | Professional | Full access |

### Roles
| Role | Description |
|------|-------------|
| admin | User management, all tier features |
| searcher | Search and collections only |

### Menu visibility
- Menu items start hidden via `style="display:none"` in `header.html`
- `tierAccessManager.js` reads `tier-access.json` and shows/hides elements by CSS class
- Server enforces auth independently — client-side visibility is UX only, not a security boundary

---

## Input Validation & XSS Prevention

### DOM manipulation
All user input rendered via `textContent` or `setAttribute` — never `innerHTML` with raw user data.

### File path validation
All file operations validate paths against directory traversal:
- Paths resolved and checked to be within allowed directories
- Filenames validated before config or document operations

### Query sanitization
- Search queries sanitized before passing to search engines
- File upload restricted to allowed MIME types

---

## Rate Limiting

| Endpoint group | Limit |
|----------------|-------|
| Search | 30 req / 60s |
| Models | 10 req / 60s |
| Database save | 50 req / 60s |
| Database read | 20 req / 60s |

---

## Environment Variables & Secrets

- `.env-aips` lives at `/Users/Shared/AIPrivateSearch/.env-aips` — never in repo
- `.gitignore` includes `.env` and `.env-aips`
- No credentials hardcoded in source
- Fabric API key stored in `.env-aips` only

---

## ESLint Security Hooks

Pre-commit hooks run ESLint security checks before every commit, catching:
- Direct DOM injection (`innerHTML` with user data)
- SQL injection patterns
- Path traversal risks
- Hardcoded secrets

### Setup
```bash
./setup-hooks.sh   # run once per clone
```

### Verify
```bash
ls .git/hooks/pre-commit
```

---

## Data Privacy

- All document content stays on-device — never sent to external AI services
- Ollama runs locally at `http://localhost:11434`
- MySQL (optional) stores test results only — no document content
- Fabric integration (optional) sends only the search query for prompt enhancement — not document content

---

## Reporting Vulnerabilities

If you discover a security issue:
1. Do not open a public GitHub issue
2. Email the development team directly
3. Include: description, steps to reproduce, potential impact
4. Allow reasonable time for a fix before public disclosure

---

## Known Limitations

- Email-only auth — no password or MFA
- Sessions stored in flat JSON file — not suitable for high-concurrency production
- Client-side menu hiding is UX only — all security enforced server-side
- Local network only — not designed for public internet exposure without a reverse proxy (Caddy/Nginx)
