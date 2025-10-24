import { readFile } from 'fs/promises';
import path from 'path';

class ModelConfig {
  constructor() {
    this.models = null;
    this.modelsPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/models-list.json');
  }

  async loadModels() {
    if (!this.models) {
      try {
        const data = await readFile(this.modelsPath, 'utf8');
        this.models = JSON.parse(data);
      } catch (error) {
        console.error('[ModelConfig] Failed to load models list:', error);
        this.models = { models: [] };
      }
    }
    return this.models;
  }

  async getEmbeddingModel() {
    const modelsData = await this.loadModels();
    const embedModel = modelsData.models.find(model => model.category === 'embed');
    return embedModel ? embedModel.modelName : 'nomic-embed-text'; // fallback
  }

  async getModelsByCategory(category) {
    const modelsData = await this.loadModels();
    return modelsData.models.filter(model => model.category === category);
  }
}

export const modelConfig = new ModelConfig();