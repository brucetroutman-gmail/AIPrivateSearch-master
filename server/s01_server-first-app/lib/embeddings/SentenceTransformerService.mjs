// Dynamic import handled in constructor
let pipeline, env;

export class SentenceTransformerService {
  constructor() {
    this.models = new Map();
    this.initialized = false;
    this.availableModels = {
      'all-MiniLM-L6-v2': {
        name: 'Xenova/all-MiniLM-L6-v2',
        dimensions: 384,
        maxTokens: 512,
        description: 'Lightweight, fast, CPU-friendly'
      },
      'nomic-embed-text': {
        name: 'Xenova/nomic-embed-text-v1',
        dimensions: 768,
        maxTokens: 8192,
        description: 'High accuracy, long context'
      }
    };
    this.init();
  }
  
  async init() {
    try {
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      env = transformers.env;
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      this.initialized = true;
    } catch (error) {
      console.warn('Sentence transformers not available:', error.message);
      this.initialized = false;
    }
  }

  async getModel(modelKey = 'nomic-embed-text') {
    if (!this.initialized) {
      await this.init();
    }
    
    if (!pipeline) {
      throw new Error('Sentence transformers not available - @xenova/transformers not loaded');
    }
    
    if (!this.models.has(modelKey)) {
      const modelConfig = this.availableModels[modelKey];
      if (!modelConfig) {
        throw new Error(`Unknown model: ${modelKey}`);
      }

      console.log(`Loading sentence transformer: ${modelConfig.name}`);
      const extractor = await pipeline('feature-extraction', modelConfig.name, {
        quantized: true,
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            console.log(`Downloading ${modelConfig.name}: ${Math.round(progress.progress)}%`);
          }
        }
      });
      
      this.models.set(modelKey, {
        extractor,
        config: modelConfig
      });
      console.log(`Loaded sentence transformer: ${modelConfig.name}`);
    }

    return this.models.get(modelKey);
  }

  async generateEmbedding(text, modelKey = 'nomic-embed-text') {
    try {
      const { extractor, config } = await this.getModel(modelKey);
      
      // Truncate text if it exceeds model's max tokens (rough estimate: 4 chars per token)
      const maxChars = config.maxTokens * 4;
      const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;
      
      const output = await extractor(truncatedText, { pooling: 'mean', normalize: true });
      
      // Convert to regular array
      const embedding = Array.from(output.data);
      
      return {
        embedding,
        dimensions: config.dimensions,
        model: modelKey,
        tokenCount: Math.ceil(truncatedText.length / 4), // Rough estimate
        truncated: text.length > maxChars
      };
    } catch (error) {
      console.error(`Sentence transformer embedding failed for model ${modelKey}:`, error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async generateBatchEmbeddings(texts, modelKey = 'nomic-embed-text') {
    const results = [];
    
    for (const text of texts) {
      const result = await this.generateEmbedding(text, modelKey);
      results.push(result);
    }
    
    return results;
  }

  getAvailableModels() {
    return Object.entries(this.availableModels).map(([key, config]) => ({
      key,
      name: config.name,
      dimensions: config.dimensions,
      maxTokens: config.maxTokens,
      description: config.description
    }));
  }

  getModelInfo(modelKey) {
    return this.availableModels[modelKey] || null;
  }
}

// Singleton instance
export const sentenceTransformerService = new SentenceTransformerService();