# AIPrivateSearch Troubleshooting Guide

**Version**: 20.22

---

## Startup Issues

### App won't start
| Symptom | Cause | Fix |
|---------|-------|-----|
| Port 3000/56305 already in use | Previous instance still running | Close all Terminal windows, restart app |
| Folder locked error | VS Code or another app has the folder open | Close VS Code, restart app |
| `npm: command not found` | Node.js not installed | Run `load-aiss.command` — it installs Node.js automatically |
| `ollama: command not found` | Ollama not in PATH | Add to `~/.zshrc`: `export PATH="/Users/Shared/AIPrivateSearch:$PATH"` |
| Backend starts but frontend 404 | Wrong working directory | Ensure you're running from repo root |

### Ollama not running
```bash
# Check if running
curl http://localhost:11434/api/tags

# Start manually
/Users/Shared/AIPrivateSearch/ollama serve

# Check available models
/Users/Shared/AIPrivateSearch/ollama list
```

---

## Login & Authentication

| Symptom | Cause | Fix |
|---------|-------|-----|
| Redirected to login on every page | Session expired or invalid | Log in again |
| Login succeeds but menu doesn't appear | tierAccessManager failed | Hard refresh (Cmd+Shift+R), check console for errors |
| "Authentication required" API errors | sessionId missing from localStorage | Clear localStorage, log in again |
| Menu shows wrong items | Stale tier-access.json on remote Mac | Restart app via `aiprivatesearch.app`, hard refresh |

### Clear session manually
Open browser DevTools → Application → Local Storage → delete `sessionId`, `userEmail`, `userUserRole`.

---

## Menu Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Menu items not showing after login | CSS show/hide not applied | Check console for `TIER CSS SHOW` logs — verify element counts > 0 |
| Menu shows "Search / Multi" instead of "Exact Search / AI Search" | Old `index.html` cached | Hard refresh (Cmd+Shift+R) |
| Menu shows on home page but not other pages | header.html not loading | Check network tab for failed `shared/header.html` fetch |

---

## Search Issues

### No results returned

| Search Type | Likely Cause | Fix |
|-------------|-------------|-----|
| Line Search | No matching terms in documents | Try broader terms or wildcards (`term*`) |
| Document Search | Collection empty or no matches | Verify documents exist in collection |
| Document Index Cards | Collection not indexed | Collections → Create Doc Indexes |
| Smart Search | Collection not embedded | Collections → Embed Source MDs |
| Hybrid Search | Collection not embedded | Collections → Embed Source MDs |
| AI Direct | Model not loaded | Wait for model to load, check Ollama is running |
| AI Document Chat | Collection not embedded | Collections → Embed Source MDs |

### Search returns wrong results
- **Line Search**: Check query uses AND logic — all terms must appear on the same line
- **Smart Search**: Re-embed collection if documents were recently updated
- **AI methods**: Try a different model or adjust temperature in Options

### Search is very slow
- AI methods (AI Direct, AI Document Chat) take 5-30s — this is normal
- Large models (7b+) are slower — try a smaller model for faster results
- First query after startup is slower — model loads into memory on first use

---

## Scoring Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Scores not appearing | Score model not selected | Select a score model before searching |
| Scores always 1-1-1 | Score model too small | Use gemma2:2b or larger for scoring |
| Scoring takes very long | Large score model | Use gemma2:2b instead of 9b for faster scoring |
| Score model dropdown empty | Models not loaded | Check Ollama is running, refresh models list |

---

## Collections Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Collection not in dropdown | Folder doesn't exist | Create folder in `sources/local-documents/` |
| Documents not appearing | Wrong file format | Use `.md`, `.txt`, or `.pdf` |
| Index creation fails | AI model not available | Ensure Ollama is running with a model loaded |
| Embedding fails | LanceDB error | Check server logs, try re-embedding |
| PDF upload fails | Password-protected PDF | Remove password protection before uploading |
| Search misses content | Embeddings outdated | Re-embed after document changes |

---

## Document Viewer Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Document opens but no highlighting | Search term not passed | Use "View Document" link from results, not direct URL |
| Viewer shows raw markdown | Browser rendering issue | Hard refresh |
| Wrong line highlighted | Line numbers shifted by edits | Re-index the document |

---

## Remote Mac Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Changes not appearing after push | App not restarted after push | Restart app via `aiprivatesearch.app` — it pulls latest from GitHub automatically |
| Config changes not taking effect | Config not synced | `Start App` syncs config from repo to `/Users/Shared/AIPrivateSearch/config/` automatically |
| App running old version | Browser cache | Hard refresh (Cmd+Shift+R) |
| `git pull` fails on Start App | Git auth issue | Check GitHub access token or SSH key |

---

## Database Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Results not saving | MySQL not running or wrong credentials | Check `.env-aips` credentials, verify MySQL is running |
| "Database connection failed" | Wrong host/port | Verify `DB_HOST` and `DB_PORT` in `.env-aips` |
| App works without database | Expected behavior | MySQL is optional — app functions fully without it |

---

## Browser Console Errors

### Useful debug logs to look for
```
🔐 TIER CSS SHOW: .menu-search → found 1 elements    ✅ good
🔐 TIER CSS SHOW: .menu-search → found 0 elements    ❌ element not in DOM
🔐 LICENSE CHECKER: Step 2d - Skipping enforcement   ℹ️ on index page, normal
🔓 MENU: Showing licensed content                    ✅ auth passed
```

### Common console errors
| Error | Meaning | Fix |
|-------|---------|-----|
| `Failed to fetch ./shared/header.html` | Wrong base path | Check page is served from correct directory |
| `Cannot read properties of null` | Element not found in DOM | Check HTML has expected element IDs |
| `401 Unauthorized` | Session invalid | Log in again |
| `429 Too Many Requests` | Rate limit hit | Wait 60 seconds and retry |

---

## Getting More Help

1. Check browser DevTools console for error messages
2. Check server terminal output for backend errors
3. Review `docs/system-documentation/` for relevant guides
4. Check `ToDo.md` for known issues and workarounds
