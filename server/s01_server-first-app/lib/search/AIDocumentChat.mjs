 
 
import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';
import { SetupGuidance } from '../utils/setupGuidance.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';

export class AIDocumentChat {
  constructor() {
    this.name = 'AI Document Chat';
    this.description = 'Chunked documents with AI retrieval';
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async search(query, options = {}) {
    const { collection = null, model, topK = 10, temperature = 0.3, contextSize = 1024, tokenLimit = null } = options;
    
    try {
      console.log('\n' + '='.repeat(80));
      console.log('[AIDocumentChat] SEARCH START');
      console.log(`[AIDocumentChat] Query: "${query}"`);
      console.log(`[AIDocumentChat] Collection: ${collection}, Model: ${model}, topK: ${topK}, context: ${contextSize}`);
      console.log('='.repeat(80));
      
      const candidateChunks = (await this.findSimilarChunks(query, collection, topK * 5))
        .filter(c => (c.similarity || 0) >= 0.1);

      console.log(`[AIDocumentChat] Found ${candidateChunks.length} candidate chunks`);
      
      if (candidateChunks.length === 0) {
        return SetupGuidance.createEmbeddingsRequiredResult(collection, 'ai-document-chat', 'ai-document-chat');
      }

      // Diversity cap: max 3 chunks per doc, unless only 1 doc in collection
      const uniqueDocs = new Set(candidateChunks.map(c => c.filename)).size;
      const perDocLimit = uniqueDocs === 1 ? topK : 3;
      const seen = new Map();
      const relevantChunks = [];
      for (const chunk of candidateChunks) {
        const count = seen.get(chunk.filename) || 0;
        if (count < perDocLimit) {
          relevantChunks.push(chunk);
          seen.set(chunk.filename, count + 1);
        }
        if (relevantChunks.length >= topK) break;
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
      const finalResponse = aiResponse + this.addSourceLinks(relevantChunks);
      
      const result = {
        results: [{
          id: `ai_document_chat_${Date.now()}`,
          title: 'Chat Analysis',
          excerpt: finalResponse,
          score: 0.8,
          source: `${relevantChunks.length} relevant chunks`
        }],
        method: 'ai-document-chat',
        total: 1
      };
      
      if (options.showChunks) {
        result.results[0].chunks = relevantChunks.map(chunk => ({
          filename: chunk.filename,
          content: chunk.content,
          similarity: chunk.similarity
        }));
      }
      
      return result;
    } catch (error) {
      console.error('AI Document Chat search error:', error);
      throw new Error(`AI Document Chat search failed: ${error.message}`);
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
      num_ctx: contextSize
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

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: enhancedPrompt,
        stream: false,
        options: options
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} - model may not be available`);
    }
    
    const result = await response.json();
    const modelResponse = result.response || 'No response generated';
    console.log('\n[AIDocumentChat] MODEL RESPONSE:');
    console.log('-'.repeat(80));
    console.log(modelResponse);
    console.log('='.repeat(80) + '\n');
    return modelResponse;
  }
}
