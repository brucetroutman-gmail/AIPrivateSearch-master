import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';

export class RAGSearch {
  constructor() {
    this.name = 'RAG Search';
    this.description = 'Chunked documents with AI retrieval';
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async search(query, options = {}) {
    const { collection = null, model = 'qwen2:0.5b', topK = 3, temperature = 0.3, contextSize = 1024, tokenLimit = null } = options;
    
    try {
      console.log(`RAG search for query: "${query}" in collection: ${collection}`);
      
      // Check if embeddings exist - no auto-embedding
      
      const relevantChunks = await this.findSimilarChunks(query, collection, topK);
      console.log(`Found ${relevantChunks.length} relevant chunks`);
      
      if (relevantChunks.length === 0) {
        return { 
          results: [{
            id: 'rag_no_embeddings',
            title: 'No Embeddings Found',
            excerpt: 'No embeddings found for this collection. Please use the Collections Editor to embed documents first by clicking "Embed Source MDs".',
            score: 0,
            source: 'System message'
          }], 
          method: 'rag', 
          total: 1
        };
      }
      
      let aiResponse;
      try {
        aiResponse = await this.generateAIResponse(query, relevantChunks, model, temperature, contextSize, tokenLimit);
      } catch (error) {
        console.log('AI generation failed, using chunks directly:', error.message);
        aiResponse = this.formatChunksDirectly(query, relevantChunks);
      }
      
      return {
        results: [{
          id: `rag_${Date.now()}`,
          title: 'RAG Analysis',
          excerpt: aiResponse,
          score: 0.8,
          source: `${relevantChunks.length} relevant chunks`,
          chunks: relevantChunks.map(chunk => ({
            filename: chunk.filename,
            content: chunk.content.substring(0, 100) + '...',
            similarity: chunk.similarity
          }))
        }],
        method: 'rag',
        total: 1
      };
    } catch (error) {
      console.error('RAG search error:', error);
      throw new Error(`RAG search failed: ${error.message}`);
    }
  }
  
  formatChunksDirectly(query, chunks) {
    let response = `Based on the embedded documents, here are the top 3 relevant findings:\n\n`;
    
    chunks.forEach((chunk, index) => {
      response += `**${index + 1}. From ${chunk.filename}:**\n`;
      response += `${chunk.content.substring(0, 400)}\n\n`;
    });
    
    response += `*Source: ${chunks.length} relevant chunks from unified SQLite embeddings*`;
    return response;
  }





  async findSimilarChunks(query, collection, topK) {
    return await this.embeddingService.findSimilarChunks(query, collection, topK);
  }

  async generateAIResponse(query, chunks, model, temperature = 0.3, contextSize = 1024, tokenLimit = null) {
    const context = chunks.map(chunk => 
      `[${chunk.filename}]: ${chunk.content.substring(0, 800)}`
    ).join('\n\n');
    
    const options = {
      temperature: temperature,
      num_ctx: contextSize
    };
    
    if (tokenLimit && tokenLimit !== 'No Limit') {
      options.num_predict = parseInt(tokenLimit);
    }
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `${context}\n\nQ: ${query}\nA:`,
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