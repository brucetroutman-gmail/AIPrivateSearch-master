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
    
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('META_'));
    
    // Process in parallel (but limit concurrency to avoid overwhelming Ollama)
    const batchSize = 2; // Process 2 at a time
    const results = [];
    
    for (let i = 0; i < mdFiles.length; i += batchSize) {
      const batch = mdFiles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (mdFile) => {
        try {
          const filePath = path.join(collectionPath, mdFile);
          const content = await fs.readFile(filePath, 'utf8');
          
          const metadata = await this.createDocumentMetadata(content, mdFile, collection);
          const metadataPath = path.join(collectionPath, `META_${mdFile}`);
          
          await fs.writeFile(metadataPath, metadata, 'utf8');
          return { file: mdFile, success: true };
        } catch (error) {
          return { file: mdFile, error: error.message, success: false };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return { collection, processed: results };
  }

  async createDocumentMetadata(content, filename, collection) {
    // Shorter, faster prompt
    const prompt = `Create brief metadata for this ${collection} document:

Title: ${filename}
Summary: [1 sentence]
Topics: [3 key topics]
Keywords: [5 search terms]

Content: ${content.substring(0, 800)}${content.length > 800 ? '...' : ''}`;

    try {
      const model = await this.getMetadataModel();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: { 
          temperature: 0.1, // Lower for faster generation
          num_predict: 200   // Much shorter output
        }
      });
      
      return `# ${filename}\n\n${response.response}\n\n*Generated: ${new Date().toISOString()}*`;
    } catch (error) {
      return `# ${filename}\n\nError: ${error.message}\n\n*Generated: ${new Date().toISOString()}*`;
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
    
    const prompt = `Summarize this ${collection} collection (${metaFiles.length} documents):

Overview: [1 sentence about the collection]
Main themes: [3 key themes]
Search keywords: [10 important terms]

Documents: ${allMetadata.substring(0, 1500)}${allMetadata.length > 1500 ? '...' : ''}`;

    try {
      const model = await this.getMetadataModel();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 300 }
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