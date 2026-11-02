/**
 * chunkSanitizer
 *
 * Retrieved chunk content is sometimes decorated with display-only markup that is
 * meant for the search-results UI, not for a language model. For example SmartSearch
 * prepends a relevance banner to each result:
 *
 *   <strong>73% match</strong> - Contains: parts<br><br>...actual content...
 *
 * When a chunk carrying that banner is fed into a RAG prompt (or into the scoring
 * prompt), the model reads the HTML tags and the "N% match - Contains: …" noise as if
 * it were document text. This strips that decoration back down to clean prose so the
 * only thing the model sees is the real document content.
 *
 * The transformation is conservative: it removes known UI wrappers and the relevance
 * banner, converts <br> to newlines, and drops any remaining HTML tags. It does NOT
 * alter the underlying document text.
 */

/**
 * Remove display-only markup from a single chunk's text content.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeChunkText(text) {
  if (typeof text !== 'string' || text.length === 0) return text || '';

  let out = text;

  // 1. Drop the SmartSearch relevance banner that leads a formatted excerpt, e.g.
  //    "<strong>73% match</strong> - Contains: parts" or "... - Related to: ...".
  //    Handles the banner whether or not the <strong> tags are present.
  out = out.replace(
    /<strong>\s*\d+%\s*match\s*<\/strong>\s*-\s*(?:Contains|Related to)\s*:[^\n<]*/gi,
    ''
  );
  out = out.replace(
    /\b\d+%\s*match\b\s*-\s*(?:Contains|Related to)\s*:[^\n<]*/gi,
    ''
  );
  // Also remove a bare "<strong>NN% match</strong>" / "NN% match" with no suffix.
  out = out.replace(/<strong>\s*\d+%\s*match\s*<\/strong>/gi, '');

  // 2. Remove the "[View Document](url)" link that SmartSearch/Hybrid excerpts append.
  //    This is a UI affordance, not document text, and the model should never see it.
  out = out.replace(/\[View Document\]\([^)]*\)/gi, '');

  // 3. Remove index front-matter that can ride along at the top of a chunk, e.g.
  //    "---\nDocID: Fed_456979\n---". Strip the DocID line and empty fence lines.
  out = out.replace(/^---\s*\n?/gm, '');
  out = out.replace(/^DocID:\s*\S+\s*$/gim, '');

  // 4. Convert line-break tags to real newlines before stripping remaining tags.
  out = out.replace(/<br\s*\/?>/gi, '\n');

  // 5. Remove any remaining HTML tags (e.g. <strong>, </strong>, <mark ...>, </hgroup>).
  out = out.replace(/<\/?[a-z][^>]*>/gi, '');

  // 6. Collapse the leading whitespace/newlines left behind by removed banners.
  out = out.replace(/^[\s\n]+/, '');
  // Collapse 3+ consecutive newlines down to a double newline.
  out = out.replace(/\n{3,}/g, '\n\n');

  return out;
}

/**
 * Sanitize the content of a list of chunks (strings or objects with content/excerpt).
 * Returns a new array; input chunks are not mutated.
 * @param {Array<string|object>} chunks
 * @returns {Array<string|object>}
 */
export function sanitizeChunks(chunks) {
  if (!Array.isArray(chunks)) return chunks;
  return chunks.map((c) => {
    if (typeof c === 'string') return sanitizeChunkText(c);
    if (c && typeof c === 'object') {
      const copy = { ...c };
      if (typeof copy.content === 'string') copy.content = sanitizeChunkText(copy.content);
      if (typeof copy.excerpt === 'string') copy.excerpt = sanitizeChunkText(copy.excerpt);
      return copy;
    }
    return c;
  });
}
