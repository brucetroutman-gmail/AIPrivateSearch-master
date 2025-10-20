import { secureFs } from './secureFileOps.mjs';
import path from 'path';
import fs from 'fs';

export class CollectionsUtil {
  static getAppConfig() {
    // Try multiple possible config paths
    const possiblePaths = [
      '/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/client/c01_client-first-app/config/app.json',
      '/Users/Shared/AIPrivateSearch/repo/AIPrivateSearch/client/c01_client-first-app/config/app.json',
      path.join(process.cwd(), '../../client/c01_client-first-app/config/app.json')
    ];
    
    for (const configPath of possiblePaths) {
      try {
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          console.log(`[CollectionsUtil] Loaded config from: ${configPath}`);
          return config;
        }
      } catch (error) {
        console.warn(`[CollectionsUtil] Failed to load config from ${configPath}:`, error.message);
        continue;
      }
    }
    
    // Fallback to default config
    console.log(`[CollectionsUtil] Using default config - no config file found`);
    return {
      'app-name': 'AI Private Search',
      'sources-location': '/Users/Shared/AIPrivateSearch/sources'
    };
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