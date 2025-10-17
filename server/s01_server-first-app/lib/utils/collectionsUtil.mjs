import { secureFs } from './secureFileOps.mjs';
import path from 'path';
import fs from 'fs';

export class CollectionsUtil {
  static getAppConfig() {
    const configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/app.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  static getCollectionsPath() {
    const config = this.getAppConfig();
    return path.join(config['sources-location'], 'local-documents');
  }

  static async getAvailableCollections() {
    try {
      const collectionsPath = this.getCollectionsPath();
      const items = await secureFs.readdir(collectionsPath);
      
      const collections = [];
      for (const item of items) {
        if (!item.startsWith('.')) {
          const itemPath = path.join(collectionsPath, item);
          const stats = await secureFs.stat(itemPath);
          if (stats.isDirectory()) {
            collections.push({ name: item, path: itemPath });
          }
        }
      }
      
      return collections;
    } catch (error) {
      console.error('Error loading collections:', error.message);
      return [];
    }
  }

  static async getCollectionNames() {
    const collections = await this.getAvailableCollections();
    return collections.map(c => c.name);
  }
}