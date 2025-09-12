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

  async generateCollectionMetadata(collection) {
    // Clear cached model to ensure we use latest config
    this.clearModelCache();
    
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = validatePath(collection, baseDir);
    const files = await fs.readdir(collectionPath);
    
    // Get all markdown files (converted documents)
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));
    const documents = [];
    
    // Read all documents
    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(collectionPath, file), 'utf8');
      documents.push({ filename: file, content });
    }
    
    if (documents.length === 0) return { message: 'No documents found' };
    
    // Generate metadata
    const summary = await this.createCollectionSummary(documents, collection);
    const index = await this.createDocumentIndex(documents);
    const topicMap = await this.extractTopicMap(documents);
    
    // Save metadata files
    await fs.writeFile(path.join(collectionPath, '_collection_summary.md'), summary, 'utf8');
    await fs.writeFile(path.join(collectionPath, '_document_index.md'), index, 'utf8');
    await fs.writeFile(path.join(collectionPath, '_topic_map.md'), topicMap, 'utf8');
    
    return {
      collection,
      documentsProcessed: documents.length,
      metadataGenerated: ['summary', 'index', 'topic_map']
    };
  }
  
  async createCollectionSummary(documents, collection) {
    const docList = documents.map(d => `- ${d.filename}`).join('\n');
    const sampleContent = documents.slice(0, 3).map(d => 
      `**${d.filename}**: ${d.content.substring(0, 200)}...`
    ).join('\n\n');
    
    const prompt = `Analyze this document collection "${collection}" and create a comprehensive summary.

Documents (${documents.length} total):
${docList}

Sample content:
${sampleContent}

Provide:
1. Collection overview (2-3 sentences)
2. Main topics covered
3. Document types and purposes
4. Key themes and relationships

Keep it concise but informative.`;
    
    try {
      const model = await this.getMetadataModel();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 300 }
      });
      
      return `# Collection Summary: ${collection}\n\n${response.response}\n\n*Generated: ${new Date().toISOString()}*`;
    } catch (error) {
      return `# Collection Summary: ${collection}\n\nError generating summary: ${error.message}\n\n*Generated: ${new Date().toISOString()}*`;
    }
  }
  
  async createDocumentIndex(documents) {
    let index = '# Document Index\n\n';
    
    for (const doc of documents) {
      const firstLines = doc.content.split('\n').slice(0, 5).join(' ').substring(0, 150);
      const prompt = `Summarize this document in 1-2 sentences and list 3-5 key topics:\n\n${firstLines}...`;
      
      try {
        const model = await this.getMetadataModel();
        const response = await this.ollama.generate({
          model,
          prompt,
          stream: false,
          options: { temperature: 0.2, num_predict: 100 }
        });
        
        index += `## ${doc.filename}\n${response.response}\n\n`;
      } catch (error) {
        index += `## ${doc.filename}\nError generating description: ${error.message}\n\n`;
      }
    }
    
    index += `*Generated: ${new Date().toISOString()}*`;
    return index;
  }
  
  async extractTopicMap(documents) {
    const allContent = documents.map(d => d.content.substring(0, 500)).join('\n\n');
    const prompt = `Extract key topics and concepts from this document collection. Provide:

1. **Main Topics** (5-8 topics)
2. **Key Concepts** (important terms and ideas)
3. **Suggested Search Terms** (what users might search for)
4. **Document Relationships** (how documents connect)

Content sample:
${allContent.substring(0, 1000)}...

Format as markdown with clear sections.`;
    
    try {
      const model = await this.getMetadataModel();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 400 }
      });
      
      return `# Topic Map\n\n${response.response}\n\n*Generated: ${new Date().toISOString()}*`;
    } catch (error) {
      return `# Topic Map\n\nError generating topic map: ${error.message}\n\n*Generated: ${new Date().toISOString()}*`;
    }
  }
}