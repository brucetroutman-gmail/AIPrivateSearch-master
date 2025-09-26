import { UnifiedEmbeddingService } from '../embeddings/unifiedEmbeddingService.mjs';

export class RAGSearch {
  constructor() {
    this.name = 'RAG Search';
    this.description = 'Chunked documents with AI retrieval';
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async search(query, options = {}) {
    const { collection = null, model = 'qwen2:0.5b', topK = 3 } = options;
    
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
        aiResponse = await this.generateAIResponse(query, relevantChunks, model);
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

  async generateAIResponse(query, chunks, model) {
    // Limit context to prevent hangs
    const context = chunks.map(chunk => 
      `[${chunk.filename}]: ${chunk.content.substring(0, 800)}`
    ).join('\n\n');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: model,
          prompt: `${context}\n\nQ: ${query}\nA:`,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 200,
            num_ctx: 2048
          }
        })
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.response || 'No response generated';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return 'Response generation timed out. Please try a simpler query.';
      }
      return 'AI generation failed. Please try again.';
    }
  }
}