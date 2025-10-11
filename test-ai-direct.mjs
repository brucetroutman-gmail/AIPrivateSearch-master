#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

async function testAIDirectSearch() {
  const query = 'policy';
  const model = 'llama3.2:3b';
  const documentsPath = '/Users/Shared/repos/aisearchscore/sources/local-documents/Family-Documents';
  
  console.log(`Testing AI Direct Search with query: "${query}" using model: ${model}`);
  console.log(`Documents path: ${documentsPath}`);
  console.log('---');
  
  const files = readdirSync(documentsPath).filter(f => f.endsWith('.md') && !f.startsWith('META_'));
  console.log(`Found ${files.length} documents to test`);
  
  for (const filename of files) {
    const startTime = Date.now();
    console.log(`\nTesting: ${filename}`);
    
    try {
      const filePath = join(documentsPath, filename);
      const content = readFileSync(filePath, 'utf-8');
      
      const prompt = `Document: ${filename}

${content.substring(0, 1000)}

Question: Does this document contain information about "${query}"? If yes, explain what it contains. If no, say "NO_MATCH".

Answer:`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_ctx: 1024
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (!response.ok) {
        console.log(`  ERROR: HTTP ${response.status} (${duration}ms)`);
        continue;
      }
      
      const result = await response.json();
      const aiResponse = result.response || 'No response';
      
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Response: ${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}`);
      console.log(`  Match: ${!aiResponse.startsWith('NO_MATCH')}`);
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error.name === 'AbortError') {
        console.log(`  TIMEOUT after ${duration}ms`);
      } else {
        console.log(`  ERROR: ${error.message} (${duration}ms)`);
      }
    }
  }
}

testAIDirectSearch().catch(console.error);