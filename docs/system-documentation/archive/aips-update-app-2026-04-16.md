# AIPS-Update-App-2026-04-16

## Update Plan for AIPrivateSearch v20.13

Based on full application review conducted 2026-04-16. Items are prioritized by risk and impact.

---

## Phase 1: Security Fixes (Critical)

These should be addressed before any new feature work.

### 1.1 Replace SHA-256 password hashing with bcrypt
- **File**: `server/s01_server-first-app/lib/auth/userManager.mjs`
- **Issue**: `crypto.createHash('sha256')` is not suitable for password storage — no salting, too fast for brute-force resistance
- **Action**: Install `bcrypt` package, replace `hashPassword()` and update `authenticateUser()` to use `bcrypt.compare()`. Add migration logic to rehash existing passwords on next login
- **Risk**: High — passwords are trivially crackable if data file is exposed

### 1.2 Remove unauthenticated debug/admin endpoints
- **File**: `server/s01_server-first-app/routes/auth.mjs`
- **Issue**: `/api/auth/debug-users` exposes all user data without auth. `/api/auth/create-test-admin` allows unauthenticated admin creation
- **Action**: Either remove these endpoints entirely or gate them behind `requireAuth` + admin role check. At minimum, disable in production via `NODE_ENV` check
- **Risk**: High — anyone with network access can enumerate users or create admin accounts

### 1.3 Consolidate duplicate auth middleware
- **Files**: `server/s01_server-first-app/middleware/auth.mjs` and `middleware/authMiddleware.mjs`
- **Issue**: Two files both export `requireAuth` with different implementations — one checks API keys, the other checks session tokens. Easy to use the wrong one
- **Action**: Merge into a single auth middleware file with clearly named exports (e.g., `requireApiKeyAuth`, `requireSessionAuth`)
- **Risk**: Medium — wrong middleware on a route means either no auth or broken auth

### 1.4 Fix validateOrigin to use configured ports
- **File**: `server/s01_server-first-app/middleware/auth.mjs`
- **Issue**: `validateOrigin()` has hardcoded ports 3000/3001 while the rest of the app reads ports from `app.json`
- **Action**: Read allowed origins from the same `app.json` config used by CORS setup in `server.mjs`
- **Risk**: Low — only enforced in production mode currently

---

## Phase 2: Code Quality & Maintainability

### 2.1 Remove debug console.log statements
- **Files**: `middleware/authMiddleware.mjs`, `lib/auth/userManager.mjs`, `server.mjs`, `search.js`
- **Issue**: Extensive `console.log` debug output including session IDs, user data, and auth state in production code
- **Action**: Replace with logger calls gated behind a `DEBUG` flag, or remove entirely. Session IDs and user data should never be logged in production

### 2.2 Extract search route handler into service methods
- **File**: `server/s01_server-first-app/routes/search.mjs`
- **Issue**: POST `/` handler is ~180 lines with deeply nested conditionals for each search type
- **Action**: Move each search type's response formatting into the respective search class or a dedicated formatter service. The route handler should only orchestrate

### 2.3 Deduplicate export/database field mapping
- **Files**: `client/c01_client-first-app/shared/common.js` (exportToDatabase), `client/c01_client-first-app/search.js` (JSON export)
- **Issue**: The database field mapping object is duplicated between the two files
- **Action**: Create a single `resultMapper.js` utility that both export paths use

### 2.4 Add file locking for JSON data stores
- **File**: `server/s01_server-first-app/lib/auth/userManager.mjs`
- **Issue**: `users.json` and `sessions.json` are read/written without file locking — concurrent requests can corrupt data
- **Action**: Use `proper-lockfile` or similar package to lock files during write operations

---

## Phase 3: Architecture Improvements

### 3.1 Externalize hardcoded paths
- **Files**: `userManager.mjs`, `secureFileOps.mjs`, `server.mjs`, `start.sh`
- **Issue**: `/Users/Shared/AIPrivateSearch/` is hardcoded throughout — limits portability to other systems or directory structures
- **Action**: Define a single `AIPS_DATA_DIR` environment variable (defaulting to `/Users/Shared/AIPrivateSearch/`), reference it everywhere. Add to `.env-aips` template

### 3.2 Add health check endpoint
- **File**: `server/s01_server-first-app/server.mjs`
- **Issue**: No way to programmatically verify the server is healthy
- **Action**: Add `GET /api/health` returning `{ status: 'ok', version, uptime, ollamaConnected }`. No auth required

### 3.3 Add graceful shutdown handling
- **File**: `server/s01_server-first-app/server.mjs`
- **Issue**: No `SIGTERM`/`SIGINT` handlers — database connections and in-flight requests aren't cleaned up
- **Action**: Add signal handlers that close the HTTP server, flush any pending writes, and exit cleanly

### 3.4 Make development security bypasses explicit
- **Files**: `middleware/auth.mjs`, `middleware/csrf.mjs`
- **Issue**: Auth and CSRF validation are silently bypassed when `NODE_ENV=development` — easy to forget this is happening
- **Action**: Log a clear startup warning when running in development mode with security bypasses active. Consider requiring an explicit `DISABLE_AUTH=true` flag instead of keying off `NODE_ENV`

---

## Phase 4: Existing ToDo Items (from ToDo.md)

These are high-value items from the existing backlog that align with the review findings:

| ToDo ID | Description | Notes |
|---------|-------------|-------|
| 2-004 | Test multi search and view documents | Functional validation |
| 2-005 | Test multi prompts and ASCII characters | Input handling |
| 2-006 | Fix Smart Search to return only matches | Quality improvement |
| 2-007 | Make Response matches and View Document consistent | UX consistency |
| 2-009 | Review chunking strategy | Performance/accuracy |
| 2-045 | Upgrade RAG Level 2 → Level 4 (hybrid + reranking) | Major accuracy gain |
| 2-013 | Mobile-responsive design improvements | Usability |
| 2-022 | Search performance optimization and caching | Performance |

---

## Implementation Order

1. **Phase 1** (1.1 → 1.2 → 1.3 → 1.4) — Security first
2. **Phase 2** (2.1 → 2.4 → 2.2 → 2.3) — Clean up before building more
3. **Phase 3** (3.2 → 3.3 → 3.4 → 3.1) — Health check is quick win, paths is larger refactor
4. **Phase 4** — Feature work from backlog, prioritize 2-006 and 2-045

---

*Generated from app review on 2026-04-16 against AIPrivateSearch v20.13*
