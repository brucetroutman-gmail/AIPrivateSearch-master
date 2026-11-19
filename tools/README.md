# AIPrivateSearch Development Tools

## Demo and support scripts

**`no-data-share.sh` — privacy demo.** Runs a small local model through Ollama, then checks
network connections to show that Ollama made no external connections while processing.
Starts Ollama if needed and downloads a small model once if none is installed.
```bash
bash tools/no-data-share.sh
```

**`clear-aips-storage.js` — selective browser reset.** A snippet to paste into the browser
console on an AIPrivateSearch page. It removes only AIPS-related items from localStorage,
sessionStorage and localhost cookies, and leaves other sites alone. For a complete test reset
that also clears device registration, use `clear-storage.sh` in the repo root instead.
