#!/usr/bin/env node

import { UnifiedEmbeddingService } from './server/s01_server-first-app/lib/documents/unifiedEmbeddingService.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function recreateDatabase() {
  process.chdir(join(__dirname, 'server/s01_server-first-app'));
  
  console.log('Recreating unified embeddings database...');
  
  const embeddingService = new UnifiedEmbeddingService();
  
  // This will create the database and schema
  await embeddingService.setupDatabase();
  
  console.log('Database recreated successfully!');
  console.log('You can now use Collections Editor to embed documents.');
}

recreateDatabase().catch(console.error);