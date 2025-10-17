#!/usr/bin/env node

import { secureFs } from '../lib/utils/secureFileOps.mjs';
import path from 'path';
import { EmbeddingService } from '../lib/documents/embeddingService.mjs';
import { VectorStore } from '../lib/documents/vectorStore.mjs';

import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

const documentsPath = '/Users/Shared/AIPrivateSearch/sources/local-documents';
const embeddingsPath = path.join(process.cwd(), 'data', 'embeddings');

async function reembedAllCollections(vectorDB = 'local') {
  const embeddingService = new EmbeddingService();
  
  try {
    const collections = await secureFs.readdir(documentsPath);
    logger.log(`Found ${collections.length} collections to process`);
    
    for (const collection of collections) {
      const collectionPath = path.join(documentsPath, collection);
      const stat = await secureFs.stat(collectionPath);
      
      if (!stat.isDirectory()) continue;
      
      logger.log(`\nProcessing collection: ${collection}`);
      
      const files = await secureFs.readdir(collectionPath);
      const documents = [];
      
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.txt')) {
          const filePath = path.join(collectionPath, file);
          const content = await secureFs.readFile(filePath, 'utf8');
          
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
      const localEmbeddingsPath = path.join(embeddingsPath, collection);
      await secureFs.ensureDir(localEmbeddingsPath);
      const vectorStore = new VectorStore(localEmbeddingsPath);
      await vectorStore.saveDocuments(documents.map(doc => ({
        ...doc,
        embedding: doc.vector
      })));
      logger.log(`  ✓ Saved ${documents.length} chunks to local storage`);
    }
    
    logger.log('\n🎉 All collections re-embedded successfully!');
  } catch (error) {
    logger.error('Error re-embedding collections:', error);
    process.exit(1);
  }
}

logger.log('Re-embedding all collections using local storage');
reembedAllCollections('local');