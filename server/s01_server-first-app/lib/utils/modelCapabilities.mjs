// Model capability lookup: reads a model's native maximum context window from Ollama
// (/api/show) and clamps a requested num_ctx to it. The per-collection search-settings
// formula sizes context from the data alone and does not know the answering model's
// limit; sending a num_ctx above a model's native max is wasteful at best and, for a
// model at its ceiling (e.g. mistral:7b maxes at 32768), a request for more is silently
// capped by the runtime anyway. Clamping here makes the effective value explicit and
// lets callers log/record what was actually used.

const OLLAMA_HOST = 'http://localhost:11434';

// Cache native-max lookups for the process lifetime; model metadata does not change
// between pulls, and /api/show is a non-trivial call.
const maxContextCache = new Map();

// Fallback when /api/show is unreachable or omits the field. 8192 is the smallest native
// window among the installed models (gemma2:2b), so it is a safe floor that will not push
// any model past its real limit.
const DEFAULT_MAX_CONTEXT = 8192;

export async function getModelMaxContext(model) {
  if (!model) return DEFAULT_MAX_CONTEXT;
  if (maxContextCache.has(model)) return maxContextCache.get(model);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`/api/show ${res.status}`);

    const data = await res.json();
    const info = data.model_info || {};
    const arch = info['general.architecture'];
    const max = arch ? info[`${arch}.context_length`] : null;

    const resolved = Number.isInteger(max) && max > 0 ? max : DEFAULT_MAX_CONTEXT;
    maxContextCache.set(model, resolved);
    return resolved;
  } catch (error) {
    console.warn(`[modelCapabilities] could not read max context for "${model}": ${error.message}; using ${DEFAULT_MAX_CONTEXT}`);
    // Cache the fallback too, so one failure does not re-hit /api/show every query.
    maxContextCache.set(model, DEFAULT_MAX_CONTEXT);
    return DEFAULT_MAX_CONTEXT;
  }
}

// Clamp a requested context size to the model's native max. Returns the effective value
// plus whether it was clamped, so the caller can log/record it.
export async function clampContextToModel(model, requestedContext) {
  const requested = Number(requestedContext) || 0;
  const max = await getModelMaxContext(model);
  if (requested > max) {
    return { contextSize: max, maxContext: max, clamped: true, requested };
  }
  return { contextSize: requested, maxContext: max, clamped: false, requested };
}
