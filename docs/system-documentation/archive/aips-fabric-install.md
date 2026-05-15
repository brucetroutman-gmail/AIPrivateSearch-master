
# Fabric on Ubuntu — Install Guide

> **Important**: PM2 does not work reliably with Go binaries. Despite showing "online" status, PM2 silently fails to execute the Fabric binary — port remains unbound and logs are empty. Use **systemd** instead (Step 7).

## Architecture

```
User creates collection → adds docs → generatePattern.js → enhance_[collection] uploaded to Fabric

User opens collection → types prompt → clicks Enhance
        ↓
Express → Fabric (enhance_[collectionName] pattern / Haiku) → enhanced prompt returned to UI
        ↓
User reviews → clicks Submit → Express → Ollama (local) → answer
```

- **Fabric** (remote Ubuntu server): prompt enhancement only, one pattern per collection
- **Ollama** (local Mac): all document processing and answers — data never leaves the user's machine
- **Collection name** maps directly to pattern name — no lookup table needed

---

## Part 1: Ubuntu Server Setup

### 1. Install Go

```bash
# Install Go on Ubuntu
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
go version
```

---

### 2. Install Fabric

```bash
# Install Fabric and verify
go install github.com/danielmiessler/fabric/cmd/fabric@latest
fabric --version
```

---

### 3. Get your Anthropic API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com) and sign up or log in
2. Navigate to **API Keys** → **Create Key**
3. Copy the key — it starts with `sk-ant-`
4. Add credits at **Billing** → **Add Credits** (minimum $5, more than enough to start)

> Claude Haiku 4.5 is available on all Anthropic plans with no special access required.

---

### 4. Configure Fabric

```bash
fabric --setup
```

When prompted, select **Anthropic** and paste your `sk-ant-` key. Settings are stored in `~/.config/fabric/.env`.

---

### 5. Test Fabric

```bash
echo "test" | fabric --pattern summarize
```

---

### 6. Install PM2

```bash
npm install -g pm2
```

---

### 7. Start Fabric with Systemd

```bash
cat > /etc/systemd/system/fabric.service << 'EOF'
[Unit]
Description=Fabric API Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/root/go/bin/fabric --serve --address :8081 --api-key your_secret_key
Restart=on-failure
RestartSec=5
Environment=PATH=/usr/local/go/bin:/root/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=HOME=/root

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl start fabric
systemctl enable fabric
```

Verify it's running:
```bash
systemctl status fabric
curl -H "X-API-Key: your_secret_key" http://localhost:8081/patterns/names
```

> **Note**: PM2 does not work reliably with Go binaries. Use systemd instead.

---

### 8. Configure DNS and Caddy

**GoDaddy DNS** — Add an A record:
- **Type**: A
- **Name**: fabric
- **Value**: [your Ubuntu server's IP]
- **TTL**: 600

Wait for DNS propagation (usually a few minutes).

**Caddy** — Create `/etc/caddy/sites/fabric-formr-net.caddy`:

```
fabric.formr.net {
    reverse_proxy localhost:8081
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

Reload Caddy:
```bash
systemctl reload caddy
```

---

### 9. Test the Server

```bash
curl https://fabric.formr.net/patterns/names
```

You should get a list of pattern names back.

---

## Part 2: Mac Express App

### Project structure

```
your-express-app/
├── .env
├── package.json
├── app.js
├── fabricClient.js
├── scripts/
│   └── generatePattern.js
└── routes/
    ├── enhance.js
    └── ask.js
```

---

### package.json

```json
{
  "name": "your-express-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node app.js",
    "dev": "node --watch app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1"
  }
}
```

---

### .env

```
# Fabric (remote - prompt enhancement only)
FABRIC_URL=https://fabric.yourdomain.com
FABRIC_API_KEY=your_secret_key
ANTHROPIC_ENHANCE_MODEL=claude-haiku-4-5

# Ollama (local - document processing and answers)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

---

### app.js

```js
import 'dotenv/config';
import express from 'express';
import enhanceRouter from './routes/enhance.js';
import askRouter from './routes/ask.js';

const app = express();
app.use(express.json());

app.use('/enhance', enhanceRouter);
app.use('/ask', askRouter);

app.listen(3000, () => console.log('Express running on http://localhost:3000'));
```

---

### fabricClient.js

```js
const FABRIC_BASE = process.env.FABRIC_URL ?? 'http://localhost:8081';
const FABRIC_API_KEY = process.env.FABRIC_API_KEY;
const ENHANCE_MODEL = process.env.ANTHROPIC_ENHANCE_MODEL ?? 'claude-haiku-4-5';

const fabricHeaders = {
  'Content-Type': 'application/json',
  ...(FABRIC_API_KEY && { 'X-API-Key': FABRIC_API_KEY }),
};

async function collectSSE(res) {
  let result = '';
  for await (const chunk of res.body) {
    const lines = Buffer.from(chunk).toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const { type, content } = JSON.parse(line);
      if (type === 'content') result += content;
      if (type === 'error') throw new Error(content);
    }
  }
  return result;
}

// collectionName maps directly to the Fabric pattern e.g. 'my-contracts' → 'enhance_my-contracts'
export async function enhancePrompt(rawPrompt, collectionName) {
  const patternName = `enhance_${collectionName}`;
  const res = await fetch(`${FABRIC_BASE}/chat`, {
    method: 'POST',
    headers: fabricHeaders,
    body: JSON.stringify({
      prompts: [{
        userInput: rawPrompt,
        patternName,
        vendor: 'anthropic',
        model: ENHANCE_MODEL,
      }],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Fabric error: ${res.status}`);
  return collectSSE(res);
}

export async function patternExists(collectionName) {
  const res = await fetch(`${FABRIC_BASE}/patterns/exists/enhance_${collectionName}`, {
    headers: fabricHeaders,
  });
  return res.ok;
}
```

---

### routes/enhance.js

```js
import express from 'express';
import { enhancePrompt, patternExists } from '../fabricClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { prompt, collectionName } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  if (!collectionName) return res.status(400).json({ error: 'collectionName is required' });

  // Guard: pattern must exist for this collection
  if (!await patternExists(collectionName))
    return res.status(404).json({ error: `No pattern found for collection: ${collectionName}` });

  const enhancedPrompt = await enhancePrompt(prompt, collectionName);
  res.json({ enhancedPrompt });
});

export default router;
```

---

### routes/ask.js

Handles Submit — sends the (optionally enhanced) prompt to local Ollama.

```js
import express from 'express';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3';

const router = express.Router();

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
  });
  if (!ollamaRes.ok) throw new Error(`Ollama error: ${ollamaRes.status}`);

  const { response } = await ollamaRes.json();
  res.json({ answer: response });
});

export default router;
```

---

### scripts/generatePattern.js

Call this whenever a collection is created or updated. Pass the collection name and folder path as arguments.

```js
import fs from 'fs';
import path from 'path';

const FABRIC_BASE = process.env.FABRIC_URL ?? 'http://localhost:8081';
const FABRIC_API_KEY = process.env.FABRIC_API_KEY;

// Called as: node generatePattern.js <collectionName> <folderPath>
const [collectionName, folder] = process.argv.slice(2);
if (!collectionName || !folder) {
  console.error('Usage: node generatePattern.js <collectionName> <folderPath>');
  process.exit(1);
}

function sampleFiles(folder, limit = 20) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder)
    .filter(f => fs.statSync(path.join(folder, f)).isFile())
    .slice(0, limit);
}

function buildSystemPrompt(collectionName, files) {
  const exts = [...new Set(files.map(f => path.extname(f).toLowerCase()).filter(Boolean))];
  const samples = files.slice(0, 10).join('\n- ');

  return `# IDENTITY and PURPOSE

You are an expert prompt engineer specialising in "${collectionName}" document analysis.
The user is working with a collection called "${collectionName}" containing ${files.length} documents.

## Collection profile
- File types: ${exts.join(', ') || 'mixed'}
- Example files:
- ${samples}

## Your task
Take the user's raw prompt and rewrite it into a precise, detailed prompt that:
1. References the "${collectionName}" collection context explicitly
2. Specifies the exact information to extract or analyse
3. Defines the expected output format (bullet points, summary, table, etc.)
4. Adds terminology and scope relevant to this collection

## Output
Return only the improved prompt. No explanation, no preamble.
`;
}

async function uploadPattern(name, systemMd) {
  const res = await fetch(`${FABRIC_BASE}/patterns/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      ...(FABRIC_API_KEY && { 'X-API-Key': FABRIC_API_KEY }),
    },
    body: systemMd,
  });
  if (!res.ok) throw new Error(`Failed to upload pattern ${name}: ${res.status}`);
  console.log(`✓ Pattern uploaded: enhance_${name}`);
}

const files = sampleFiles(folder);
const systemMd = buildSystemPrompt(collectionName, files);
await uploadPattern(`enhance_${collectionName}`, systemMd);
```

**Run it when a collection is created or updated:**
```bash
node scripts/generatePattern.js my-contracts /path/to/my-contracts
node scripts/generatePattern.js family-docs /path/to/family-docs
```

**Or call it programmatically** from your collection management route:
```js
import { execFile } from 'child_process';

export function generatePattern(collectionName, folderPath) {
  return new Promise((resolve, reject) => {
    execFile('node', ['scripts/generatePattern.js', collectionName, folderPath],
      (err, stdout) => err ? reject(err) : resolve(stdout)
    );
  });
}
```

---

### Usage example

**When user creates/updates a collection:**
```bash
node scripts/generatePattern.js my-contracts /Users/john/documents/my-contracts
# ✓ Pattern uploaded: enhance_my-contracts
```

**User opens collection, clicks Enhance Prompt:**
```bash
curl -X POST https://your-express-app.com/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt": "summarize key risks", "collectionName": "my-contracts"}'
```
Response:
```json
{ "enhancedPrompt": "Review the my-contracts collection and identify all contractual risks..." }
```

**User reviews enhanced prompt, clicks Submit:**
```bash
curl -X POST https://your-express-app.com/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Review the my-contracts collection and identify all contractual risks..."}'
```
Response:
```json
{ "answer": "The documents contain the following contractual risks..." }
```

---

## Cost Estimate

| Step | Model | Cost per 1M tokens in/out |
|---|---|---|
| Prompt enhancement | claude-haiku-4-5 (remote) | $0.80 / $4.00 |
| Document answer | Ollama local model | Free |

**Approximate cost per enhance click: ~$0.001**
**At 1,000 enhancements/month: ~$1**

Ollama answers are free — the only cost is when the user clicks Enhance Prompt.

---

## Systemd Cheatsheet

```bash
systemctl status fabric      # check fabric is running
journalctl -u fabric -n 20  # view logs
systemctl restart fabric     # restart after config changes
systemctl stop fabric        # stop
systemctl disable fabric     # remove from auto-start
```


----------------------------
grok - analysis


**Excellent architecture!** This is a clean, privacy-first, and cost-effective setup. Separating prompt enhancement (fast/cheap remote Claude Haiku) from heavy document work (local Ollama) is smart. Dynamic per-collection patterns are a clever use of Fabric.

Here are targeted suggestions to improve security, robustness, maintainability, and UX.

### 1. Security & Production Hardening

- **API Key Protection (Critical)**: Never hardcode or expose `FABRIC_API_KEY`. Your Express app is on a Mac (potentially developer machine), so use strong secrets management.
  - Load via `dotenv` (already doing this) + add to `.gitignore`.
  - Consider using OS keychain (e.g., `keytar` or macOS `security` command) or a secrets manager for production.
  - On the server: Rotate the Fabric `--api-key` periodically and use short-lived tokens if possible.

- **Caddy + Security Headers**: Add basic hardening to your Caddyfile:
  ```caddy
  fabric.yourdomain.com {
      reverse_proxy localhost:8081
      header {
          Strict-Transport-Security "max-age=31536000;"
          X-Content-Type-Options nosniff
          X-Frame-Options DENY
          Referrer-Policy no-referrer-when-downgrade
      }
      # Rate limiting (Caddy has built-in support or use a plugin)
  }
  ```

- **Rate Limiting & Abuse Protection**: Add `express-rate-limit` on the `/enhance` route. Fabric/Anthropic costs add up with spam.

- **Input Validation/Sanitization**: Sanitize `collectionName` (alphanumeric + hyphens/underscores only) to prevent path traversal or weird pattern names.

### 2. Fabric / Pattern Improvements

**Model Name**: Update to the current alias if needed. Your `claude-haiku-4-5` looks correct based on recent releases, but confirm with `fabric --list-models` or Anthropic docs.

**Pattern Generation (`generatePattern.js`)**:
- **Better Sampling**: Instead of just filenames, optionally sample *content* from a few small files (first 500-1000 chars) for richer context. Be careful with binary files.
- **Pattern Versioning**: Append a timestamp or hash to patterns (`enhance_my-contracts_v2`) or add an update mechanism.
- **Delete/Update Support**: Add endpoints in FabricClient to delete old patterns when collections are renamed/deleted.
- **Use Fabric's Built-in Improve Prompt Pattern**: For bootstrapping the system prompt itself.

**SSE Handling in `fabricClient.js`**:
Your `collectSSE` is good but can be more robust. Fabric's `/chat` likely uses Server-Sent Events. Consider using a proper SSE parser or the `eventsource` package for cleaner handling of `data:` lines.

### 3. Express App Enhancements

**Caching**:
- Cache `patternExists` results (in-memory with `lru-cache` or Redis if it grows).
- Optionally cache recent enhancements per collection (short TTL).

**Error Handling & Resilience**:
- Add retries for Fabric calls (transient network issues).
- Graceful fallback: If enhancement fails, use the raw prompt with a warning.
- Timeouts on both Fabric and Ollama fetches.

**Better Pattern Management**:
Create a lightweight admin route to list all your custom patterns:
```js
// GET /patterns
const res = await fetch(`${FABRIC_BASE}/patterns/names`);
```

**Async Pattern Generation**:
Instead of blocking the collection creation flow, queue it with `BullMQ` or just fire-and-forget with better logging.

### 4. Code & Architecture Polish

**Environment Variables**:
Add more:
- `FABRIC_TIMEOUT_MS`
- `MAX_ENHANCE_ATTEMPTS`
- `LOG_LEVEL`

**TypeScript Consideration**: Since it's ES6, migrating key files to TypeScript would pay off quickly for this kind of integration-heavy app.

**Ollama Route**:
- Support `system` prompt (context from collection metadata).
- Add options for temperature, context length, etc.
- Consider using Ollama's `/api/chat` instead of `/api/generate` for multi-turn if you expand later.

**generatePattern.js**:
- Make the system prompt even stronger by including RAG-specific instructions if your documents are chunked.
- Add collection metadata (last updated, total docs, etc.) to the pattern.

### 5. UX / Feature Ideas

- **"Enhance Level"** slider (light/medium/aggressive) → different temperature or appended instructions in the pattern.
- **Preview Before Submit**: Show diff between raw and enhanced prompt.
- **Auto-Enhance Toggle** per collection.
- **Pattern Feedback Loop**: After getting a good answer from Ollama, allow "Refine this enhancement" button that feeds back into Fabric.
- **Local Fallback**: Option to run enhancement locally with a smaller model if the remote is down.

### 6. Monitoring & Observability

- PM2: Use `pm2 monit` + enable metrics.
- Add basic logging (Winston or Pino) for enhancement success rate, latency, token usage (if Fabric exposes it).
- Monitor Anthropic spend via their dashboard.

### 7. Alternative/Complementary Ideas

- **Dockerize Fabric** for easier updates/reproducibility.
- Consider **LiteLLM** as a proxy in front of Fabric for easier model switching.
- If you outgrow this, look at self-hosted prompt optimization tools or fine-tuned enhancers.

### Quick Wins (Implement First)

1. Add rate limiting + input sanitization.
2. Improve error handling and fallback in `/enhance`.
3. Enhance `generatePattern.js` to include small content samples.
4. Add Caddy security headers.
5. Implement pattern existence caching.

Your setup is already very thoughtful — privacy-focused, low-cost, and extensible. With these tweaks it will be production-grade.

Would you like me to provide revised code snippets for any specific file (e.g., improved `fabricClient.js`, enhanced pattern generator, or rate-limited routes)? Or focus on a particular area like security or pattern quality?