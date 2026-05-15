# AIPrivateSearch Fabric Integration

**Version**: 20.22

---

## What is Fabric?

[Fabric](https://github.com/danielmiessler/fabric) is an open-source AI prompt enhancement tool. In AIPrivateSearch, Fabric runs on a remote Ubuntu server and enhances user queries before they are processed locally by Ollama. This produces significantly better AI responses without sending any document content externally.

**Key principle**: Fabric handles prompt enhancement only. All document processing, search, and answers remain local via Ollama. No document content leaves the user's machine.

---

## Architecture

```
User types query → clicks "Enhance" (optional)
        ↓
Express server → FabricService → Fabric server (fabric.formr.net)
        ↓ uses collection-specific pattern (enhance_[collection-name])
Enhanced prompt returned to UI → user reviews/edits
        ↓
User clicks Submit → SearchOrchestrator → Ollama (local) → answer
```

### Infrastructure
- **Fabric server**: Ubuntu `formr`, port 8081 (internal), managed via systemd
- **Public URL**: `https://fabric.formr.net` (Caddy reverse proxy)
- **AI model**: Claude Haiku via Anthropic API (vendor name: `Anthropic` with capital A)
- **SSE response format**: `data: {"type":"content","format":"markdown","content":"..."}`

---

## Current Status

✅ Fabric installed on formr (Go 1.23, latest Fabric)
✅ Running via systemd on port 8081
✅ Exposed via Caddy at `https://fabric.formr.net`
✅ Full Fabric+Ollama pipeline tested and working (`test-fabric.mjs`)
✅ Comparison testing shows enhanced prompts produce significantly better Ollama responses
⬜ UI integration not yet implemented (Enhance button, FabricService, route)

---

## Server Setup (formr Ubuntu)

### Service management
```bash
# Status
systemctl status fabric

# Start / stop / restart
systemctl start fabric
systemctl stop fabric
systemctl restart fabric

# View logs
journalctl -u fabric -f
```

### Systemd service file
Located at `/etc/systemd/system/fabric.service`:
```ini
[Unit]
Description=Fabric AI Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/home/ubuntu/go/bin/fabric --serve --port 8081
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Caddy config
File: `/etc/caddy/sites/fabric-formr-net.caddy`
```
fabric.formr.net {
    reverse_proxy localhost:8081
    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy no-referrer-when-downgrade
    }
}
```

### Fabric configuration
Settings stored at `~/.config/fabric/.env` on formr:
- Vendor: `Anthropic` (capital A required)
- Model: `claude-haiku-4-5`
- API key: stored in `.env-aips` as `FABRIC_API_KEY`

---

## Pattern Strategy

Each document collection gets its own Fabric pattern named `enhance_[collection-name]`.

Examples:
- `enhance_USA-History`
- `enhance_Family-Documents`
- `enhance_Law-Office`

### Pattern generation
Patterns are generated from collection metadata (`meta-prompts.json`) — document types, topics, keywords, AI analysis. No document content is included.

### When to generate/update patterns
- Collection created
- Documents added or removed
- Document Index Cards regenerated
- Manual trigger from Collections page

---

## Testing Fabric

Use `test-fabric.mjs` in the repo root:

```bash
# Basic test
node test-fabric.mjs "What were the main arguments for independence?"

# With specific model and collection
node test-fabric.mjs "your query" qwen2.5:3b USA-History
```

### Test script behavior
1. Checks if collection pattern exists on Fabric server
2. Calls Fabric `/chat` SSE endpoint with the pattern
3. Collects SSE response
4. Pipes enhanced prompt to Ollama `/api/generate`
5. Returns final answer

### Direct API test
```bash
# Check Fabric is running
curl https://fabric.formr.net/patterns/names | grep enhance

# Test enhance endpoint
curl -X POST https://fabric.formr.net/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"prompts":[{"role":"user","content":"test query"}],"patternName":"enhance_USA-History"}'
```

---

## Planned UI Integration

### Files to create
| File | Location | Purpose |
|------|----------|---------|
| `FabricService.mjs` | `server/lib/services/` | Fabric API client — enhance prompt, check pattern exists, SSE collection, timeout/retry/circuit breaker |
| `fabric.mjs` | `server/routes/` | Express route: `POST /api/fabric/enhance` |
| `generatePattern.mjs` | `server/scripts/` | Generates and uploads per-collection patterns to Fabric |

### Files to modify
| File | Change |
|------|--------|
| `server.mjs` | Register fabric route |
| `app.json` | Add `fabricEnabled: true/false` toggle |
| `.env-aips` | Add `FABRIC_URL` and `FABRIC_API_KEY` |
| `ai-search.html` | Add "Enhance" button with spinner and cancel |

### Graceful degradation
If Fabric is unreachable:
- Fall back to existing `addMetaPrompt` behavior
- Show toast notification: "Prompt enhancement unavailable, using local context"
- Search continues normally

---

## Environment Variables

In `/Users/Shared/AIPrivateSearch/.env-aips`:
```
FABRIC_URL=https://fabric.formr.net
FABRIC_API_KEY=your_api_key_here
```

---

## Security Considerations

- Only the search query is sent to Fabric — never document content
- If users type PHI into the query field, that would be sent to Fabric/Anthropic
- Add warning when Fabric is enabled for collections that may contain sensitive data
- Input sanitization: `collectionName` should be alphanumeric + hyphens only (prevent path traversal)
- Rate limit the `/api/fabric/enhance` route to prevent Anthropic cost abuse

---

## Cost

- Claude Haiku is the lowest-cost Anthropic model
- Prompt enhancement adds ~200-500 input tokens per query
- At current Haiku pricing, cost is negligible for typical usage
- Monitor spend via Anthropic dashboard: https://console.anthropic.com

---

## Existing Fabric Docs (to archive)

These docs are superseded by this file:
- `aips-fabric-install.md` — server setup details (keep for reference)
- `aips-fabric-integration.md` — integration plan
- `aips-fabric-impl-grok.md` — implementation review
- `aips-fabric-test-prompt.md` — test prompts
- `aips-fabric-test-results-comparison.md` — before/after comparison
- `aips-fabric-test-user-prompt.md` — user prompt tests
