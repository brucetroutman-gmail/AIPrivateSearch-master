import fs from 'fs-extra';
import path from 'path';

export class CollectionManager {
  constructor() {
    this.collections = ['Family-Documents', 'USA-History', 'My-Literature'];
    this.basePath = path.join(process.cwd(), '../../sources/local-documents');
  }

  getCollectionPath(collection) {
    return path.join(this.basePath, collection);
  }

  async listCollections() {
    return this.collections;
  }

  async getCollectionFiles(collection) {
    const collectionPath = this.getCollectionPath(collection);
    const files = await fs.readdir(collectionPath);
    return files.filter(file => file.endsWith('.md'));
  }

  async createDocument(collection, filename, content) {
    const filePath = path.join(this.getCollectionPath(collection), filename);
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true, path: filePath };
  }

  async readDocument(collection, filename) {
    const filePath = path.join(this.getCollectionPath(collection), filename);
    const content = await fs.readFile(filePath, 'utf8');
    return { content, path: filePath };
  }

  async updateDocument(collection, filename, content) {
    const filePath = path.join(this.getCollectionPath(collection), filename);
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true, path: filePath };
  }

  async deleteDocument(collection, filename) {
    const filePath = path.join(this.getCollectionPath(collection), filename);
    await fs.remove(filePath);
    return { success: true };
  }
}