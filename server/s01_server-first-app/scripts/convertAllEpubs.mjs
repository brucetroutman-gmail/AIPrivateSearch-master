#!/usr/bin/env node

import EpubConverter from '../lib/documents/epubConverter.mjs';
import path from 'path';
import fs from 'fs';

const converter = new EpubConverter();

// Base directory for local documents
const baseDir = path.resolve('../../../sources/local-documents');

async function convertAllEpubsRecursively(dir) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        const subResults = await convertAllEpubsRecursively(fullPath);
        results.push(...subResults);
      } else if (item.toLowerCase().endsWith('.epub')) {
        // Convert EPUB file
        console.log(`📚 Found EPUB: ${fullPath}`);
        try {
          const outputFile = await converter.convertEpubToMarkdown(fullPath);
          results.push({ success: true, input: fullPath, output: outputFile });
        } catch (error) {
          results.push({ success: false, input: fullPath, error: error.message });
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }
  
  return results;
}

console.log('🔄 Scanning for EPUB files in local documents...');

try {
  const results = await convertAllEpubsRecursively(baseDir);
  
  console.log('\n📊 Conversion Summary:');
  console.log(`Total files processed: ${results.length}`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful conversions: ${successful.length}`);
  console.log(`❌ Failed conversions: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully converted:');
    successful.forEach(r => {
      console.log(`  📄 ${path.basename(r.output)}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed conversions:');
    failed.forEach(r => {
      console.log(`  📚 ${path.basename(r.input)}: ${r.error}`);
    });
  }
  
} catch (error) {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}