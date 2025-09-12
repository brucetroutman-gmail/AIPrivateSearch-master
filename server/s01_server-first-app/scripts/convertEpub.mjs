#!/usr/bin/env node

import EpubConverter from '../lib/documents/epubConverter.mjs';
import path from 'path';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

const converter = new EpubConverter();

// Convert the Federalist Papers EPUB
const epubPath = path.resolve('../../../sources/local-documents/USA-History/alexander-hamilton-john-jay-james-madison_the-federalist-papers.epub');

logger.log('🔄 Converting EPUB to Markdown...');

try {
  const result = await converter.convertEpubToMarkdown(epubPath);
  logger.log('✅ Conversion completed successfully!');
  logger.log(`📄 Output file: ${result}`);
} catch (error) {
  // logger sanitizes all inputs to prevent log injection
  logger.error('❌ Conversion failed:', error.message);
  process.exit(1);
}