 
 
import { SetupGuidance } from '../utils/setupGuidance.mjs';
import { sanitizeChunkText } from '../utils/chunkSanitizer.mjs';
import { clampContextToModel } from '../utils/modelCapabilities.mjs';
import natural from 'natural';
const { TfIdf } = natural;
import { LineSearch } from './LineSearch.mjs';
import { SmartSearch } from './SmartSearch.mjs';

export class HybridSearch {
  constructor() {
    this.name = 'Hybrid Search';
    this.description = 'Combined traditional and vector methods';
    this.traditionalSearch = new LineSearch();
    this.vectorSearch = new SmartSearch();
    this.tfidf = new TfIdf();
    this.documents = new Map();
    this.indexedCollection = null;
  }

  async search(query, options = {}) {
    const {
      collection = null,
      keywordWeight = 0.3,
      semanticWeight = 0.7,
      topK = 5,
      model = null,
      temperature = 0.3,
      contextSize = 4096,
      tokenLimit = null
    } = options;
    
    try {
      console.log(`Hybrid search for: "${query}" in ${collection}`);
      
      await this.ensureInitialized(collection);
      
      // Get results from both methods. The semantic pool is deliberately the whole
      // collection: findSimilarChunks already computes a cosine similarity for every
      // chunk before slicing, so asking for all of them costs nothing extra and means
      // every chunk that reaches the prompt carries a real similarity (a keyword-only
      // hit would otherwise be recorded with similarity 0). topK still limits what is
      // sent to the model, below.
      const keywordResults = await this.getKeywordResults(query, collection, topK * 2);
      const semanticResults = await this.getSemanticResults(query, collection, Number.MAX_SAFE_INTEGER);
      
      // Check if no semantic results due to missing embeddings
      if (semanticResults.length === 0 && keywordResults.length === 0) {
        return SetupGuidance.createHybridEmbeddingsRequiredResult(collection);
      }
      
      // Combine and rerank results
      const combinedResults = this.combineResults(
        keywordResults,
        semanticResults,
        keywordWeight,
        semanticWeight
      );

      const topResults = combinedResults.slice(0, topK);

      // RAG generation step: package the reranked hybrid results into a prompt and
      // send to the LLM for a grounded answer. When no model is supplied, fall back
      // to retrieval-only output (ranked excerpts) for backward compatibility.
      if (model) {
        const { response: aiResponse, fullPrompt } = await this.generateAIResponse(
          query, topResults, model, temperature, contextSize, tokenLimit, collection
        );

        const finalResponse = aiResponse + this.addSourceLinks(topResults, collection);

        return {
          results: [{
            id: `hybrid_search_${Date.now()}`,
            title: 'Hybrid Analysis',
            excerpt: finalResponse,
            // Model prose only (no server-appended source links). Used for scoring so
            // the non-answer guard sees the real answer, not the boilerplate link list.
            answerOnly: aiResponse,
            score: 0.8,
            source: `${topResults.length} reranked documents`,
            chunks: topResults.map(doc => ({
              filename: doc.filename,
              chunk_index: doc.chunk_index ?? null,
              content: doc.content,
              similarity: doc.semanticScore ?? doc.hybridScore ?? null
            }))
          }],
          method: 'hybrid-search',
          total: 1,
          fullPrompt
        };
      }

      // Retrieval-only fallback (no model): return reranked document excerpts.
      return {
        results: topResults.map(doc => {
          const documentPath = `http://localhost:56306/api/documents/${doc.collection}/${encodeURIComponent(doc.filename)}/view`;
          const scoreBreakdown = `**Hybrid Score: ${Math.round(doc.hybridScore * 100)}%**\n` +
            `Keyword: ${Math.round(doc.keywordScore * 100)}% × ${keywordWeight} + ` +
            `Semantic: ${Math.round(doc.semanticScore * 100)}% × ${semanticWeight}`;
          const contentExcerpt = doc.content.substring(0, 200) + '...';
          const formattedExcerpt = `${scoreBreakdown}\n\n${contentExcerpt}\n\n[View Document](${documentPath})`;
          
          return {
            id: doc.id,
            title: `${doc.filename.replace('.md', '').replace(/[_-]/g, ' ')} (part ${(doc.chunk_index ?? 0) + 1})`,
            excerpt: formattedExcerpt,
            score: doc.hybridScore,
            source: doc.filename,
            breakdown: {
              keyword: doc.keywordScore,
              semantic: doc.semanticScore,
              weights: { keywordWeight, semanticWeight }
            }
          };
        }),
        method: 'hybrid-search',
        total: combinedResults.length
      };
    } catch (error) {
      throw new Error(`Hybrid search failed: ${error.message}`);
    }
  }

  // Build a RAG prompt from the reranked hybrid documents and send to Ollama.
  // Mirrors the AI Document Chat prompt structure so FullPrompt capture and scoring
  // behave consistently across the two generative document methods.
  async generateAIResponse(query, docs, model, temperature = 0.3, contextSize = 4096, tokenLimit = null, collection = null) {
    const context = docs.map((doc, index) =>
      `**Source ${index + 1}: ${doc.filename}**\n${sanitizeChunkText(doc.content)}`
    ).join('\n\n');

    const options = {
      temperature: temperature,
      num_ctx: (await clampContextToModel(model, contextSize)).contextSize,
      thinking: false
    };
    if (tokenLimit && tokenLimit !== 'No Limit') {
      options.num_predict = parseInt(tokenLimit);
    }

    const enhancedPrompt = `You are analyzing document excerpts to answer a question.

Work through the following internally — do NOT include these steps, their numbers, or any description of your process in your reply:
- Identify which excerpts are relevant to the question
- Extract the specific facts from each relevant excerpt
- Connect facts across excerpts that refer to the same entity (e.g. same patient, same client, same topic)
- If the information is not present in the excerpts, say so clearly

Document excerpts:
${context}

Question: ${query}

Write only the final answer below. State the answer in words — describe what the relevant excerpts actually say. Cite source numbers in parentheses after each fact (e.g. "William Adams takes Metformin (Source 3)"). A list of source numbers alone is NOT an answer. Do not restate the question or describe your reasoning steps.

Answer:`;

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: enhancedPrompt }],
        stream: false,
        think: false,
        options: options
      }),
      signal: AbortSignal.timeout(300000)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} - model may not be available`);
    }

    const result = await response.json();
    const modelResponse = result.message?.content || 'No response generated';
    return { response: modelResponse, fullPrompt: enhancedPrompt };
  }

  // Append clickable source links for the documents used in the answer.
  addSourceLinks(docs, collection) {
    if (!docs || docs.length === 0) return '';
    const uniqueFiles = new Map();
    docs.forEach((doc, index) => {
      if (!uniqueFiles.has(doc.filename)) {
        uniqueFiles.set(doc.filename, { doc, sourceNum: index + 1 });
      }
    });
    let sourceSection = '\n\n---\n\n**Source Documents:**\n\n';
    Array.from(uniqueFiles.values()).forEach(({ doc, sourceNum }) => {
      const docCollection = doc.collection || collection || 'default';
      const docLink = `[${doc.filename}](http://localhost:56306/api/documents/${docCollection}/${encodeURIComponent(doc.filename)}/view)`;
      sourceSection += `${sourceNum}. ${docLink}\n`;
    });
    return sourceSection;
  }

  async ensureInitialized(collection) {
    // Re-index whenever the collection changes. This instance is a shared singleton
    // in SearchOrchestrator, so a once-only guard would serve a stale index (and a
    // desynced TF-IDF) for every collection after the first.
    if (this.indexedCollection !== collection) {
      await this.indexCollection(collection);
      this.indexedCollection = collection;
    }
  }

  async indexCollection(collection) {
    // Index CHUNKS from embeddings.db (never whole documents, never a directory glob).
    //  - Not a directory glob: a file present on disk but never embedded (e.g. a stale or
    //    malformed .json) must not be able to leak into a prompt.
    //  - Not whole documents: feeding documents.full_content put entire files (up to
    //    ~13K chars) into the RAG prompt, so prompt size bore no relation to topK x chunk
    //    size and overflowed the context window the search-settings formula computed.
    // Keyword search now scores the same chunks the semantic branch retrieves, so both
    // branches produce prompt items of chunk size (<= ~2K chars).
    const embeddingService = this.vectorSearch.embeddingService;
    const chunkRows = await embeddingService.getCollectionChunks(collection);

    console.log(`Indexing ${chunkRows.length} embedded chunks for hybrid search (from embeddings.db)`);

    // Fresh state scoped to this collection so TF-IDF positions line up exactly with
    // this.documents iteration order.
    this.documents = new Map();
    this.tfidf = new TfIdf();

    for (const { filename, chunk_index: chunkIndex, content } of chunkRows) {
      if (!content) continue;

      const id = `${collection}_${filename}#${chunkIndex}`;
      const contentLower = content.toLowerCase();
      this.documents.set(id, {
        id,
        filename,
        chunk_index: chunkIndex,
        content,
        collection,
        // Precomputed once at index time; reused by every query.
        contentLower,
        words: new Set(contentLower.split(/\s+/))
      });

      // Add to TF-IDF index (position matches insertion order in this.documents)
      this.tfidf.addDocument(content);
    }
  }

  async getKeywordResults(query, collection, limit) {
    const results = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(Boolean);
    // documents only ever contains the current collection, so array position equals
    // the TF-IDF document index.
    const chunkArray = Array.from(this.documents.values());

    chunkArray.forEach((chunk, index) => {
      if (chunk.collection !== collection) return;

      let score = 0;

      // TF-IDF scoring
      queryTerms.forEach(term => {
        score += this.tfidf.tfidf(term, index);
      });

      // Exact match bonus
      if (chunk.contentLower.includes(queryLower)) {
        score += 0.5;
      }

      // Word match bonus
      queryTerms.forEach(term => {
        if (chunk.words.has(term)) {
          score += 0.2;
        }
      });

      if (score > 0) {
        // Drop the index-time helper fields from the returned result.
        const { contentLower: _cl, words: _w, ...rest } = chunk;
        results.push({
          ...rest,
          keywordScore: score
        });
      }
    });

    return results
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, limit);
  }

  async getSemanticResults(query, collection, limit) {
    // Read chunks straight from embeddings.db. (Previously this went through
    // SmartSearch.search(), which returns a 2-sentence HTML-decorated *excerpt*, not the
    // chunk, so the semantic branch fed lossy snippets into the prompt.)
    const chunks = await this.vectorSearch.embeddingService.findSimilarChunks(query, collection, limit);

    return chunks.map(chunk => ({
      id: `${collection}_${chunk.filename}#${chunk.chunk_index}`,
      filename: chunk.filename,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      collection,
      semanticScore: chunk.similarity
    }));
  }

  combineResults(keywordResults, semanticResults, keywordWeight, semanticWeight) {
    const combinedScores = new Map();

    // Merge on chunk identity (filename + chunk_index). Several chunks share a filename,
    // so the filename alone is no longer a unique key.
    const chunkKeyOf = (r) => (r.filename ? `${r.filename}#${r.chunk_index ?? 0}` : '');

    // Normalize keyword scores (0-1 range)
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.keywordScore), 0.001);
    keywordResults.forEach(result => {
      const key = chunkKeyOf(result);
      if (!key) return;
      const normalizedScore = result.keywordScore / maxKeywordScore;
      combinedScores.set(key, {
        ...result,
        keywordScore: normalizedScore,
        semanticScore: 0
      });
    });

    // Add semantic scores (already 0-1 range).
    semanticResults.forEach(result => {
      const key = chunkKeyOf(result);
      if (!key) return;
      const existing = combinedScores.get(key);
      if (existing) {
        existing.semanticScore = Math.max(existing.semanticScore, result.semanticScore);
      } else {
        combinedScores.set(key, {
          ...result,
          keywordScore: 0,
          semanticScore: result.semanticScore
        });
      }
    });

    // Calculate hybrid scores
    return Array.from(combinedScores.values())
      .map(item => ({
        ...item,
        hybridScore: (item.keywordScore * keywordWeight) + (item.semanticScore * semanticWeight)
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }
}