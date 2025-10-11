#!/usr/bin/env node

import { SqlJsWrapper } from './server/s01_server-first-app/lib/utils/SqlJsWrapper.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkStoredEmbeddings() {
  process.chdir(join(__dirname, 'server/s01_server-first-app'));
  
  const db = new SqlJsWrapper('./data/databases/unified_embeddings.db');
  await db.init();
  
  console.log('=== STORED EMBEDDINGS CHECK ===\n');
  
  // Get a few chunks and check their embeddings
  const chunks = db.prepare(`
    SELECT c.*, cd.filename 
    FROM chunks c
    JOIN collection_documents cd ON c.document_id = cd.document_id
    WHERE cd.collection = 'Family-Documents'
    LIMIT 3
  `).all();
  
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}: ${chunk.filename}`);
    console.log(`Content: ${chunk.content.substring(0, 100)}...`);
    
    try {
      const embedding = JSON.parse(chunk.embedding);
      console.log(`Embedding length: ${embedding.length}`);
      console.log(`Embedding type: ${typeof embedding[0]}`);
      console.log(`Embedding sample: [${embedding.slice(0, 5).map(n => typeof n === 'number' ? n.toFixed(4) : n).join(', ')}...]`);
      
      // Check for NaN or invalid values
      const hasNaN = embedding.some(val => isNaN(val) || !isFinite(val));
      const hasNull = embedding.some(val => val === null || val === undefined);
      console.log(`Has NaN/Infinite: ${hasNaN}`);
      console.log(`Has null/undefined: ${hasNull}`);
      
    } catch (error) {
      console.log(`Error parsing embedding: ${error.message}`);
    }
    
    console.log('---');
  });
  
  db.close();
}

checkStoredEmbeddings().catch(console.error);