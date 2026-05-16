# AIPrivateSearch Deployment Guide

## Environments

| Environment | Frontend | Backend | Start method |
|-------------|----------|---------|--------------|
| Local dev Mac | localhost:3000 | localhost:3001 | `npm start` in repo root |
| Remote Mac | [host]:56305 | [host]:56306 | `aiprivatesearch.app` |

---

## Local Dev Setup

### Prerequisites
- macOS 12+
- Node.js (installed via `load-aiss.command` or manually)
- Ollama at `/Users/Shared/AIPrivateSearch/ollama` (added to PATH in `~/.zshrc`)
- MySQL (optional — for test result storage)

### Start
```bash
cd /Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch
npm start
```

### Config location
The server reads config from `/Users/Shared/AIPrivateSearch/config/` — not from the repo.
The repo `client/c01_client-first-app/config/` is the template.

To sync parent config → repo (done automatically by `release`):
```bash
rsync -a --delete /Users/Shared/AIPrivateSearch/config/ \
  client/c01_client-first-app/config/
```

---

## Remote Mac Deployment

### First-time setup
Double-click `load-aiss.command` in `/Users/Shared/`. This will:
1. Install Xcode Command Line Tools (Git, make, compilers)
2. Install Node.js
3. Install Ollama
4. Install Chrome
5. Start Ollama service
6. Clone repo to `/Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch`
7. Pull required AI models
8. Install npm dependencies
9. Start frontend (port 56305) and backend (port 56306)

### Updating remote Mac
After pushing changes to GitHub, simply restart the app via `aiprivatesearch.app` → Start App.

What `Start App` does automatically:
1. `git pull` latest from GitHub
2. Syncs `client/c01_client-first-app/config/` → `/Users/Shared/AIPrivateSearch/config/`
3. Starts Ollama, backend, and frontend servers

---

## Release Process

Run the `release` command in Amazon Q chat:

```
release        # minor bump: 20.21 → 20.22
release 21     # major bump: → 21.00
```

This will:
1. Bump version in `README.md`, `package.json`, `server/package.json`, `footer.html`
2. Sync `/Users/Shared/AIPrivateSearch/sources/` → `sources/`
3. Sync `/Users/Shared/AIPrivateSearch/data/` → `data/`
4. Sync `/Users/Shared/AIPrivateSearch/config/` → `client/c01_client-first-app/config/`
5. Verify pre-commit ESLint hooks are installed

Then manually commit and push:
```bash
git add -A
git commit -m "v20.22: description of changes"
git push
```

---

## Environment Variables

`.env-aips` lives at `/Users/Shared/AIPrivateSearch/.env-aips` — never committed to repo (in `.gitignore`).

```bash
NODE_ENV=development
DB_HOST=your.database.host
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=aiprivatesearch
FABRIC_URL=https://fabric.formr.net
FABRIC_API_KEY=your_key
```

---

## Ollama

- Binary location: `/Users/Shared/AIPrivateSearch/ollama`
- Added to PATH in `~/.zshrc`
- Runs on port `11434`
- Available models: qwen2:0.5b, qwen2.5:3b, qwen2.5:7b, phi3:3.8b, llama3.2:3b, mistral:7b, gemma2:2b, gemma2:9b

```bash
# Check running models
ollama list

# Pull a model
ollama pull qwen2.5:3b

# Check service
curl http://localhost:11434/api/tags
```

---

## Fabric (Optional)

Fabric runs on Ubuntu server `formr` via systemd, exposed via Caddy.

- URL: `https://fabric.formr.net`
- Port: 8081 (internal)
- Managed via: `systemctl start/stop/status fabric`

See `aips-fabric-install.md` for full setup details.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3000/56305 busy | Close Terminal windows, restart app |
| Folder locked | Close VS Code, restart app |
| Menu not showing | Hard refresh (Cmd+Shift+R), check browser console for tier access logs |
| Models not loading | Check `ollama list`, ensure Ollama service is running |
| Config not updating | Verify `/Users/Shared/AIPrivateSearch/config/` has latest files |
| No scores | Ensure score model is selected when scoring is enabled |
| MySQL connection failed | App works without MySQL — check `.env-aips` credentials if needed |

---

## Git Security Hooks

Pre-commit hooks run ESLint security checks before every commit.

```bash
# Install hooks (run once per clone)
./setup-hooks.sh

# Verify hook is installed
ls .git/hooks/pre-commit
```
