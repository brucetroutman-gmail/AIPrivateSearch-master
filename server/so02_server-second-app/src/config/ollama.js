import axios from 'axios';
import { logger } from '../utils/logger.js';

class OllamaConfig {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama2';
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'all-minilm';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;
    this.client = this.createClient();
  }

  createClient() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async checkConnection() {
    try {
      const response = await this.client.get('/api/tags');
      logger.info('Ollama connection successful');
      return response.data;
    } catch (error) {
      logger.error('Ollama connection failed:', error.message);
      throw new Error(`Cannot connect to Ollama at ${this.baseURL}`);
    }
  }

  async generateText(prompt, options = {}) {
    try {
      const payload = {
        model: options.model || this.model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || 500
        }
      };

      const response = await this.client.post('/api/generate', payload);
      return response.data.response;
    } catch (error) {
      logger.error('Text generation failed:', error.message);
      throw error;
    }
  }
}

export default new OllamaConfig();
