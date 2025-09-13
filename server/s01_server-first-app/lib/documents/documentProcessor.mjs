import fs from 'fs-extra';
import path from 'path';
import { validatePath, validateFilename } from '../utils/pathValidator.mjs';
import { Ollama } from 'ollama';

/* global process */

export class DocumentProcessor {
  constructor() {
    this.supportedFormats = ['.txt', '.pdf'];
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.metadataModel = null;
  }
  
  // Clear cached model to force re-read from config
  clearModelCache() {
    this.metadataModel = null;
  }
  
  async getMetadataModel() {
    if (this.metadataModel) return this.metadataModel;
    
    try {
      // First try to get metadata model from config
      const modelListPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/model-list.json');
      const modelList = JSON.parse(await fs.readFile(modelListPath, 'utf8'));
      const metadataModels = modelList.models.filter(m => m.category === 'metadata');
      
      if (metadataModels.length > 0) {
        this.metadataModel = metadataModels[0].name;
        return this.metadataModel;
      }
    } catch (error) {
      // Config file error, continue to fallback
    }
    
    // Fallback: get first available model from Ollama
    try {
      const response = await this.ollama.list();
      if (response.models && response.models.length > 0) {
        this.metadataModel = response.models[0].name;
      } else {
        throw new Error('No models available in Ollama');
      }
    } catch (error) {
      throw new Error(`No models available for metadata generation: ${error.message}`);
    }
    
    return this.metadataModel;
  }

  async convertToMarkdown(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.txt':
        return await this.processText(filePath);
      case '.pdf':
        return await this.processPDF(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  async processText(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const filename = path.basename(filePath, '.txt');
    
    return `# ${filename}\n\n${content}`;
  }

  async processPDF(filePath) {
    const filename = path.basename(filePath, '.pdf');
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
      return `# ${filename}\n\n${stdout.trim()}`;
    } catch (error) {
      return `# ${filename}\n\n[Error extracting PDF content: ${error.message}]`;
    }
  }

  async convertCollectionFiles(collection) {
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = validatePath(collection, baseDir);
    const files = await fs.readdir(collectionPath);
    const results = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (this.supportedFormats.includes(ext)) {
        try {
          const safeFilename = validateFilename(file);
          const filePath = path.join(collectionPath, safeFilename);
          const markdown = await this.convertToMarkdown(filePath);
          const outputFile = safeFilename.replace(ext, '.md');
          const outputPath = path.join(collectionPath, outputFile);
          
          await fs.writeFile(outputPath, markdown, 'utf8');
          results.push({ original: file, converted: outputFile, success: true });
        } catch (error) {
          results.push({ original: file, error: error.message, success: false });
        }
      }
    }

    return results;
  }

  async generateDocumentMetadata(collection) {
    this.clearModelCache();
    
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = validatePath(collection, baseDir);
    const files = await fs.readdir(collectionPath);
    
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_') && !f.startsWith('META_'));
    const results = [];
    
    for (const mdFile of mdFiles) {
      try {
        const filePath = path.join(collectionPath, mdFile);
        const content = await fs.readFile(filePath, 'utf8');
        
        const metadata = await this.createDocumentMetadata(content, mdFile, collection);
        const metadataPath = path.join(collectionPath, `META_${mdFile}`);
        
        await fs.writeFile(metadataPath, metadata, 'utf8');
        results.push({ file: mdFile, success: true });
      } catch (error) {
        results.push({ file: mdFile, error: error.message, success: false });
      }
    }
    
    return { collection, processed: results };
  }

  async createDocumentMetadata(content, filename, collection) {
    const prompt = `Analyze this document and create metadata in the following markdown format:

# Document Metadata: [Document Title]

## Basic Information
- **Collection**: ${collection}
- **Document Type**: [Brief classification]
- **Date**: [Document date if available]
- **Length**: [Approximate word count]

## Content Summary
[2-3 sentences describing main content/purpose]

## Key Topics
- [Topic 1]
- [Topic 2]
- [Topic 3]

## Important Keywords
[Comma-separated list of 8-10 key terms for search]

## Document Relationships
[Any references to other documents or related topics]

---
Document content:
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;

    try {
      const model = await this.getMetadataModel();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 500 }
      });
      
      return response.response;
    } catch (error) {
      return `# Document Metadata: ${filename}\n\nError generating metadata: ${error.message}\n\n*Generated: ${new Date().toISOString()}*`;
    }
  }

  async generateCollectionMetadata(collection) {
    // Generate individual document metadata first
    const docResult = await this.generateDocumentMetadata(collection);
    
    // Generate collection-level summary using the new META_ approach
    await this.generateCollectionSummary(collection);
    
    return {
      collection,
      documentsProcessed: docResult.processed.length,
      metadataGenerated: ['META_document_files', 'META_collection_summary']
    };
  }

  async generateCollectionSummary(collection) {
    this.clearModelCache();
    
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = validatePath(collection, baseDir);
    const files = await fs.readdir(collectionPath);
    
    // Get all META files (individual document metadata)
    const metaFiles = files.filter(f => f.startsWith('META_') && f.endsWith('.md') && !f.includes('_Collection'));
    
    if (metaFiles.length === 0) {
      return { message: 'No individual metadata files found. Generate document metadata first.' };
    }
    
    // Read all individual metadata
    let allMetadata = '';
    for (const metaFile of metaFiles) {
      const content = await fs.readFile(path.join(collectionPath, metaFile), 'utf8');
      allMetadata += `\n--- ${metaFile} ---\n${content}`;
    }
    
    const prompt = `Analyze all the individual document metadata below and create a collection-level summary:

# Collection Metadata: ${collection}

## Collection Overview
- **Total Documents**: ${metaFiles.length}
- **Date Range**: [Earliest to latest dates found]
- **Document Types**: [List of types found]
- **Total Estimated Words**: [Sum if available]

## Content Categories
[Group documents by themes, genres, or types]

## Major Themes
[Cross-cutting themes that appear across multiple documents]

## Key Topics Across Collection
[Most frequent/important topics from all documents]

## Collection Keywords
[Master list of most important search terms for this collection]

## Document Interconnections
[How documents relate to each other, common references]

## Notable Patterns
[Any interesting patterns observed across the collection]

---
Individual document metadata:
${allMetadata.substring(0, 3000)}${allMetadata.length > 3000 ? '...' : ''}`;

    try {
      const model = await this.getMetadataModel();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 600 }
      });
      
      const summaryPath = path.join(collectionPath, `META_${collection}_Collection.md`);
      await fs.writeFile(summaryPath, response.response, 'utf8');
      
      return { success: true, file: `META_${collection}_Collection.md` };
    } catch (error) {
      const errorContent = `# Collection Metadata: ${collection}\n\nError generating collection summary: ${error.message}\n\n*Generated: ${new Date().toISOString()}*`;
      const summaryPath = path.join(collectionPath, `META_${collection}_Collection.md`);
      await fs.writeFile(summaryPath, errorContent, 'utf8');
      
      return { success: false, error: error.message };
    }
  }

}