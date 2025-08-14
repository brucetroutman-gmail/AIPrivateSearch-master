export class EmbeddingService {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.model = 'nomic-embed-text';
  }

  async generateEmbedding(text) {
    const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt: text })
    });
    
    if (!response.ok) throw new Error(`Embedding failed: ${response.statusText}`);
    const data = await response.json();
    return data.embedding;
  }

  async generateBatchEmbeddings(textChunks) {
    const embeddings = [];
    for (const chunk of textChunks) {
      const embedding = await this.generateEmbedding(chunk);
      embeddings.push(embedding);
    }
    return embeddings;
  }

  chunkText(text, maxChunkSize = 1000) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }
}