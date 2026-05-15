# AIPrivateSearch Contributing Guide

**Version**: 20.22

---

## Development Setup

### Prerequisites
- macOS 12+
- Node.js (installed via `load-aiss.command` or manually)
- Ollama at `/Users/Shared/AIPrivateSearch/ollama`
- Git with SSH or HTTPS access to GitHub

### First-time setup
```bash
cd /Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch
npm install
./setup-hooks.sh    # install pre-commit ESLint hooks
npm start
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — all releases tagged here |
| Feature branches | `feature/description` — new features |
| Fix branches | `fix/description` — bug fixes |

All changes go through a feature/fix branch and are merged to `main` via commit. There is no PR process for the core team — commit directly to `main` after testing.

---

## Release Process

Use the `release` command in Amazon Q chat:

```
release        # minor bump: 20.21 → 20.22
release 21     # major bump: → 21.00
```

This bumps version in `README.md`, both `package.json` files, and `footer.html`, then syncs sources, data, and config from parent → repo.

Then commit manually:
```bash
git add -A
git commit -m "v20.22: description of changes"
git push
```

See `sys-aips-deployment.md` for full release details.

---

## Code Standards

### Language and modules
- Backend: Node.js ES modules (`.mjs`) — use `import/export`, not `require`
- Frontend: Vanilla JS — no frameworks, no build step
- No TypeScript — keep it simple and accessible

### File naming
- Server files: `camelCase.mjs`
- Client files: `kebab-case.js`
- Documentation: `sys-aips-kebab-case.md`
- Config files: `kebab-case.json`

### Style
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Match the style of the file you're editing

---

## Security Rules (Enforced by ESLint)

### Never do this
```javascript
// ❌ Direct DOM injection
element.innerHTML = userInput;
document.write(userInput);

// ❌ Direct SQL string concatenation
const query = `SELECT * FROM users WHERE name = '${userInput}'`;

// ❌ Direct path concatenation
const filePath = basePath + '/' + userInput;

// ❌ Wildcard imports
import * from './module.js';

// ❌ Exposing internal errors to client
res.status(500).json({ error: error.stack });
```

### Always do this
```javascript
// ✅ Safe DOM manipulation
element.textContent = userInput;
element.setAttribute('data-value', userInput);

// ✅ Parameterized queries
const query = 'SELECT * FROM users WHERE name = ?';
db.query(query, [userInput]);

// ✅ Path validation
const resolved = path.resolve(allowedBase, userInput);
if (!resolved.startsWith(path.resolve(allowedBase))) {
  throw new Error('Path traversal detected');
}

// ✅ Explicit imports
import { specificFunction } from './module.js';

// ✅ Safe error responses
logger.error('Internal error:', error);
res.status(500).json({ error: 'Internal server error' });
```

---

## Pre-commit Hooks

ESLint security checks run automatically before every commit.

```bash
# Install (run once per clone)
./setup-hooks.sh

# Run manually
cd security && bash security-check.sh

# Run security lint only
npm run lint:security
```

If the hook blocks your commit, fix the ESLint errors before committing. Do not bypass hooks with `--no-verify`.

---

## Adding a New Search Method

1. Create `server/s01_server-first-app/lib/search/YourSearch.mjs`
2. Add route handler in `server/s01_server-first-app/routes/multiSearch.mjs`
3. Register the method in the methods list endpoint
4. Add UI checkbox in `multi-mode-search.html`
5. Handle results in `client/c01_client-first-app/shared/utils/commonResultFormatter.js`
6. Decide if it belongs on Exact Search, AI Search, or both — update `multi-mode-search.js` mode filtering

---

## Adding a New Config Option

1. Add to `app.json` in `/Users/Shared/AIPrivateSearch/config/` (parent — this is what the app reads)
2. The release process will sync parent config → repo
3. Add to `update-aips.sh` sync if it needs to reach remote Macs
4. Document in `sys-aips-architecture.md`

---

## Adding a New Page

1. Copy `_template-page.html` if one exists, or copy the closest existing page
2. Include `shared/header.html` and `shared/footer.html` via `#header-placeholder` and `#footer-placeholder`
3. Load `shared/common.js` — this handles auth, header/footer injection, tier access
4. Add menu entry to `shared/header.html` and `index.html` (both have hardcoded nav)
5. Add CSS class to `tier-access.json` `cssShow` arrays for appropriate user types (both repo and parent config)

---

## Commit Message Format

```
vX.XX: Short description of what changed

# Examples:
v20.22: Fixed menu display on home page, unified footer across all pages
v20.21: Reverted nav to inline style approach, updated exact/ai search links
```

For non-release commits during development:
```
fix: description of bug fix
feat: description of new feature
docs: documentation updates
refactor: code cleanup with no behavior change
```

---

## Code Review Checklist

Before committing:
- [ ] No `innerHTML` with user data
- [ ] All user inputs sanitized
- [ ] Error handling implemented — no stack traces to client
- [ ] Path validation on any file operations
- [ ] No hardcoded secrets, ports, or URLs (use config/env)
- [ ] ESLint passes with no errors
- [ ] Tested locally on both search pages
- [ ] Version bumped if this is a release

---

## Documentation Standards

- New system docs go in `docs/system-documentation/`
- Filename format: `sys-aips-kebab-case.md`
- All lowercase filenames
- Update `sys-aips-changelog.md` and `sys-aips-todo.md` with each release
- Keep `sys-aips-architecture.md` current when adding new components
