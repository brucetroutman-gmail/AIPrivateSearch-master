// Per-run resource capture. After a generation, Ollama keeps the model resident for a
// short window; /api/ps reports its real resident size, loaded context window and digest.
// Recording these per run (keyed by PcCode + model + digest + context) builds an
// observational dataset of what each model actually costs on each machine — replacing the
// analytical KV-cache estimate, which was measured to be wrong for several architectures
// (gemma4 interleaved attention, qwen3.5). Self-healing: new models start accruing data on
// first use; a re-quantized model gets a new digest so stale rows are not reused.

const OLLAMA_HOST = 'http://localhost:11434';

// Read the resident footprint of a specific model from /api/ps. Returns null when the
// model is not currently loaded (e.g. it was evicted before we looked) — callers must
// treat resource capture as best-effort and never fail a search because of it.
export async function captureModelResources(model) {
  if (!model) return null;
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/ps`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = (data.models || []).find(m => m.name === model || m.model === model);
    if (!entry) return null;

    const sizeBytes = Number(entry.size) || null;
    const vramBytes = Number(entry.size_vram) || 0;
    return {
      residentBytes: sizeBytes,
      residentMB: sizeBytes != null ? Math.round(sizeBytes / (1024 * 1024)) : null,
      vramBytes,
      loadedContext: Number(entry.context_length) || null,
      digest: entry.digest ? String(entry.digest).slice(0, 32) : null
    };
  } catch {
    return null; // best-effort; never throw into the search path
  }
}
