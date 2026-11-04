// Derives per-collection search settings (topK, temperature, contextSize, tokenLimit)
// from the collection's chunk statistics. Pure function so it can be tested directly.
//
// The context window (Ollama num_ctx) has to hold BOTH the prompt and the generated
// answer. The previous formula sized it from topK x avgChunkSize / 4 + a flat 1024, which:
//   - ignored the answer budget (tokenLimit), and
//   - assumed 4 chars/token, but measured on these corpora (llama3.1 prompt_eval_count)
//     structured text (markdown records, emails) is ~3.1-3.7 chars/token and only prose
//     reaches ~4.5, and
//   - ignored the per-source header ("**Source N: filename**") and fixed prompt text.
// When the prompt does not fit, Ollama silently truncates it, which showed up as
// degenerate answers (e.g. a bare "Source 1, Source 2, ..." list).

// Conservative chars-per-token by collection profile (measured 3.1-3.7 structured, ~4.5 prose).
const CHARS_PER_TOKEN_STRUCTURED = 3;
const CHARS_PER_TOKEN_PROSE = 4;

// Fixed prompt text: instruction preamble, question, "Answer:" cue.
const PROMPT_BOILERPLATE_TOKENS = 450;
// "**Source N: filename**\n" header plus separators for each retrieved chunk.
const PER_SOURCE_TOKENS = 25;
// Retrieved chunks run slightly larger than the collection average (measured 0.86-1.06x
// on the sample collections); keep a modest margin rather than stacking several.
const CHUNK_SIZE_MARGIN = 1.1;

const MIN_CONTEXT = 4096;
const MAX_CONTEXT = 32768;

const nextPow2 = (n) => Math.pow(2, Math.ceil(Math.log2(n)));

export function calculateSearchSettings({ totalChunks, totalDocs, avgChunkSize }) {
  // topK: 5% of chunks, rounded up to a multiple of 5 (the topK dropdown and the test-code
  // map only know 5,10,...,30), capped 10-30
  const topK = Math.min(30, Math.max(10, Math.ceil((totalChunks * 0.05) / 5) * 5));

  // Collection profile from avg chunk size and chunks-per-document:
  //   short structured: emails, small records (avg < 600 chars or ~1 chunk per doc)
  //   long prose:       literature, historical (avg > 1500, many chunks per doc)
  const chunksPerDoc = totalDocs > 0 ? totalChunks / totalDocs : 1;
  const isShortDocs = avgChunkSize < 600 || chunksPerDoc <= 1.5;
  const isLongProse = avgChunkSize > 1500 && chunksPerDoc > 10;

  // Temperature: factual/structured=0.1, analytical/prose=0.3
  const temperature = isShortDocs ? 0.1 : isLongProse ? 0.3 : 0.1;

  // Answer budget: long prose gets room for longer answers.
  const tokenLimit = isLongProse ? 2048 : 1024;

  // Context = prompt (boilerplate + topK chunks incl. headers) + answer budget.
  const charsPerToken = isLongProse ? CHARS_PER_TOKEN_PROSE : CHARS_PER_TOKEN_STRUCTURED;
  const tokensPerChunk = Math.ceil((avgChunkSize * CHUNK_SIZE_MARGIN) / charsPerToken) + PER_SOURCE_TOKENS;
  const promptTokens = PROMPT_BOILERPLATE_TOKENS + topK * tokensPerChunk;
  const tokensNeeded = promptTokens + tokenLimit;
  const contextSize = Math.min(MAX_CONTEXT, Math.max(MIN_CONTEXT, nextPow2(tokensNeeded)));

  return { topK, temperature, contextSize, tokenLimit, estimatedPromptTokens: promptTokens };
}
