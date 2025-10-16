Last login: Mon Oct 13 12:07:04 on ttys000
/Users/aisecure/Downloads/load-aiss-1008.command ; exit;
aisecure@Mac-mini ~ % /Users/aisecure/Downloads/load-aiss-1008.command ; exit;
🔄 AIPrivateSearch One-Click Installer
====================================
🔍 Checking for running AIPrivateSearch processes...
✅ No running processes detected, proceeding with installation...
🔍 Checking for Node.js...
❌ Node.js not found.
   AIPrivateSearch requires Node.js to run.

Would you like to install Node.js now? (y/n): y
📦 Installing Node.js...
   Downloading Node.js installer...
   Installing Node.js (may require admin password)...
Password:
✅ Node.js installed: v20.11.0
🔍 Checking for Ollama...
❌ Ollama not found.
   AIPrivateSearch requires Ollama to run AI models locally.

Would you like to install Ollama now? (y/n): y
📦 Installing Ollama...
   Downloading Ollama installer...
   Installing Ollama...
   ✅ Ollama installed successfully
🔍 Checking for Chrome browser...
❌ Chrome browser not found.
   AIPrivateSearch requires Chrome browser for optimal performance.

Would you like to install Chrome now? (y/n): y
📦 Installing Chrome...
   Downloading Chrome installer...
   Installing Chrome...
   ✅ Chrome installed successfully
✅ All prerequisites checked and installed

📂 Navigating to /Users/Shared...
📁 Creating repos directory...
📂 Changed to: /Users/Shared/repos
📥 Downloading latest version from GitHub...
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100 55.5M    0 55.5M    0     0  5500k      0 --:--:--  0:00:10 --:--:-- 6968k
   Extracting repository...
   ✅ Repository downloaded successfully
📝 Creating .env configuration file...
   ✅ .env file created at /Users/Shared/.env
   💡 Database configured for remote MySQL server
🚀 Starting AIPrivateSearch...
🚀 Starting AI Search & Score Application...
Stopping any existing servers...
🔍 Checking Ollama service...
🚀 Starting Ollama service...
Couldn't find '/Users/aisecure/.ollama/id_ed25519'. Generating new private key.
Your new public key is: 

ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOtVwM52Z9nOFvzG6nzd/GATCARaG3nfh4Hp4XTkUgev

time=2025-10-13T12:58:39.747-04:00 level=INFO source=routes.go:1481 msg="server config" env="map[HTTPS_PROXY: HTTP_PROXY: NO_PROXY: OLLAMA_CONTEXT_LENGTH:4096 OLLAMA_DEBUG:INFO OLLAMA_FLASH_ATTENTION:false OLLAMA_GPU_OVERHEAD:0 OLLAMA_HOST:http://127.0.0.1:11434 OLLAMA_KEEP_ALIVE:5m0s OLLAMA_KV_CACHE_TYPE: OLLAMA_LLM_LIBRARY: OLLAMA_LOAD_TIMEOUT:5m0s OLLAMA_MAX_LOADED_MODELS:0 OLLAMA_MAX_QUEUE:512 OLLAMA_MODELS:/Users/aisecure/.ollama/models OLLAMA_MULTIUSER_CACHE:false OLLAMA_NEW_ENGINE:false OLLAMA_NOHISTORY:false OLLAMA_NOPRUNE:false OLLAMA_NUM_PARALLEL:1 OLLAMA_ORIGINS:[http://localhost https://localhost http://localhost:* https://localhost:* http://127.0.0.1 https://127.0.0.1 http://127.0.0.1:* https://127.0.0.1:* http://0.0.0.0 https://0.0.0.0 http://0.0.0.0:* https://0.0.0.0:* app://* file://* tauri://* vscode-webview://* vscode-file://*] OLLAMA_REMOTES:[ollama.com] OLLAMA_SCHED_SPREAD:false http_proxy: https_proxy: no_proxy:]"
time=2025-10-13T12:58:39.748-04:00 level=INFO source=images.go:522 msg="total blobs: 0"
time=2025-10-13T12:58:39.748-04:00 level=INFO source=images.go:529 msg="total unused blobs removed: 0"
time=2025-10-13T12:58:39.748-04:00 level=INFO source=routes.go:1534 msg="Listening on 127.0.0.1:11434 (version 0.12.5)"
time=2025-10-13T12:58:39.748-04:00 level=INFO source=runner.go:80 msg="discovering available GPUs..."
time=2025-10-13T12:58:43.583-04:00 level=INFO source=types.go:112 msg="inference compute" id=0 library=Metal compute=0.0 name=Metal description="Apple M4" libdirs="" driver=0.0 pci_id=00:00.0 type=discrete total="10.7 GiB" available="10.7 GiB"
time=2025-10-13T12:58:43.583-04:00 level=INFO source=routes.go:1575 msg="entering low vram mode" "total vram"="10.7 GiB" threshold="20.0 GiB"
[GIN] 2025/10/13 - 12:58:43 | 200 |     253.917µs |       127.0.0.1 | GET      "/api/tags"
✅ Ollama is accessible
Checking model status...
🔍 Checking all required models...
[GIN] 2025/10/13 - 12:58:43 | 200 |      37.041µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 12:58:43 | 200 |      46.625µs |       127.0.0.1 | GET      "/api/tags"
❌ Missing: all-minilm
📥 Pulling all-minilm...
[GIN] 2025/10/13 - 12:58:43 | 200 |      10.333µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T12:58:44.296-04:00 level=INFO source=download.go:177 msg="downloading 797b70c4edf8 in 1 45 MB part(s)"
time=2025-10-13T12:58:48.534-04:00 level=INFO source=download.go:177 msg="downloading c71d239df917 in 1 11 KB part(s)"
time=2025-10-13T12:58:49.775-04:00 level=INFO source=download.go:177 msg="downloading 85011998c600 in 1 16 B part(s)"
time=2025-10-13T12:58:51.012-04:00 level=INFO source=download.go:177 msg="downloading 548455b72658 in 1 407 B part(s)"
[GIN] 2025/10/13 - 12:58:52 | 200 |     8.525132s |       127.0.0.1 | POST     "/api/pull"
✅ all-minilm ready
[GIN] 2025/10/13 - 12:58:54 | 200 |      29.292µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 12:58:54 | 200 |     411.375µs |       127.0.0.1 | GET      "/api/tags"
❌ Missing: BGE-M3
📥 Pulling BGE-M3...
[GIN] 2025/10/13 - 12:58:54 | 200 |      17.167µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T12:58:54.824-04:00 level=INFO source=download.go:177 msg="downloading daec91ffb5dd in 12 100 MB part(s)"
time=2025-10-13T13:00:32.406-04:00 level=INFO source=download.go:177 msg="downloading a406579cd136 in 1 1.1 KB part(s)"
time=2025-10-13T13:00:33.645-04:00 level=INFO source=download.go:177 msg="downloading 0c4c9c2a325f in 1 337 B part(s)"
[GIN] 2025/10/13 - 13:00:35 | 200 |         1m40s |       127.0.0.1 | POST     "/api/pull"
✅ BGE-M3 ready
[GIN] 2025/10/13 - 13:00:37 | 200 |      27.167µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:00:37 | 200 |     549.667µs |       127.0.0.1 | GET      "/api/tags"
❌ Missing: embeddinggemma
📥 Pulling embeddinggemma...
[GIN] 2025/10/13 - 13:00:37 | 200 |      27.834µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:00:37.658-04:00 level=INFO source=download.go:177 msg="downloading 0800cbac9c20 in 7 100 MB part(s)"
time=2025-10-13T13:01:40.848-04:00 level=INFO source=download.go:177 msg="downloading 1adbfec9dcf0 in 1 8.4 KB part(s)"
time=2025-10-13T13:01:42.048-04:00 level=INFO source=download.go:177 msg="downloading 45dc10444b87 in 1 34 B part(s)"
time=2025-10-13T13:01:43.259-04:00 level=INFO source=download.go:177 msg="downloading 3901c6a1d7c2 in 1 416 B part(s)"
[GIN] 2025/10/13 - 13:01:44 | 200 |          1m7s |       127.0.0.1 | POST     "/api/pull"
✅ embeddinggemma ready
[GIN] 2025/10/13 - 13:01:46 | 200 |      28.792µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:01:46 | 200 |     844.375µs |       127.0.0.1 | GET      "/api/tags"
❌ Missing: gemma2:2b
📥 Pulling gemma2:2b...
[GIN] 2025/10/13 - 13:01:46 | 200 |      18.542µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:01:47.112-04:00 level=INFO source=download.go:177 msg="downloading 7462734796d6 in 16 101 MB part(s)"
time=2025-10-13T13:03:58.504-04:00 level=INFO source=download.go:177 msg="downloading e0a42594d802 in 1 358 B part(s)"
time=2025-10-13T13:03:59.743-04:00 level=INFO source=download.go:177 msg="downloading 097a36493f71 in 1 8.4 KB part(s)"
time=2025-10-13T13:04:00.952-04:00 level=INFO source=download.go:177 msg="downloading 2490e7468436 in 1 65 B part(s)"
time=2025-10-13T13:04:02.186-04:00 level=INFO source=download.go:177 msg="downloading e18ad7af7efb in 1 487 B part(s)"
[GIN] 2025/10/13 - 13:04:03 | 200 |         2m17s |       127.0.0.1 | POST     "/api/pull"
✅ gemma2:2b ready
[GIN] 2025/10/13 - 13:04:05 | 200 |      28.875µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:04:05 | 200 |    1.040875ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: gemma2:9b
📥 Pulling gemma2:9b...
[GIN] 2025/10/13 - 13:04:05 | 200 |      13.625µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:04:06.457-04:00 level=INFO source=download.go:177 msg="downloading ff1d1fc78170 in 16 340 MB part(s)"
time=2025-10-13T13:11:38.854-04:00 level=INFO source=download.go:177 msg="downloading 109037bec39c in 1 136 B part(s)"
time=2025-10-13T13:11:40.130-04:00 level=INFO source=download.go:177 msg="downloading 10aa81da732e in 1 487 B part(s)"
[GIN] 2025/10/13 - 13:11:43 | 200 |         7m37s |       127.0.0.1 | POST     "/api/pull"
✅ gemma2:9b ready
[GIN] 2025/10/13 - 13:11:45 | 200 |      30.791µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:11:45 | 200 |    2.682208ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: llama3.2:3b
📥 Pulling llama3.2:3b...
[GIN] 2025/10/13 - 13:11:45 | 200 |      13.625µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:11:45.983-04:00 level=INFO source=download.go:177 msg="downloading dde5aa3fc5ff in 16 126 MB part(s)"
time=2025-10-13T13:14:29.328-04:00 level=INFO source=download.go:177 msg="downloading 966de95ca8a6 in 1 1.4 KB part(s)"
time=2025-10-13T13:14:30.534-04:00 level=INFO source=download.go:177 msg="downloading fcc5a6bec9da in 1 7.7 KB part(s)"
time=2025-10-13T13:14:31.758-04:00 level=INFO source=download.go:177 msg="downloading a70ff7e570d9 in 1 6.0 KB part(s)"
time=2025-10-13T13:14:32.984-04:00 level=INFO source=download.go:177 msg="downloading 56bb8bd477a5 in 1 96 B part(s)"
time=2025-10-13T13:14:34.199-04:00 level=INFO source=download.go:177 msg="downloading 34bb5ab01051 in 1 561 B part(s)"
[GIN] 2025/10/13 - 13:14:36 | 200 |         2m50s |       127.0.0.1 | POST     "/api/pull"
✅ llama3.2:3b ready
[GIN] 2025/10/13 - 13:14:38 | 200 |      30.083µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:14:38 | 200 |    1.744875ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: mistral:7b
📥 Pulling mistral:7b...
[GIN] 2025/10/13 - 13:14:38 | 200 |      14.959µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:14:38.593-04:00 level=INFO source=download.go:177 msg="downloading f5074b1221da in 16 273 MB part(s)"
time=2025-10-13T13:20:22.964-04:00 level=INFO source=download.go:177 msg="downloading 43070e2d4e53 in 1 11 KB part(s)"
time=2025-10-13T13:20:24.249-04:00 level=INFO source=download.go:177 msg="downloading 1ff5b64b61b9 in 1 799 B part(s)"
time=2025-10-13T13:20:25.506-04:00 level=INFO source=download.go:177 msg="downloading ed11eda7790d in 1 30 B part(s)"
time=2025-10-13T13:20:26.750-04:00 level=INFO source=download.go:177 msg="downloading 1064e17101bd in 1 487 B part(s)"
[GIN] 2025/10/13 - 13:20:29 | 200 |         5m51s |       127.0.0.1 | POST     "/api/pull"
✅ mistral:7b ready
[GIN] 2025/10/13 - 13:20:31 | 200 |      31.125µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:20:31 | 200 |    2.041542ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: nomic-embed-text
📥 Pulling nomic-embed-text...
[GIN] 2025/10/13 - 13:20:31 | 200 |      21.208µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:20:32.055-04:00 level=INFO source=download.go:177 msg="downloading 970aa74c0a90 in 3 100 MB part(s)"
time=2025-10-13T13:20:53.327-04:00 level=INFO source=download.go:177 msg="downloading ce4a164fc046 in 1 17 B part(s)"
time=2025-10-13T13:20:54.555-04:00 level=INFO source=download.go:177 msg="downloading 31df23ea7daa in 1 420 B part(s)"
[GIN] 2025/10/13 - 13:20:55 | 200 | 24.214286167s |       127.0.0.1 | POST     "/api/pull"
✅ nomic-embed-text ready
[GIN] 2025/10/13 - 13:20:57 | 200 |        28.5µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:20:57 | 200 |    1.548292ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: phi3:3.8b
📥 Pulling phi3:3.8b...
[GIN] 2025/10/13 - 13:20:57 | 200 |      16.292µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:20:58.332-04:00 level=INFO source=download.go:177 msg="downloading 633fc5be925f in 16 136 MB part(s)"
time=2025-10-13T13:23:53.749-04:00 level=INFO source=download.go:177 msg="downloading fa8235e5b48f in 1 1.1 KB part(s)"
time=2025-10-13T13:23:54.976-04:00 level=INFO source=download.go:177 msg="downloading 542b217f179c in 1 148 B part(s)"
time=2025-10-13T13:23:56.260-04:00 level=INFO source=download.go:177 msg="downloading 8dde1baf1db0 in 1 78 B part(s)"
time=2025-10-13T13:23:57.517-04:00 level=INFO source=download.go:177 msg="downloading 23291dc44752 in 1 483 B part(s)"
[GIN] 2025/10/13 - 13:23:59 | 200 |          3m1s |       127.0.0.1 | POST     "/api/pull"
✅ phi3:3.8b ready
[GIN] 2025/10/13 - 13:24:01 | 200 |      21.917µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:24:01 | 200 |    3.406042ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: qwen2:0.5b
📥 Pulling qwen2:0.5b...
[GIN] 2025/10/13 - 13:24:01 | 200 |          22µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:24:01.982-04:00 level=INFO source=download.go:177 msg="downloading 8de95da68dc4 in 4 100 MB part(s)"
time=2025-10-13T13:24:48.234-04:00 level=INFO source=download.go:177 msg="downloading 62fbfd9ed093 in 1 182 B part(s)"
time=2025-10-13T13:24:49.506-04:00 level=INFO source=download.go:177 msg="downloading c156170b718e in 1 11 KB part(s)"
time=2025-10-13T13:24:50.775-04:00 level=INFO source=download.go:177 msg="downloading f02dd72bb242 in 1 59 B part(s)"
time=2025-10-13T13:24:51.994-04:00 level=INFO source=download.go:177 msg="downloading 2184ab82477b in 1 488 B part(s)"
[GIN] 2025/10/13 - 13:24:53 | 200 | 51.754222875s |       127.0.0.1 | POST     "/api/pull"
✅ qwen2:0.5b ready
[GIN] 2025/10/13 - 13:24:55 | 200 |      20.834µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:24:55 | 200 |    3.492416ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: qwen2.5-coder:1.5b
📥 Pulling qwen2.5-coder:1.5b...
[GIN] 2025/10/13 - 13:24:55 | 200 |       15.25µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:24:55.966-04:00 level=INFO source=download.go:177 msg="downloading 29d8c98fa6b0 in 10 100 MB part(s)"
time=2025-10-13T13:26:23.250-04:00 level=INFO source=download.go:177 msg="downloading 66b9ea09bd5b in 1 68 B part(s)"
time=2025-10-13T13:26:24.530-04:00 level=INFO source=download.go:177 msg="downloading 1e65450c3067 in 1 1.6 KB part(s)"
time=2025-10-13T13:26:25.800-04:00 level=INFO source=download.go:177 msg="downloading 832dd9e00a68 in 1 11 KB part(s)"
time=2025-10-13T13:26:27.051-04:00 level=INFO source=download.go:177 msg="downloading 152cb442202b in 1 487 B part(s)"
[GIN] 2025/10/13 - 13:26:28 | 200 |         1m33s |       127.0.0.1 | POST     "/api/pull"
✅ qwen2.5-coder:1.5b ready
[GIN] 2025/10/13 - 13:26:30 | 200 |      32.917µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:26:30 | 200 |    4.589167ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: qwen2.5:3b
📥 Pulling qwen2.5:3b...
[GIN] 2025/10/13 - 13:26:30 | 200 |          11µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:26:31.165-04:00 level=INFO source=download.go:177 msg="downloading 5ee4f07cdb9b in 16 120 MB part(s)"
time=2025-10-13T13:28:55.524-04:00 level=INFO source=download.go:177 msg="downloading eb4402837c78 in 1 1.5 KB part(s)"
time=2025-10-13T13:28:56.707-04:00 level=INFO source=download.go:177 msg="downloading b5c0e5cf74cf in 1 7.4 KB part(s)"
time=2025-10-13T13:28:57.927-04:00 level=INFO source=download.go:177 msg="downloading 161ddde4c9cd in 1 487 B part(s)"
[GIN] 2025/10/13 - 13:28:59 | 200 |         2m29s |       127.0.0.1 | POST     "/api/pull"
✅ qwen2.5:3b ready
[GIN] 2025/10/13 - 13:29:01 | 200 |      27.333µs |       127.0.0.1 | HEAD     "/"
[GIN] 2025/10/13 - 13:29:01 | 200 |    5.095125ms |       127.0.0.1 | GET      "/api/tags"
❌ Missing: qwen2.5:7b
📥 Pulling qwen2.5:7b...
[GIN] 2025/10/13 - 13:29:01 | 200 |      15.875µs |       127.0.0.1 | HEAD     "/"
time=2025-10-13T13:29:02.187-04:00 level=INFO source=download.go:177 msg="downloading 2bada8a74506 in 16 292 MB part(s)"
time=2025-10-13T13:35:01.561-04:00 level=INFO source=download.go:177 msg="downloading 2f15b3218f05 in 1 487 B part(s)"
[GIN] 2025/10/13 - 13:35:04 | 200 |          6m2s |       127.0.0.1 | POST     "/api/pull"
✅ qwen2.5:7b ready
💡 To update or install additional models, use the Models page in the application
Preparing backend server...
✅ .env file found in /Users/Shared
📦 First time setup - installing dependencies...
📦 Installing dependencies (pure JavaScript - no compilation needed)...
npm notice 
npm notice New major version of npm available! 10.2.4 -> 11.6.2
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.2
npm notice Run npm install -g npm@11.6.2 to update!
npm notice 
✅ Dependencies installed successfully
Starting backend server...

> ai-search-score-server@18.10 start
> node server.mjs

Database pool created successfully
Server running on port 3001
Starting frontend client...
npm WARN exec The following package was not found and will be installed: serve@14.2.5
✅ Frontend server started successfully

✅ Application started successfully!
🔗 Frontend: http://localhost:3000
🔗 Backend API: http://localhost:3001

🌐 Opening Chrome browser...

   ┌────────────────────────────────────────────┐
   │                                            │
   │   Serving!                                 │
   │                                            │
   │   - Local:    http://localhost:3000        │
   │   - Network:  http://192.168.12.218:3000   │
   │                                            │
   │   Copied local address to clipboard!       │
   │                                            │
   └────────────────────────────────────────────┘


Press Ctrl+C to stop both servers

⚠️  Apple Silicon Mac detected:
   If terminal hangs after Ctrl+C, simply close the Terminal window.
   This is a known macOS Terminal.app issue on M1/M4 Macs.

 HTTP  10/13/2025 1:35:28 PM ::1 GET /
 HTTP  10/13/2025 1:35:28 PM ::1 Returned 200 in 30 ms
 HTTP  10/13/2025 1:35:28 PM ::1 GET /shared/styles.css
 HTTP  10/13/2025 1:35:28 PM ::1 GET /csrf.js
 HTTP  10/13/2025 1:35:28 PM ::1 Returned 200 in 1 ms
 HTTP  10/13/2025 1:35:28 PM ::1 Returned 200 in 1 ms
 HTTP  10/13/2025 1:35:28 PM ::1 GET /shared/common.js
 HTTP  10/13/2025 1:35:28 PM ::1 Returned 200 in 1 ms
 HTTP  10/13/2025 1:35:28 PM ::1 GET /shared/utils/logger.js
 HTTP  10/13/2025 1:35:28 PM ::1 Returned 200 in 1 ms
 HTTP  10/13/2025 1:35:28 PM ::1 GET /favicon.ico
 HTTP  10/13/2025 1:35:28 PM ::1 Returned 404 in 1 ms
 HTTP  10/13/2025 2:57:44 PM ::1 GET /shared/header.html
 HTTP  10/13/2025 2:57:44 PM ::1 Returned 301 in 2 ms
 HTTP  10/13/2025 2:57:44 PM ::1 GET /shared/header
 HTTP  10/13/2025 2:57:44 PM ::1 Returned 200 in 2 ms
 HTTP  10/13/2025 2:57:44 PM ::1 GET /shared/footer.html
 HTTP  10/13/2025 2:57:44 PM ::1 Returned 301 in 1 ms
 HTTP  10/13/2025 2:57:44 PM ::1 GET /shared/footer
 HTTP  10/13/2025 2:57:44 PM ::1 Returned 200 in 1 ms

