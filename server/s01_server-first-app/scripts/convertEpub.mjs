#!/usr/bin/env node

import EpubConverter from '../lib/documents/epubConverter.mjs';
import path from 'path';

const converter = new EpubConverter();

// Convert the Federalist Papers EPUB
const epubPath = path.resolve('../../../sources/local-documents/USA-History/alexander-hamilton-john-jay-james-madison_the-federalist-papers.epub');

console.log('🔄 Converting EPUB to Markdown...');

try {
  const result = await converter.convertEpubToMarkdown(epubPath);
  console.log('✅ Conversion completed successfully!');
  console.log(`📄 Output file: ${result}`);
} catch (error) {
  console.error('❌ Conversion failed:', error.message);
  process.exit(1);
}