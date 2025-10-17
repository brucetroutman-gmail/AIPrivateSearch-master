import { secureFs } from '../utils/secureFileOps.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import fs from 'fs-extra';
import path from 'path';
import { validatePath, validateFilename } from '../utils/pathValidator.mjs';

export class CollectionManager {
  constructor() {
    this.basePath = CollectionsUtil.getCollectionsPath();
  }

  getCollectionPath(collection) {
    return validatePath(collection, this.basePath);
  }

  async listCollections() {
    try {
      await fs.ensureDir(this.basePath);
      const items = await secureFs.readdir(this.basePath);
      const collections = [];
      
      for (const item of items) {
        const itemPath = path.join(this.basePath, item);
        const stat = await secureFs.stat(itemPath);
        if (stat.isDirectory()) {
          collections.push(item);
        }
      }
      
      return collections.sort();
    } catch (error) {
      console.error('Error listing collections:', error);
      return [];
    }
  }

  async getCollectionFiles(collection) {
    const collectionPath = this.getCollectionPath(collection);
    const files = await secureFs.readdir(collectionPath);
    const filteredFiles = files.filter(file => !file.startsWith('.'));
    
    const filesWithSizes = [];
    for (const file of filteredFiles) {
      const filePath = path.join(collectionPath, file);
      const stats = await secureFs.stat(filePath);
      filesWithSizes.push({
        name: file,
        size: stats.size
      });
    }
    
    return filesWithSizes;
  }

  async createDocument(collection, filename, content) {
    const safeFilename = validateFilename(filename);
    const filePath = path.join(this.getCollectionPath(collection), safeFilename);
    await secureFs.writeFile(filePath, content, 'utf8');
    return { success: true, path: filePath };
  }

  async readDocument(collection, filename) {
    const safeFilename = validateFilename(filename);
    const filePath = path.join(this.getCollectionPath(collection), safeFilename);
    const content = await secureFs.readFile(filePath, 'utf8');
    return { content, path: filePath };
  }

  async updateDocument(collection, filename, content) {
    const safeFilename = validateFilename(filename);
    const filePath = path.join(this.getCollectionPath(collection), safeFilename);
    await secureFs.writeFile(filePath, content, 'utf8');
    return { success: true, path: filePath };
  }

  async deleteDocument(collection, filename) {
    const safeFilename = validateFilename(filename);
    const filePath = path.join(this.getCollectionPath(collection), safeFilename);
    await secureFs.remove(filePath);
    return { success: true };
  }
}