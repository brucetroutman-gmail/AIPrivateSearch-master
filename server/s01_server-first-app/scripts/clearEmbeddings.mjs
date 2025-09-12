#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import lanceDBService from '../lib/documents/lanceDBService.mjs';

const embeddingsPath = path.join(process.cwd(), 'data', 'embeddings');
const lanceDBPath = path.join(process.cwd(), 'data', 'lancedb');

async function clearAllEmbeddings() {
  console.log('Clearing all embeddings...');
  
  try {
    // Clear local embeddings
    if (await fs.pathExists(embeddingsPath)) {
      await fs.remove(embeddingsPath);
      console.log('✓ Cleared local embeddings');
    }
    
    // Clear LanceDB
    if (await fs.pathExists(lanceDBPath)) {
      await fs.remove(lanceDBPath);
      console.log('✓ Cleared LanceDB embeddings');
    }
    
    console.log('All embeddings cleared successfully!');
  } catch (error) {
    console.error('Error clearing embeddings:', error);
    process.exit(1);
  }
}

clearAllEmbeddings();