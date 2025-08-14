import fs from 'fs-extra';
import path from 'path';

export class VectorStore {
  constructor(collection) {
    this.collection = collection;
    this.dataPath = path.join(process.cwd(), 'data', 'embeddings', collection);
    this.indexPath = path.join(this.dataPath, 'index.json');
    this.vectorsPath = path.join(this.dataPath, 'vectors.json');
  }

  async initialize() {
    await fs.ensureDir(this.dataPath);
    
    if (!await fs.pathExists(this.indexPath)) {
      await fs.writeJson(this.indexPath, { documents: [], lastUpdated: new Date().toISOString() });
    }
    
    if (!await fs.pathExists(this.vectorsPath)) {
      await fs.writeJson(this.vectorsPath, { vectors: [] });
    }
  }

  async addDocument(filename, chunks, embeddings, metadata) {
    const index = await fs.readJson(this.indexPath);
    const vectors = await fs.readJson(this.vectorsPath);

    // Remove existing document if it exists
    await this.removeDocument(filename);

    const docId = `${this.collection}_${filename}`;
    const docRecord = {
      id: docId,
      filename,
      collection: this.collection,
      chunks: chunks.length,
      metadata: { ...metadata, processedAt: new Date().toISOString() }
    };

    const vectorRecords = chunks.map((chunk, idx) => ({
      id: `${docId}_chunk_${idx}`,
      documentId: docId,
      filename,
      collection: this.collection,
      chunkIndex: idx,
      content: chunk,
      embedding: embeddings[idx]
    }));

    index.documents.push(docRecord);
    vectors.vectors.push(...vectorRecords);
    index.lastUpdated = new Date().toISOString();

    await fs.writeJson(this.indexPath, index);
    await fs.writeJson(this.vectorsPath, vectors);
  }

  async removeDocument(filename) {
    const index = await fs.readJson(this.indexPath);
    const vectors = await fs.readJson(this.vectorsPath);

    index.documents = index.documents.filter(doc => doc.filename !== filename);
    vectors.vectors = vectors.vectors.filter(vec => vec.filename !== filename);

    await fs.writeJson(this.indexPath, index);
    await fs.writeJson(this.vectorsPath, vectors);
  }

  async searchSimilar(queryEmbedding, limit = 5) {
    const vectors = await fs.readJson(this.vectorsPath);
    
    const similarities = vectors.vectors.map(vec => ({
      ...vec,
      similarity: this.cosineSimilarity(queryEmbedding, vec.embedding)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async listDocuments() {
    const index = await fs.readJson(this.indexPath);
    return index.documents;
  }
}