 
 
import { secureFs } from './secureFileOps.mjs';
import { AppConfig } from './appConfig.mjs';
import path from 'path';
import crypto from 'crypto';

const MANIFEST_FILE = 'collection.json';

export class CollectionsUtil {
  static getCollectionsPath() {
    const sourcesLocation = AppConfig.getSourcesLocation();
    return path.join(sourcesLocation, 'local-documents');
  }

  static manifestPath(collection) {
    return path.join(this.getCollectionsPath(), collection, MANIFEST_FILE);
  }

  static async readManifest(collection) {
    try {
      const content = await secureFs.readFile(this.manifestPath(collection), 'utf8');
      return JSON.parse(content);
    } catch {
      return null; // No manifest — legacy collection
    }
  }

  static async writeManifest(collection, manifest) {
    await secureFs.writeFile(this.manifestPath(collection), JSON.stringify(manifest, null, 2), 'utf8');
  }

  static async createManifest(collection) {
    const manifest = {
      name: collection,
      created: new Date().toISOString(),
      documents: []
    };
    await this.writeManifest(collection, manifest);
    return manifest;
  }

  static async addToManifest(collection, sourcePath, filename) {
    let manifest = await this.readManifest(collection);
    if (!manifest) manifest = await this.createManifest(collection);

    const ext = path.extname(filename).slice(1).toLowerCase();
    const baseName = path.basename(filename, path.extname(filename));

    // Remove existing entry for same base name if present
    manifest.documents = manifest.documents.filter(d => d.name !== baseName);

    manifest.documents.push({
      id: crypto.randomBytes(6).toString('hex'),
      name: baseName,
      sourcePath,
      sourceExt: ext,
      convertedFile: null,
      addedAt: new Date().toISOString()
    });

    await this.writeManifest(collection, manifest);
    return manifest;
  }

  static async removeFromManifest(collection, filename) {
    const manifest = await this.readManifest(collection);
    if (!manifest) return;
    const baseName = path.basename(filename, path.extname(filename));
    manifest.documents = manifest.documents.filter(d =>
      d.name !== baseName && d.sourcePath !== filename
    );
    await this.writeManifest(collection, manifest);
  }

  static async updateConvertedFile(collection, baseName, convertedFile) {
    const manifest = await this.readManifest(collection);
    if (!manifest) return;
    const doc = manifest.documents.find(d => d.name === baseName);
    if (doc) {
      doc.convertedFile = convertedFile;
      await this.writeManifest(collection, manifest);
    }
  }

  static async getAvailableCollections() {
    try {
      const collectionsPath = this.getCollectionsPath();
      console.log(`[CollectionsUtil] Attempting to read collections from: ${collectionsPath}`);
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