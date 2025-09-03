#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { EmbeddingService } from '../lib/documents/embeddingService.mjs';
import { VectorStore } from '../lib/documents/vectorStore.mjs';
import lanceDBService from '../lib/documents/lanceDBService.mjs';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
const embeddingsPath = path.join(process.cwd(), 'data', 'embeddings');

async function reembedAllCollections(vectorDB = 'both') {
  const embeddingService = new EmbeddingService();
  
  try {
    const collections = await fs.readdir(documentsPath);
    logger.log(`Found ${collections.length} collections to process`);
    
    for (const collection of collections) {
      const collectionPath = path.join(documentsPath, collection);
      const stat = await fs.stat(collectionPath);
      
      if (!stat.isDirectory()) continue;
      
      logger.log(`\nProcessing collection: ${collection}`);
      
      const files = await fs.readdir(collectionPath);
      const documents = [];
      
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.txt')) {
          const filePath = path.join(collectionPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          const chunks = embeddingService.chunkText(content);
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            logger.log(`  Embedding ${file} chunk ${i + 1}/${chunks.length}`);
            const embedding = await embeddingService.generateEmbedding(chunk);
            
            documents.push({
              id: `${file}_chunk_${i}`,
              text: chunk,
              vector: embedding,
              source: file,
              chunkIndex: i
            });
          }
        }
      }
      
      if (documents.length === 0) {
        logger.log(`  No documents found in ${collection}`);
        continue;
      }
      
      // Save to local vector store
      if (vectorDB === 'local' || vectorDB === 'both') {
        const localEmbeddingsPath = path.join(embeddingsPath, collection);
        await fs.ensureDir(localEmbeddingsPath);
        const vectorStore = new VectorStore(localEmbeddingsPath);
        await vectorStore.saveDocuments(documents.map(doc => ({
          ...doc,
          embedding: doc.vector
        })));
        logger.log(`  ✓ Saved ${documents.length} chunks to local storage`);
      }
      
      // Save to LanceDB
      if (vectorDB === 'lanceDB' || vectorDB === 'both') {
        await lanceDBService.createCollection(collection, documents);
        logger.log(`  ✓ Saved ${documents.length} chunks to LanceDB`);
      }
    }
    
    logger.log('\n🎉 All collections re-embedded successfully!');
  } catch (error) {
    logger.error('Error re-embedding collections:', error);
    process.exit(1);
  }
}

const vectorDB = process.argv[2] || 'both';
logger.log(`Re-embedding all collections using: ${vectorDB}`);
reembedAllCollections(vectorDB);