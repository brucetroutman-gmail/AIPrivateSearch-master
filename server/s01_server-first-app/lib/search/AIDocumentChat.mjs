import { UnifiedEmbeddingService } from '../documents/unifiedEmbeddingService.mjs';

export class AIDocumentChat {
  constructor() {
    this.name = 'AI Document Chat';
    this.description = 'Chunked documents with AI retrieval';
    this.embeddingService = new UnifiedEmbeddingService();
  }

  async search(query, options = {}) {
    const { collection = null, model, topK = 5, temperature = 0.3, contextSize = 1024, tokenLimit = null } = options;
    
    try {
      console.log(`AI Document Chat search for query: "${query}" in collection: ${collection}`);
      
      // Check if embeddings exist - no auto-embedding
      
      const relevantChunks = await this.findSimilarChunks(query, collection, topK);
      console.log(`Found ${relevantChunks.length} relevant chunks`);
      
      if (relevantChunks.length === 0) {
        return { 
          results: [{
            id: 'ai_document_chat_no_embeddings',
            title: 'No Embeddings Found',
            excerpt: 'No embeddings found for this collection. Please use the Collections Editor to embed documents first by clicking "Embed Source MDs".',
            score: 0,
            source: 'System message'
          }], 
          method: 'ai-document-chat', 
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
      response += `### ${index + 1}. ${chunk.filename}${similarity}\n\n`;
      response += `${chunk.content.substring(0, 500)}...\n\n`;
      response += `---\n\n`;
    });
    
    response += `*Analysis based on ${chunks.length} relevant document chunks using semantic search.*`;
    return response;
  }





  async findSimilarChunks(query, collection, topK) {
    return await this.embeddingService.findSimilarChunks(query, collection, topK);
  }

  async generateAIResponse(query, chunks, model, temperature = 0.3, contextSize = 1024, tokenLimit = null) {
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
    
    const enhancedPrompt = `You are an AI assistant analyzing documents to answer user questions. Use the provided document excerpts to give accurate, well-structured responses.

**DOCUMENT EXCERPTS:**
${context}

**USER QUESTION:** ${query}

**INSTRUCTIONS:**
- Answer based primarily on the provided document excerpts
- Structure your response clearly with headings or bullet points when appropriate
- If the documents contain specific details (names, dates, numbers, policies), include them
- If the answer spans multiple documents, synthesize the information coherently
- If the documents don't fully answer the question, acknowledge what information is available

**RESPONSE:**`;
    
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