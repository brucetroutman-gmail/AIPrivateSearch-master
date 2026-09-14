# AIPrivateSearch — Kiro Code Review

**Reviewed by**: Kiro AI  
**Date**: 2026-09-02  
**Version reviewed**: 21.37  
**Scope**: Full codebase — server, client, security, scripts, documentation

---

## Summary

AIPrivateSearch is a well-structured, purposefully-built local-first AI search platform. The architecture is clean, the security posture is notably stronger than most projects of this scale, and the code reflects genuine care about the product's privacy mission. This review identifies a scoring formula discrepancy, several hardcoded values that create maintenance risk, and a handful of security patterns worth tightening — none of them critical, but all worth addressing.

---

## What's Working Well

### Architecture

The three-layer structure (client HTML/JS → Express server → Ollama + filesystem) is appropriate for the single-machine deployment model. The `SearchOrchestrator` pattern cleanly abstracts the seven search methods behind a uniform interface, making it easy to add or swap implementations. The separation of `lib/search/`, `lib/services/`, `lib/utils/`, `lib/auth/`, and `lib/documents/` is logical and consistent.

The shared `utils/logger.mjs` being used across both client and server is a good DRY decision. The `secureFileOps.mjs` allowlist pattern for filesystem access is exactly the right approach for a tool that reads user documents.

### Security Infrastructure

The security setup is more thorough than typical projects of this size:

- CSRF tokens are generated with `crypto.randomBytes(32)` and expired after one hour.
- Rate limiting is implemented in-process for the search endpoint (30 req/min) and admin endpoints (50 req/min).
- Timing-safe comparison (`crypto.timingSafeEqual`) is used for API key validation — good, prevents timing attacks.
- Log injection is prevented across the board with `sanitizeLogInput`, which strips control characters before writing to console.
- Path traversal is defended at two levels: `secureFileOps.mjs` (allowlist of directories) and `pathValidator.mjs` (normalizes and bounds-checks relative paths).
- Collection name creation validates against `/^[a-zA-Z0-9-_]+$/` before writing to disk — correct.
- `.env` and `.env-aips` are gitignored. `.env.example` is committed as a safe template.
- ESLint security rules (`eslint-plugin-security`, `eslint-plugin-no-unsanitized`) are enforced via pre-commit hooks with `setup-hooks.sh`.

### Developer Experience

The `release.sh` script is practical — minor/major bumps, syncing sources and data, and generating a commit message in one command. The `start.sh` reads ports from `app.json` rather than hardcoding them, which is the right pattern. Sample document collections (law office, medical practice, family documents, USA history, etc.) make the product demonstrably useful out of the box.

---

## Issues Found

### 1. Scoring Formula: Code Does Not Match Documentation (Medium)

**File**: `server/s01_server-first-app/lib/services/ScoringService.mjs` lines 147–149  
**File**: `docs/system-documentation/sys-aips-scoring.md`

The documentation states the weighted score formula is:

```
(accuracy×3 + relevance×2 + organization×1) / 18 × 100
```

The code implements a different formula:

```js
// Accuracy 4x, Relevance 3x, Organization 1x (max = 24)
const rawScore = (4 * accuracy) + (3 * relevance) + (1 * organization);
scoreObj.total = Math.round((rawScore / 24) * 100);
```

The weights are 4/3/1 with a denominator of 24, not 3/2/1 with 18. The README also states "Accuracy 3x, Relevance 2x, Organization 1x." The scores users see do not match what the documentation says they should be.

**Impact**: Users who calibrate expectations based on the documented formula are reading misleading numbers. Test results stored in MySQL reflect the code's formula, not the documented one.

**Fix**: Either update the code to match the documented 3/2/1 weights, or update all documentation and the README to reflect the actual 4/3/1 weights. Decide which formula is intended and make them consistent.

---

### 2. Port 56306 Hardcoded in Server-Side Logic (Medium)

**Files**: `routes/search.mjs`, `lib/search/AIDirectSearch.mjs`, `lib/search/AIDocumentChat.mjs`, `lib/search/HybridSearch.mjs`, `lib/search/SmartSearch.mjs`

The server builds clickable document links like:

```js
`[${result.title}](http://localhost:56306/api/documents/...)`
```

These links are embedded in AI responses. If the port changes (the `start.sh` and `app.json` support configurable ports), the links break silently — the search still works but the clickable document references in responses point to the wrong port.

Port 56306 also appears in `license-activation.html` as a hardcoded fetch target, which is the client side doing the same thing.

**Fix**: The server already loads port from `app.json` at startup. Pass `PORT` or a base URL into the search classes at construction time, or read it from the same `AppConfig` utility. The client pages should use `window.API_BASE_URL` (which is already set from config in `common.js`) rather than a hardcoded port.

---

### 3. Debug Endpoints Left Open in Production Auth Routes (Medium)

**File**: `server/s01_server-first-app/routes/auth.mjs`

Two endpoints have no authentication guard and expose internal state:

```js
// No auth — returns all users in the system
router.get('/debug-users', async (req, res) => { ... });

// No auth — creates an admin account with credentials from .env
router.post('/create-test-admin', async (req, res) => { ... });

// No auth — creates an admin AND returns a live session token
router.post('/create-and-login-admin', async (req, res) => { ... });
```

`/api/auth/create-and-login-admin` is called from `license-activation.html`, which makes it a product feature, not just a debug shortcut. But it accepts `email`, `password`, `userRole`, and `subscriptionTier` in the request body with no authentication — any caller on localhost can create an admin account.

This is acceptable for a strictly single-machine deployment where localhost access means physical access, but it is worth documenting explicitly and adding at minimum a check that the device license is valid before allowing the call.

`/api/auth/debug-users` should be removed or guarded — returning the full user list (even without password hashes) with no auth is information disclosure.

**Fix**:
- Remove `/api/auth/debug-users` or gate it behind `requireAdminAuth`.
- Add device license validation to `/api/auth/create-and-login-admin`.
- Add a comment to `/api/auth/create-test-admin` noting it is intentionally unguarded and why.

---

### 4. SHA-256 Used for Password Hashing (Low–Medium)

**File**: `server/s01_server-first-app/lib/auth/userManager.mjs` line 47

```js
hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
```

SHA-256 is a fast hash, not a password hash. It has no salt and is vulnerable to rainbow table attacks and GPU-accelerated cracking. For a local-only application with a JSON file as the user store, this is lower risk than a web app — but if `users.json` is ever copied or read by malware, all passwords are trivially recoverable.

**Fix**: Replace with `crypto.scrypt` or `bcrypt`. Node's built-in `crypto.scrypt` requires no additional dependency:

```js
import { scrypt, randomBytes } from 'crypto';

async hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      resolve(`${salt}:${key.toString('hex')}`);
    });
  });
}
```

---

### 5. CSRF Session Key Falls Back to IP Address (Low)

**File**: `server/s01_server-first-app/middleware/csrf.mjs` line 14

```js
const sessionId = req.sessionID || req.ip; // Use session ID or IP as fallback
```

There is no session middleware configured in `server.mjs`, so `req.sessionID` is always `undefined`. The CSRF token store is effectively keyed by IP address. Two users behind the same NAT share a CSRF token, and a token issued to one is valid for the other.

For a local-only application this is low risk, but it means CSRF protection is weaker than intended.

**Fix**: Either install `express-session` (one dependency, `req.sessionID` then works as intended) or key CSRF tokens by `sessionId` from the bearer token in the Authorization header, which is already available.

---

### 6. `cookies.txt` Committed to Repository (Low)

**File**: `cookies.txt` in the repo root

This file contains a live session token value in plaintext:

```
#HttpOnly_localhost	FALSE	/	FALSE	1761782278	sessionId	4f80decd-22a0-4a98-...
```

The session appears to be expired (timestamp 1761782278 is past), but committing session files is a bad habit. The `.gitignore` does not exclude `cookies.txt`.

**Fix**: Add `cookies.txt` to `.gitignore`.

---

### 7. `requireAuth` Always Bypasses in Development (Low)

**File**: `server/s01_server-first-app/middleware/auth.mjs` lines 28–30

```js
export function requireAuth(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    return next(); // bypass all auth
  }
  ...
}
```

The app ships with `NODE_ENV=development` as the default (no value is set in `.env.example`, and `dotenv.config()` only sets it if explicitly provided). This means `requireAuth` is a no-op in the default installation. The same bypass applies to `requireAdminAuth`.

The `authMiddleware.mjs` used in `routes/auth.mjs` does NOT have this bypass — it properly validates sessions — but `auth.mjs` (used on the `/api/search` route) does.

This is a design choice — local-first users may not want login friction — but it should be explicit. A comment saying "local-only mode: auth is intentionally bypassed" is clearer than a development-environment check that silently does nothing.

---

### 8. ScoringService Reads Config Synchronously at Construction Time (Low)

**File**: `server/s01_server-first-app/lib/services/ScoringService.mjs` lines 10–17

```js
constructor() {
  this.scoreSettings = this.loadScoreSettings();
}

loadScoreSettings() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  ...
}
```

`fs.readFileSync` inside a constructor blocks the event loop and throws synchronously if the file is missing. A missing `score-settings` config file will crash the service at startup rather than returning a useful error message. The config is also loaded once and never refreshed — a config change requires a server restart.

**Fix**: Move to async initialization (read config in an `async init()` method called at startup) or wrap the `readFileSync` in a try/catch with a safe default fallback.

---

### 9. No Test Coverage

There are no automated tests. The `shared/tests/verify-installation.sh` checks that binaries exist, but no unit or integration tests cover search logic, auth flows, scoring, or collection operations. The test pages (`test-nodocuments.html`, `test-collections.html`, etc.) are manual browser pages, not automated tests.

For the core search and scoring logic — especially given the scoring formula discrepancy found above — automated tests would catch regressions and formula mismatches immediately.

**Recommendation**: Add a test suite for at minimum:
- `ScoringService.parseScores()` with fixture inputs
- `pathValidator.validatePath()` with traversal attempt inputs
- `UserManager.createUser / authenticateUser / validateSession`
- `SearchOrchestrator.search()` with a mock search method

Jest or Node's built-in `node:test` runner work well here; no framework overhead required.

---

## Minor Observations

**`server.mjs` debug wrapper**: `debugValidateOrigin` is defined and imported but `debugValidateOrigin` replaces `validateOrigin` on all routes. This was likely added during troubleshooting and never removed. It logs every request's origin and referer to stdout in production.

**`validateOrigin` only enforces in production**: The check `if (process.env.NODE_ENV === 'production' && origin && ...)` means origin validation is always skipped in development (default mode). Same pattern as the auth bypass — intentional, but worth a comment.

**Session file is not cleaned up**: `sessions.json` in `data/` grows unboundedly. Expired sessions are only removed when `validateSession` encounters a specific expired session. A periodic cleanup pass on all sessions would prevent the file from growing large on heavily-used installations.

**`release.sh` copies `users.json` and `sessions.json` to the repo**: The `data/` copy step syncs all JSON files from `/Users/Shared/AIPrivateSearch/data/` into the repo. This would commit active session tokens and user password hashes if `users.json` or `sessions.json` exist in that directory. The current `.gitignore` does not exclude `data/*.json`.

---

## Documentation

The documentation suite is comprehensive and clearly written. A few gaps:

- **Scoring doc is out of date**: `sys-aips-scoring.md` still shows version 20.22 and the 3/2/1 weight formula that the code no longer uses.
- **API doc lists port 56306**: `sys-aips-api.md` uses 56306 as the base URL example. This is correct for remote Mac deployments but will confuse users running the default local setup.
- The `sys-aips-changelog.md` entry history ends early (version 20.00) — worth updating alongside releases.

---

## Priority Summary

| # | Issue | Priority |
|---|-------|----------|
| 1 | Scoring formula mismatch between code and docs | Fix before next release |
| 2 | Port 56306 hardcoded in server response generation | Fix next release |
| 3 | Unauthenticated debug and admin-creation endpoints | Address before any network deployment |
| 4 | SHA-256 password hashing | Replace when convenient |
| 5 | CSRF keyed by IP, not session | Low priority for local-only use |
| 6 | `cookies.txt` in repo / not gitignored | Fix now (one-liner) |
| 7 | Auth bypass in dev — undocumented intent | Add comment |
| 8 | ScoringService sync read at construction | Fix when convenient |
| 9 | No automated tests | Add incrementally |
