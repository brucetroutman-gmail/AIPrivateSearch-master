#!/usr/bin/env node

import { DocumentProcessor } from './server/s01_server-first-app/lib/documents/documentProcessor.mjs';
import fs from 'fs/promises';
import path from 'path';

async function testMetadataGeneration() {
  console.log('🧪 Testing Metadata Generation Integration...\n');
  
  const processor = new DocumentProcessor();
  
  // Use existing test-metadata collection
  const testCollection = 'test-metadata';
  const testPath = path.join(process.cwd(), 'sources/local-documents', testCollection);
  
  try {
    // Check if collection exists, if not create it
    try {
      await fs.access(testPath);
      console.log('✅ Found existing test-metadata collection');
    } catch {
      await fs.mkdir(testPath, { recursive: true });
      console.log('✅ Created test-metadata collection');
    }
    
    // Create a test document
    const testDoc = `# Test Document

This is a sample document for testing metadata generation.

## Introduction
This document contains information about artificial intelligence and machine learning concepts.

## Key Topics
- Natural Language Processing
- Vector Embeddings
- Document Search
- Semantic Analysis

## Conclusion
This document demonstrates the metadata generation capabilities of the AISearchScore system.
`;
    
    const testFilePath = path.join(testPath, 'sample-document.md');
    await fs.writeFile(testFilePath, testDoc, 'utf8');
    console.log('✅ Created test document: sample-document.md');
    
    // Test individual document metadata generation
    console.log('\n📝 Testing individual document metadata generation...');
    console.log('Note: This test simulates the server environment by using the correct working directory context.');
    
    // Simulate server working directory context
    const originalCwd = process.cwd();
    process.chdir(path.join(process.cwd(), 'server/s01_server-first-app'));
    
    try {
      const docResult = await processor.generateDocumentMetadata(testCollection);
      console.log('Result:', JSON.stringify(docResult, null, 2));
      
      // Check if META file was created
      const metaFilePath = path.join(testPath, 'META_sample-document.md');
      try {
        await fs.access(metaFilePath);
        console.log('✅ META_sample-document.md created successfully');
        const metaContent = await fs.readFile(metaFilePath, 'utf8');
        console.log('\n📄 Generated metadata preview:');
        console.log(metaContent.substring(0, 500) + '...');
      } catch {
        console.log('❌ META file not created');
      }
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Start your servers: npm run dev');
    console.log('2. Go to Collections interface');
    console.log('3. Edit the "test-metadata" collection');
    console.log('4. Click "Generate Metadata" to see the full workflow');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testMetadataGeneration();