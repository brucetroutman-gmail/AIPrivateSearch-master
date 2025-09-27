#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
const embeddingsPath = path.join(process.cwd(), 'data', 'embeddings');

async function clearAllEmbeddings() {
  console.log('Clearing all embeddings...');
  
  try {
    // Clear local embeddings
    if (await fs.pathExists(embeddingsPath)) {
      await fs.remove(embeddingsPath);
      console.log('✓ Cleared local embeddings');
    }
    

    
    console.log('All embeddings cleared successfully!');
  } catch (error) {
    console.error('Error clearing embeddings:', error);
    process.exit(1);
  }
}

clearAllEmbeddings();