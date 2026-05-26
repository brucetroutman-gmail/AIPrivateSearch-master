/* eslint-disable security/detect-non-literal-fs-filename */
 
import { readFile } from 'fs/promises';
import path from 'path';

class ModelConfig {
  constructor() {
    this.models = null;
    this.modelsPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/models-list.json');
  }

  async loadModels() {
    if (!this.models) {
      const data = await readFile(this.modelsPath, 'utf8');
      this.models = JSON.parse(data);
    }
    return this.models;
  }

  async getEmbeddingModel() {
    const modelsData = await this.loadModels();
    const embedModel = modelsData.models.find(model => model.category === 'embed');
    if (!embedModel) {
      throw new Error('No embedding model found in models-list.json configuration');
    }
    return embedModel.modelName;
  }

  async getRerankModel() {
    const modelsData = await this.loadModels();
    const rerankModel = modelsData.models.find(model => model.category === 'rerank');
    return rerankModel ? rerankModel.modelName : null;
  }

  async getModelsByCategory(category) {
    const modelsData = await this.loadModels();
    return modelsData.models.filter(model => model.category === category);
  }
}

export const modelConfig = new ModelConfig();