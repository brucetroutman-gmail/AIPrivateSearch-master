 
 
import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';
import { SetupGuidance } from '../utils/setupGuidance.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import { secureFs } from '../utils/secureFileOps.mjs';
import { modelConfig } from '../utils/modelConfig.mjs';
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
      console.log(`[AIDocumentChat] Search called with query: "${query}"`);
      console.log(`[AIDocumentChat] Collection parameter: "${collection}"`);
      console.log(`[AIDocumentChat] Collection type: ${typeof collection}`);
      
      // Fetch wider candidate set for reranking
      const candidateChunks = await this.findSimilarChunks(query, collection, topK * 3);
      console.log(`[AIDocumentChat] Found ${candidateChunks.length} candidate chunks`);
      
      if (candidateChunks.length === 0) {
        return SetupGuidance.createEmbeddingsRequiredResult(collection, 'ai-document-chat', 'ai-document-chat');
      }

      // Rerank candidates down to topK using rerank model
      const relevantChunks = await this.rerankChunks(query, candidateChunks, topK);
      console.log(`[AIDocumentChat] Reranked to ${relevantChunks.length} chunks`);
      
      let aiResponse;
      try {
        aiResponse = await this.generateAIResponse(query, relevantChunks, model, temperature, contextSize, tokenLimit, collection);
        aiResponse += this.addSourceLinks(relevantChunks);
      } catch (error) {
        console.log('AI generation failed, using chunks directly:', error.message);
        aiResponse = this.formatChunksDirectly(query, relevantChunks);
      }
      
      const result = {
        results: [{
          id: `ai_document_chat_${Date.now()}`,
          title: 'Chat Analysis',
          excerpt: aiResponse,
          score: 0.8,
          source: `${relevantChunks.length} relevant chunks`
        }],
        method: 'ai-document-chat',
        total: 1
      };
      
      // Add chunks if requested
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
  
  formatChunksDirectly(query, chunks) {
    let response = `## Document Analysis Results\n\n`;
    response += `Based on your query "${query}", here are the most relevant findings from the document collection:\n\n`;
    
    chunks.slice(0, 3).forEach((chunk, index) => {
      const similarity = chunk.similarity ? ` (${(chunk.similarity * 100).toFixed(1)}% match)` : '';
      const docLink = `[View Document](http://localhost:56306/api/documents/${chunk.collection}/${encodeURIComponent(chunk.filename)}/view)`;
      response += `### ${index + 1}. ${chunk.filename}${similarity}\n\n`;
      response += `${chunk.content.substring(0, 500)}...\n\n`;
      response += `${docLink}\n\n`;
      response += `---\n\n`;
    });
    
    response += `*Analysis based on ${chunks.length} relevant document chunks using semantic search.*`;
    return response;
  }

  addSourceLinks(chunks) {
    if (!chunks || chunks.length === 0) return '';
    
    const uniqueFiles = new Map();
    chunks.forEach(chunk => {
      if (!uniqueFiles.has(chunk.filename)) {
        uniqueFiles.set(chunk.filename, chunk);
      }
    });
    
    let sourceSection = '\n\n---\n\n**Source Documents:**\n\n';
    Array.from(uniqueFiles.values()).forEach((chunk, index) => {
      const docLink = `[${chunk.filename}](http://localhost:56306/api/documents/${chunk.collection}/${encodeURIComponent(chunk.filename)}/view)`;
      sourceSection += `${index + 1}. ${docLink}\n`;
    });
    
    return sourceSection;
  }





  async rerankChunks(query, chunks, topK) {
    try {
      const rerankModel = await modelConfig.getRerankModel();
      if (!rerankModel) {
        console.log('[AIDocumentChat] No rerank model configured, using cosine similarity order');
        return chunks.slice(0, topK);
      }

      console.log(`[AIDocumentChat] Reranking ${chunks.length} chunks with model: ${rerankModel}`);

      const scored = await Promise.all(chunks.map(async (chunk) => {
        try {
          const prompt = `Passage: ${chunk.content.substring(0, 400)}\nQuestion: ${query}\nRelevance score 1-10 (reply with number only):`;
          const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: rerankModel, prompt, stream: false, options: { temperature: 0, num_predict: 3 } })
          });
          if (!response.ok) return { ...chunk, rerankScore: chunk.similarity };
          const result = await response.json();
          const score = parseFloat(result.response?.trim()) || 0;
          return { ...chunk, rerankScore: isNaN(score) ? chunk.similarity : score / 10 };
        } catch {
          return { ...chunk, rerankScore: chunk.similarity };
        }
      }));

      return scored
        .sort((a, b) => b.rerankScore - a.rerankScore)
        .slice(0, topK);
    } catch (error) {
      console.log('[AIDocumentChat] Reranking failed, falling back to cosine order:', error.message);
      return chunks.slice(0, topK);
    }
  }

  async findSimilarChunks(query, collection, topK) {
    return await this.embeddingService.findSimilarChunks(query, collection, topK);
  }

  async generateAIResponse(query, chunks, model, temperature = 0.3, contextSize = 1024, tokenLimit = null, collection = null) {
    const context = chunks.map((chunk, index) => 
      `**Source ${index + 1}: ${chunk.filename}**\n${chunk.content.substring(0, 800)}`
    ).join('\n\n');
    
    const options = {
      temperature: temperature,
      num_ctx: contextSize
    };
    
    if (tokenLimit && tokenLimit !== 'No Limit') {
      options.num_predict = parseInt(tokenLimit);
    }

    // Load collection-specific Fabric pattern as domain context if available
    let domainContext = '';
    if (collection) {
      try {
        const patternPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'fabric-pattern.md');
        const pattern = await secureFs.readFile(patternPath, 'utf8');
        if (pattern.trim()) domainContext = `Domain context for this collection:\n${pattern.trim()}\n\n`;
      } catch { /* no pattern file — proceed without it */ }
    }
    
    const enhancedPrompt = `${domainContext}You have access to multiple document excerpts. Use ALL relevant information to provide a comprehensive answer.

${context}

Question: ${query}

Instructions: Review ALL the document excerpts above and synthesize the information. If multiple documents are relevant, mention information from each one. Provide a complete answer that covers all relevant details found in the documents.

Answer:`;
    
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
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.response || 'No response generated';
  }
}