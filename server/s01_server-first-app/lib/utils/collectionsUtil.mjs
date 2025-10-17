import { secureFs } from './secureFileOps.mjs';
import path from 'path';

export class CollectionsUtil {
  static getCollectionsPath() {
    return '/Users/Shared/AIPrivateSearch/sources/local-documents';
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