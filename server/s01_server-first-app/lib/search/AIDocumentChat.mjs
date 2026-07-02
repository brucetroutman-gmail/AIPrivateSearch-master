 
 
import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';
import { SetupGuidance } from '../utils/setupGuidance.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import { secureFs } from '../utils/secureFileOps.mjs';
import { detectQueryType, applyQueryModifiers } from '../utils/queryTypeDetector.mjs';
import crypto from 'crypto';
import path from 'path';

export class AIDocumentChat {
  constructor() {
    this.name = 'AI Document Chat';
    this.description = 'Chunked documents with AI retrieval';
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async search(query, options = {}) {
    let { collection = null, model, topK = 10, temperature = 0.3, contextSize = 1024, tokenLimit = null } = options;
    
    // Capture all console output for this search into searchLog
    const searchLog = [];
    const origLog = console.log;
    const origError = console.error;
    console.log = (...args) => { origLog(...args); searchLog.push(args.join(' ')); };
    console.error = (...args) => { origError(...args); searchLog.push('ERROR: ' + args.join(' ')); };

    try {
      const searchStartTime = Date.now();
      console.log('\n' + '='.repeat(80));
      console.log('[AIDocumentChat] SEARCH START');
      console.log(`[AIDocumentChat] Query: "${query}"`);
      
      // Detect query type and apply adaptive parameter modifiers
      const queryType = detectQueryType(query);
      const adapted = applyQueryModifiers({ topK, temperature, contextSize, tokenLimit }, queryType);
      topK = adapted.topK;
      temperature = adapted.temperature;
      contextSize = adapted.contextSize;
      tokenLimit = adapted.tokenLimit;

      console.log(`[AIDocumentChat] Collection: ${collection}, Model: ${model}, topK: ${topK}, context: ${contextSize}`);
      console.log('='.repeat(80));
      
      const candidateChunks = (await this.findSimilarChunks(query, collection, 9999))
        .filter(c => (c.similarity || 0) >= 0.1);

      console.log(`[AIDocumentChat] Found ${candidateChunks.length} candidate chunks`);
      
      if (candidateChunks.length === 0) {
        return SetupGuidance.createEmbeddingsRequiredResult(collection, 'ai-document-chat', 'ai-document-chat');
      }

      // Keyword pre-filter with PRF query expansion:
      // For multi-doc collections: use PRF expansion (generic terms help across different docs)
      // For single-doc collections: use only specific query keywords (PRF adds noise when all chunks share same vocabulary)
      const stopWords = new Set(['find','show','list','what','with','have','that','from','this','which','where','about','does','their','patients','also','been','were','will','would','could','should','these','those','then','than','when','they','them','into','over','after','before','other','some','such','only','both','each','more','most','very','just','like','well','even','back','good','much','many','know','need','make','take','give','come','look','want','used','using','compare','versus','approach','approaches','the','and','for','are','but','not','you','all','can','her','was','one','our','out','day','get','has','him','his','how','its','may','new','now','old','see','two','who','boy','did','way','let','put','say','she','too','use','yet','via']);
      const queryKeywords = query.toLowerCase().split(/\W+/).filter(w => w.length >= 3 && !stopWords.has(w));

      const uniqueDocs = new Set(candidateChunks.map(c => c.filename)).size;
      let expandedKeywords = queryKeywords;

      if (uniqueDocs > 1) {
        // Multi-doc: PRF expand using top-5 chunks from the SAME file as top result
        // This prevents generic cross-document terms from polluting the filter
        const topFile = candidateChunks[0].filename;
        const prfChunks = candidateChunks.filter(c => c.filename === topFile).slice(0, 5);
        const termFreq = new Map();
        for (const chunk of prfChunks) {
          const words = chunk.content.toLowerCase().split(/\W+/).filter(w => w.length >= 5 && !stopWords.has(w));
          for (const word of words) termFreq.set(word, (termFreq.get(word) || 0) + 1);
        }
        const prfTerms = [...termFreq.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([term]) => term);
        expandedKeywords = [...new Set([...queryKeywords, ...prfTerms])];
        console.log(`[AIDocumentChat] PRF expanded from ${topFile}: [${prfTerms.join(', ')}]`);
      } else {
        console.log(`[AIDocumentChat] Single-doc collection — using query keywords only (no PRF)`);
      }

      console.log(`[AIDocumentChat] Query keywords: [${queryKeywords.join(', ')}]`);

      // For single-doc collections also apply similarity gap filter:
      // only include chunks within 20% of the top similarity score
      let poolAfterSimilarity = candidateChunks;
      if (uniqueDocs === 1 && candidateChunks.length > 0) {
        const topSim = candidateChunks[0].similarity;
        const simThreshold = topSim * 0.80;
        const simFiltered = candidateChunks.filter(c => c.similarity >= simThreshold);
        if (simFiltered.length < candidateChunks.length) {
          poolAfterSimilarity = simFiltered;
          console.log(`[AIDocumentChat] Similarity gap filter: ${simFiltered.length}/${candidateChunks.length} chunks within 80% of top score (${topSim.toFixed(3)})`);
        }
      }

      const keywordFiltered = expandedKeywords.length > 0
        ? poolAfterSimilarity.filter(c => expandedKeywords.some(kw => c.content.toLowerCase().includes(kw)))
        : [];
      const poolToRank = keywordFiltered.length > 0 ? keywordFiltered : poolAfterSimilarity;
      console.log(`[AIDocumentChat] keyword-matched: ${keywordFiltered.length}/${candidateChunks.length} chunks`);

      // Detect exhaustive queries — "find all", "list", "which", "how many"
      const exhaustivePattern = /\b(all|every|each|list|find|show|which|how many|any)\b/i;
      const isExhaustive = exhaustivePattern.test(query);

      // For exhaustive queries, fit as many keyword-matched chunks as context allows
      // For normal queries, respect topK
      let chunkLimit = topK;
      if (isExhaustive && keywordFiltered.length > topK) {
        const avgSize = keywordFiltered.reduce((s, c) => s + c.content.length, 0) / keywordFiltered.length;
        const contextBudget = Math.floor((contextSize * 3) / avgSize); // ~3 chars per token
        chunkLimit = Math.min(keywordFiltered.length, Math.max(topK, contextBudget));
        console.log(`[AIDocumentChat] Exhaustive query — expanding chunkLimit from ${topK} to ${chunkLimit} (context budget)`);
      }

      // Diversity cap: max 3 chunks per doc, unless only 1 doc in collection
      // perDocLimit controls diversity — prevents one document dominating the context.
      // For fact/general queries: cap at 3 chunks per doc so multiple docs contribute.
      // For analysis/creative queries: no per-doc cap — the model needs as many chunks
      // as possible from each doc to compare and synthesize across documents.
      // chunkLimit (adapted topK) is the only cap for analysis/creative.
      const isAnalysisQuery = ['analysis', 'creative'].includes(queryType.type);
      const perDocLimit = uniqueDocs === 1 || isAnalysisQuery ? chunkLimit : 3;
      const seen = new Map();
      const relevantChunks = [];
      for (const chunk of poolToRank) {
        const count = seen.get(chunk.filename) || 0;
        if (count < perDocLimit) {
          relevantChunks.push(chunk);
          seen.set(chunk.filename, count + 1);
        }
        if (relevantChunks.length >= chunkLimit) break;
      }

      console.log(`\n[AIDocumentChat] CANDIDATE CHUNKS (${candidateChunks.length} total, ${uniqueDocs} unique docs):`);
      candidateChunks.slice(0, 15).forEach((c, i) => {
        console.log(`  ${i+1}. chunk_${c.chunk_index} ${c.filename} sim:${c.similarity.toFixed(3)}`);
        console.log(`     ${c.content.substring(0, 100).replace(/\n/g, ' ')}`);
      });
      console.log(`\n[AIDocumentChat] SELECTED CHUNKS (${relevantChunks.length}, perDocLimit:${perDocLimit}):`);
      relevantChunks.forEach((c, i) => {
        console.log(`  ${i+1}. chunk_${c.chunk_index} ${c.filename} sim:${c.similarity.toFixed(3)}`);
        console.log(`     ${c.content.substring(0, 150).replace(/\n/g, ' ')}`);
      });

      const aiResponse = await this.generateAIResponse(query, relevantChunks, model, temperature, contextSize, tokenLimit, collection);

      // Warn if keyword filter still found more matches than we could send
      const truncationWarning = keywordFiltered.length > relevantChunks.length
        ? `\n\n> ℹ️ **Note**: ${keywordFiltered.length} matching chunks found, ${relevantChunks.length} selected for analysis (query type: **${queryType.type}** | topK: **${chunkLimit}** | context: **${contextSize}**)`
        : '';

      const finalResponse = aiResponse + truncationWarning + this.addSourceLinks(relevantChunks);
      
      const feedbackToken = crypto.randomBytes(8).toString('hex');
      const elapsedMs = Date.now() - searchStartTime;
      const result = {
        results: [{
          id: `ai_document_chat_${Date.now()}`,
          title: 'Chat Analysis',
          excerpt: finalResponse,
          score: 0.8,
          source: `${relevantChunks.length} relevant chunks`
        }],
        method: 'ai-document-chat',
        total: 1,
        feedbackToken,
        feedbackMeta: { query, collection, model, topK: chunkLimit, contextSize, temperature, chunksUsed: relevantChunks.length, elapsedMs },
        searchLog
      };
      
      // Always capture chunks for ai-document-chat (for DB storage)
      result.results[0].chunks = relevantChunks.map(chunk => ({
        filename: chunk.filename,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        similarity: chunk.similarity
      }));
      
      return result;
    } catch (error) {
      console.error('AI Document Chat search error:', error);
      throw new Error(`AI Document Chat search failed: ${error.message}`);
    } finally {
      console.log = origLog;
      console.error = origError;
    }
  }

  addSourceLinks(chunks) {
    if (!chunks || chunks.length === 0) return '';
    
    const uniqueFiles = new Map();
    chunks.forEach((chunk, index) => {
      if (!uniqueFiles.has(chunk.filename)) {
        uniqueFiles.set(chunk.filename, { chunk, sourceNum: index + 1 });
      }
    });
    
    let sourceSection = '\n\n---\n\n**Source Documents:**\n\n';
    Array.from(uniqueFiles.values()).forEach(({ chunk, sourceNum }) => {
      const docLink = `[${chunk.filename}](http://localhost:56306/api/documents/${chunk.collection}/${encodeURIComponent(chunk.filename)}/view)`;
      sourceSection += `${sourceNum}. ${docLink}\n`;
    });
    
    return sourceSection;
  }

  async findSimilarChunks(query, collection, topK) {
    return await this.embeddingService.findSimilarChunks(query, collection, topK);
  }

  async generateAIResponse(query, chunks, model, temperature = 0.3, contextSize = 1024, tokenLimit = null, collection = null) {
    // Use full chunk content — no truncation
    const context = chunks.map((chunk, index) => 
      `**Source ${index + 1}: ${chunk.filename}**\n${chunk.content}`
    ).join('\n\n');
    
    const options = {
      temperature: temperature,
      num_ctx: contextSize,
      thinking: false
    };
    
    if (tokenLimit && tokenLimit !== 'No Limit') {
      options.num_predict = parseInt(tokenLimit);
    }

    // Load collection Fabric pattern vocabulary as domain context
    let domainContext = '';
    if (collection) {
      try {
        const patternPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'fabric-pattern.md');
        const pattern = await secureFs.readFile(patternPath, 'utf8');
        const vocabMatch = pattern.match(/Key domain vocabulary[^:]*:\s*([^\n]+)/);
        if (vocabMatch) domainContext = `Domain vocabulary for this collection: ${vocabMatch[1].trim()}\n\n`;
      } catch { /* no pattern file */ }
    }
    
    const enhancedPrompt = `${domainContext}You are analyzing document excerpts to answer a question. Follow these steps:
1. Identify which excerpts contain information relevant to the question
2. Extract the specific facts from each relevant excerpt
3. Connect facts across excerpts where they relate to the same entity (e.g. same patient, same topic)
4. Synthesize a complete answer
5. If the information is not present, say so clearly

Document excerpts:
${context}

Question: ${query}

Answer (be specific, reference source numbers):`;

    console.log('\n' + '-'.repeat(80));
    console.log('[AIDocumentChat] PROMPT SENT TO MODEL:');
    console.log('-'.repeat(80));
    console.log(enhancedPrompt);
    console.log('-'.repeat(80));

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
      signal: AbortSignal.timeout(300000) // 5 minute timeout for large models
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} - model may not be available`);
    }
    
    const result = await response.json();
    const modelResponse = result.message?.content || 'No response generated';
    console.log('\n[AIDocumentChat] MODEL RESPONSE:');
    console.log('-'.repeat(80));
    console.log(modelResponse);
    console.log('='.repeat(80) + '\n');
    return modelResponse;
  }
}
