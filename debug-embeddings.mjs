#!/usr/bin/env node

import { UnifiedEmbeddingService } from './server/s01_server-first-app/lib/documents/unifiedEmbeddingService.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugEmbeddings() {
  // Change to server directory for correct database path
  process.chdir(join(__dirname, 'server/s01_server-first-app'));
  
  const embeddingService = new UnifiedEmbeddingService();
  const collection = 'Family-Documents';
  
  console.log('=== EMBEDDING DEBUG ANALYSIS ===\n');
  
  // Test different queries
  const queries = ['policy', 'health insurance', 'USBB-HEALTH-2025-FAM'];
  
  for (const query of queries) {
    console.log(`Query: "${query}"`);
    console.log('---');
    
    try {
      // Get query embedding
      const queryEmbedding = await embeddingService.createEmbedding(query);
      console.log(`Query embedding length: ${queryEmbedding.length}`);
      console.log(`Query embedding sample: [${queryEmbedding.slice(0, 5).map(n => n.toFixed(4)).join(', ')}...]`);
      
      // Get chunks with similarity scores
      const chunks = await embeddingService.findSimilarChunks(query, collection, 15);
      
      console.log(`\nFound ${chunks.length} chunks:`);
      
      // Group by document
      const byDocument = {};
      chunks.forEach(chunk => {
        if (!byDocument[chunk.filename]) {
          byDocument[chunk.filename] = [];
        }
        byDocument[chunk.filename].push(chunk);
      });
      
      Object.keys(byDocument).forEach(filename => {
        const docChunks = byDocument[filename];
        const avgSimilarity = docChunks.reduce((sum, c) => sum + c.similarity, 0) / docChunks.length;
        console.log(`  ${filename}: ${docChunks.length} chunks, avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
        
        // Show top chunk from this document
        const topChunk = docChunks[0];
        console.log(`    Top chunk: ${(topChunk.similarity * 100).toFixed(1)}% - "${topChunk.content.substring(0, 100)}..."`);
      });
      
    } catch (error) {
      console.error(`Error with query "${query}":`, error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

debugEmbeddings().catch(console.error);