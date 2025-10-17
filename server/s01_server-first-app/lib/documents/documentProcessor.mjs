import { secureFs } from '../utils/secureFileOps.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import path from 'path';
import { validatePath, validateFilename } from '../utils/pathValidator.mjs';
import { Ollama } from 'ollama';

export class DocumentProcessor {
  constructor() {
    this.supportedFormats = ['.txt', '.pdf', '.docx', '.doc'];
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.metadataModel = null;
    this.docIdCounter = 1;
    this.initializeDocumentTypePatterns();
  }
  
  initializeDocumentTypePatterns() {
    this.patterns = {
      academic: {
        keywords: ['abstract', 'methodology', 'references', 'doi', 'journal', 'peer review', 'hypothesis', 'conclusion', 'literature review', 'statistical analysis'],
        structure: ['introduction', 'methods', 'results', 'discussion', 'bibliography'],
        weight: 0
      },
      legal: {
        keywords: ['whereas', 'herein', 'plaintiff', 'defendant', 'jurisdiction', 'statute', 'case law', 'precedent', 'court', 'legal'],
        structure: ['parties', 'jurisdiction', 'findings', 'order', 'citation'],
        weight: 0
      },
      technical: {
        keywords: ['api', 'documentation', 'installation', 'configuration', 'troubleshooting', 'dependencies', 'version', 'endpoint'],
        structure: ['overview', 'installation', 'usage', 'examples', 'api reference'],
        weight: 0
      },
      business: {
        keywords: ['revenue', 'profit', 'stakeholder', 'proposal', 'budget', 'quarterly', 'fiscal', 'department', 'executive'],
        structure: ['executive summary', 'objectives', 'analysis', 'recommendations', 'appendix'],
        weight: 0
      },
      medical: {
        keywords: ['patient', 'diagnosis', 'treatment', 'symptoms', 'medical history', 'clinical', 'therapy', 'medication', 'icd'],
        structure: ['chief complaint', 'history', 'examination', 'assessment', 'plan'],
        weight: 0
      },
      insurance: {
        keywords: ['policy', 'premium', 'deductible', 'coverage', 'beneficiary', 'claim', 'insured', 'liability', 'exclusion'],
        structure: ['policy number', 'coverage details', 'terms', 'conditions', 'exclusions'],
        weight: 0
      },
      financial: {
        keywords: ['balance sheet', 'income statement', 'cash flow', 'assets', 'liabilities', 'equity', 'gaap', 'audit'],
        structure: ['financial statements', 'notes', 'auditor report', 'management discussion'],
        weight: 0
      }
    };
  }
  
  // Clear cached model to force re-read from config
  clearModelCache() {
    this.metadataModel = null;
  }

  generateDocId(collection) {
    const timestamp = Date.now().toString().slice(-6);
    const collectionPrefix = collection.substring(0, 3).toLowerCase();
    return `${collectionPrefix}_${timestamp}`;
  }

  async addDocIdToFile(filePath, docId) {
    const content = await secureFs.readFile(filePath, 'utf8');
    const docIdHeader = `---\nDocID: ${docId}\n---\n\n`;
    
    // Check if file already has docid
    if (content.includes('DocID:')) {
      return docId; // Already has docid
    }
    
    const updatedContent = docIdHeader + content;
    await secureFs.writeFile(filePath, updatedContent, 'utf8');
    return docId;
  }
  
  async getMetadataModel() {
    if (this.metadataModel) return this.metadataModel;
    
    try {
      // First try to get metadata model from config
      const modelListPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/model-list.json');
      const modelList = JSON.parse(await secureFs.readFile(modelListPath, 'utf8'));
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
      case '.docx':
      case '.doc':
        return await this.processDocx(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  async processText(filePath) {
    const content = await secureFs.readFile(filePath, 'utf8');
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

  async processDocx(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath, ext);
    
    try {
      const mammoth = await import('mammoth');
      const buffer = await secureFs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return `# ${filename}\n\n${result.value.trim()}`;
    } catch (error) {
      return `# ${filename}\n\n[Error extracting DOCX content: ${error.message}]`;
    }
  }

  async convertCollectionFiles(collection) {
    const baseDir = CollectionsUtil.getCollectionsPath();
    const collectionPath = validatePath(collection, baseDir);
    const files = await secureFs.readdir(collectionPath);
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
          
          await secureFs.writeFile(outputPath, markdown, 'utf8');
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
    
    const baseDir = CollectionsUtil.getCollectionsPath();
    const collectionPath = validatePath(collection, baseDir);
    const files = await secureFs.readdir(collectionPath);
    
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('META_'));
    
    // Process in parallel (but limit concurrency to avoid overwhelming Ollama)
    const batchSize = 2; // Process 2 at a time
    const results = [];
    
    for (let i = 0; i < mdFiles.length; i += batchSize) {
      const batch = mdFiles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (mdFile) => {
        const startTime = Date.now();
        try {
          const filePath = path.join(collectionPath, mdFile);
          const content = await secureFs.readFile(filePath, 'utf8');
          
          // Extract existing DocID or generate new one
          let docId;
          const existingDocIdMatch = content.match(/^---\s*\nDocID:\s*(.+)\s*\n---/m);
          if (existingDocIdMatch) {
            docId = existingDocIdMatch[1].trim();
          } else {
            docId = this.generateDocId(collection);
            await this.addDocIdToFile(filePath, docId);
          }
          
          const metadata = await this.createDocumentMetadata(content, mdFile, collection, startTime, docId);
          const metadataPath = path.join(collectionPath, `META_${mdFile}`);
          
          await secureFs.writeFile(metadataPath, metadata, 'utf8');
          const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
          return { file: mdFile, success: true, processingTime: `${processingTime}s`, docId };
        } catch (error) {
          const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
          return { file: mdFile, error: error.message, success: false, processingTime: `${processingTime}s` };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return { collection, processed: results };
  }

  determineDocumentType(content) {
    const lowerContent = content.toLowerCase();
    
    // Reset weights
    Object.keys(this.patterns).forEach(type => {
      this.patterns[type].weight = 0;
    });

    // Score based on keywords
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      pattern.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = (lowerContent.match(regex) || []).length;
        pattern.weight += matches * 2;
      });

      // Score based on structure
      pattern.structure.forEach(structureElement => {
        if (lowerContent.includes(structureElement.toLowerCase())) {
          pattern.weight += 3;
        }
      });
    });

    // Find the highest scoring type
    let bestType = 'general';
    let highestScore = 0;

    Object.entries(this.patterns).forEach(([type, pattern]) => {
      if (pattern.weight > highestScore) {
        highestScore = pattern.weight;
        bestType = type;
      }
    });

    return highestScore >= 3 ? bestType : 'general';
  }
  
  generateBaseMetadata(content) {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const wordFreq = {};
    const nounFreq = {};
    const verbFreq = {};
    
    // Common noun patterns (simplified)
    const nounPatterns = /\b\w+(?:tion|sion|ment|ness|ity|ism|er|or|ist|ing|ure|ance|ence|ship|hood|dom|ward|ful|less|able|ible)\b/gi;
    // Common verb patterns (simplified)
    const verbPatterns = /\b\w+(?:ed|ing|s|es|en|ate|ize|ise|fy)\b/gi;
    
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        
        // Simple noun detection
        if (nounPatterns.test(word) || /^[A-Z]/.test(word)) {
          nounFreq[cleanWord] = (nounFreq[cleanWord] || 0) + 1;
        }
        
        // Simple verb detection
        if (verbPatterns.test(word)) {
          verbFreq[cleanWord] = (verbFreq[cleanWord] || 0) + 1;
        }
      }
    });

    const frequentWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
      
    const frequentNouns = Object.entries(nounFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => `${word} ${count}`);
      
    const frequentVerbs = Object.entries(verbFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => `${word} ${count}`);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: Math.round(words.length / sentences.length),
      readingTimeMinutes: Math.ceil(words.length / 200),
      frequentWords,
      frequentNouns,
      frequentVerbs
    };
  }

  async createDocumentMetadata(content, filename, collection, startTime, docId) {
    const documentType = this.determineDocumentType(content);
    const baseMetadata = this.generateBaseMetadata(content);
    
    // Load existing metadata context for enhanced processing
    const metadataContext = await this.loadMetadataContext(collection, filename);
    
    const prompt = this.buildMetadataPrompt({
      filename,
      documentType,
      collection,
      baseMetadata,
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
      context: metadataContext
    });

    try {
      const model = await this.getMetadataModel();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: { 
          temperature: 0.1,
          num_predict: 300
        }
      });
      
      const processingTime = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : 'Unknown';
      const metadata = `---
DocID: ${docId}
---

# ${filename}

**Document Type:** ${documentType}
**Word Count:** ${baseMetadata.wordCount}
**Reading Time:** ${baseMetadata.readingTimeMinutes} minutes
**Paragraphs:** ${baseMetadata.paragraphCount}
**Sentences:** ${baseMetadata.sentenceCount}

## AI Analysis

${response.response}

*Generated: ${new Date().toISOString()}*
*Processing Time: ${processingTime}s*`;
      
      return metadata;
    } catch (error) {
      const processingTime = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : 'Unknown';
      return `---\nDocID: ${docId}\n---\n\n# ${filename}\n\n**Document Type:** ${documentType}\n**Error:** ${error.message}\n\n*Generated: ${new Date().toISOString()}*\n*Processing Time: ${processingTime}s*`;
    }
  }
  
  async loadMetadataContext(collection, currentFilename) {
    const baseDir = CollectionsUtil.getCollectionsPath();
    const collectionPath = validatePath(collection, baseDir);
    
    try {
      const files = await secureFs.readdir(collectionPath);
      const context = {
        collectionInfo: null,
        existingDocuments: [],
        relatedThemes: new Set(),
        documentTypes: new Set()
      };
      
      // Load collection metadata if exists
      const collectionMeta = files.find(f => f.startsWith('META_') && f.includes('_Collection.md'));
      if (collectionMeta) {
        const collectionContent = await secureFs.readFile(path.join(collectionPath, collectionMeta), 'utf8');
        context.collectionInfo = this.parseCollectionContext(collectionContent);
      }
      
      // Load existing document metadata for context
      const metaFiles = files.filter(f => f.startsWith('META_') && f.endsWith('.md') && !f.includes('_Collection'));
      
      for (const metaFile of metaFiles.slice(0, 5)) { // Limit to 5 for context
        const docName = metaFile.replace('META_', '').replace('.md', '');
        if (docName !== currentFilename.replace('.md', '')) {
          const metaContent = await secureFs.readFile(path.join(collectionPath, metaFile), 'utf8');
          const docMeta = this.parseDocumentContext(metaContent);
          context.existingDocuments.push({ name: docName, ...docMeta });
          if (docMeta.mainTheme) context.relatedThemes.add(docMeta.mainTheme);
          if (docMeta.documentType) context.documentTypes.add(docMeta.documentType);
        }
      }
      
      return context;
    } catch (error) {
      return { collectionInfo: null, existingDocuments: [], relatedThemes: new Set(), documentTypes: new Set() };
    }
  }
  
  parseCollectionContext(content) {
    const context = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('**Total Documents:**')) {
        context.totalDocuments = line.match(/\d+/)?.[0];
      } else if (line.includes('**Collection Name:**')) {
        context.name = line.split('**Collection Name:**')[1]?.trim();
      }
    }
    
    // Extract main themes
    const themesSection = content.match(/## Main Themes([\s\S]*?)##/)?.[1];
    if (themesSection) {
      context.mainThemes = themesSection.match(/\*\*([^*]+)\*\*/g)?.map(t => t.replace(/\*\*/g, '')) || [];
    }
    
    return context;
  }
  
  parseDocumentContext(content) {
    const context = {};
    
    const typeMatch = content.match(/\*\*Document Type:\*\*\s*(.+)/i);
    if (typeMatch) context.documentType = typeMatch[1].trim();
    
    const analysisMatch = content.match(/## AI Analysis\s*\n\n([\s\S]*?)\n\n##/i);
    if (analysisMatch) {
      const analysis = analysisMatch[1];
      const topicsMatch = analysis.match(/Topics:\s*(.+)/i);
      if (topicsMatch) {
        const topics = topicsMatch[1].split(',').map(t => t.trim());
        context.mainTheme = topics[0] || 'Unknown';
      }
    }
    
    return context;
  }
  
  buildMetadataPrompt({ filename, documentType, collection, baseMetadata, content, context }) {
    const prompt = `Create metadata for this ${documentType} document:

Title: ${filename}
Type: ${documentType}
Summary: [1-2 sentences]
Topics: [3-5 key topics]
Keywords: [8-10 search terms]

Content: ${content}`;
    
    return prompt;
  }

  async generateCollectionMetadata(collection) {
    // Generate individual document metadata first
    const docResult = await this.generateDocumentMetadata(collection);
    
    // Generate collection-level summary using the new META_ approach
    await this.generateCollectionSummary(collection);
    
    // Concatenate all META files and store as meta-prompt
    await this.concatenateMetaFiles(collection);
    
    return {
      collection,
      documentsProcessed: docResult.processed.length,
      metadataGenerated: ['META_document_files', 'META_collection_summary', 'meta_prompt']
    };
  }

  async generateCollectionSummary(collection) {
    const baseDir = CollectionsUtil.getCollectionsPath();
    const collectionPath = validatePath(collection, baseDir);
    
    try {
      const metadata = await this.buildCollectionMetadata(collection, collectionPath);
      const content = this.generateCollectionMarkdown(metadata);
      
      const summaryPath = path.join(collectionPath, `META_${collection}_Collection.md`);
      await secureFs.writeFile(summaryPath, content, 'utf8');
      
      return { success: true, file: `META_${collection}_Collection.md` };
    } catch (error) {
      const errorContent = `# Collection Metadata: ${collection}\n\nError generating collection metadata: ${error.message}\n\n*Generated: ${new Date().toISOString()}*`;
      const summaryPath = path.join(collectionPath, `META_${collection}_Collection.md`);
      await secureFs.writeFile(summaryPath, errorContent, 'utf8');
      
      return { success: false, error: error.message };
    }
  }
  
  async buildCollectionMetadata(collection, collectionPath) {
    const files = await secureFs.readdir(collectionPath);
    
    // Only process META files for source documents (exclude collection META files)
    const metaFiles = files.filter(file => 
      file.startsWith('META_') && 
      file.endsWith('.md') && 
      !file.includes('_Collection.md')
    );
    
    const processedDocuments = [];
    
    for (const metaFile of metaFiles) {
      const filePath = path.join(collectionPath, metaFile);
      const stats = await secureFs.stat(filePath);
      
      // Extract source filename from META filename
      const sourceFileName = metaFile.replace('META_', '').replace('.md', '') + '.md';
      
      let docMetadata = {
        documentType: 'unknown',
        mainTheme: 'Not analyzed',
        summary: 'No summary available',
        author: 'Unknown',
        status: 'Unprocessed',
        language: 'Unknown',
        importance: 'Medium',
        keywords: [],
        docId: 'Unknown'
      };
      
      docMetadata = await this.parseMetaFile(filePath);
      
      processedDocuments.push({
        fileName: sourceFileName,
        metaFileName: metaFile,
        fileSize: stats.size,
        fileSizeFormatted: this.formatFileSize(stats.size),
        createdDate: stats.birthtime.toISOString(),
        modifiedDate: stats.mtime.toISOString(),
        ...docMetadata
      });
    }
    
    // Build collection statistics
    const totalSize = processedDocuments.reduce((sum, doc) => sum + doc.fileSize, 0);
    const documentTypes = {};
    const themes = {};
    
    processedDocuments.forEach(doc => {
      documentTypes[doc.documentType] = (documentTypes[doc.documentType] || 0) + 1;
      if (doc.mainTheme && doc.mainTheme !== 'Not analyzed') {
        themes[doc.mainTheme] = (themes[doc.mainTheme] || 0) + 1;
      }
    });
    
    return {
      collectionName: collection,
      totalDocuments: processedDocuments.length,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize),
      documentTypes,
      overallThemes: Object.entries(themes).sort(([,a], [,b]) => b - a).slice(0, 10),
      documents: processedDocuments,
      createdDate: new Date().toISOString()
    };
  }
  
  async parseMetaFile(metaFilePath) {
    try {
      const content = await secureFs.readFile(metaFilePath, 'utf8');
      const metadata = {};
      
      // Extract DocID
      const docIdMatch = content.match(/^---\s*\nDocID:\s*(.+)\s*\n---/m);
      if (docIdMatch) metadata.docId = docIdMatch[1].trim();
      
      // Extract document type
      const typeMatch = content.match(/\*\*Document Type:\*\*\s*(.+)/i);
      if (typeMatch) metadata.documentType = typeMatch[1].trim();
      
      // Extract word count
      const wordMatch = content.match(/\*\*Word Count:\*\*\s*(\d+)/i);
      if (wordMatch) metadata.wordCount = parseInt(wordMatch[1]);
      
      // Extract AI analysis section for summary and themes
      const analysisMatch = content.match(/## AI Analysis\s*\n\n([\s\S]*?)\n\n##/i);
      if (analysisMatch) {
        const analysis = analysisMatch[1];
        const summaryMatch = analysis.match(/Summary:\s*(.+)/i);
        if (summaryMatch) metadata.summary = summaryMatch[1].trim();
        
        const topicsMatch = analysis.match(/Topics:\s*(.+)/i);
        if (topicsMatch) {
          const topics = topicsMatch[1].split(',').map(t => t.trim());
          metadata.mainTheme = topics[0] || 'Not specified';
        }
        
        const keywordsMatch = analysis.match(/Keywords:\s*(.+)/i);
        if (keywordsMatch) {
          metadata.keywords = keywordsMatch[1].split(',').map(k => k.trim());
        }
      }
      
      return metadata;
    } catch (error) {
      return {};
    }
  }
  
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  generateCollectionMarkdown(metadata) {
    return `# Collection Metadata: ${metadata.collectionName}

## Collection Overview
- **Collection Name:** ${metadata.collectionName}
- **Total Documents:** ${metadata.totalDocuments}
- **Total Size:** ${metadata.totalSizeFormatted}
- **Generated:** ${metadata.createdDate}

## Document Type Distribution
${Object.entries(metadata.documentTypes)
  .map(([type, count]) => `- **${type}:** ${count} documents`)
  .join('\n')}

## Main Themes
${metadata.overallThemes
  .map(([theme, count]) => `- **${theme}** (${count} documents)`)
  .join('\n')}

## Document Inventory

| Document | DocID | Size | Type | Theme | Keywords |
|----------|-------|------|------|-------|----------|
${metadata.documents
  .map(doc => `| ${doc.fileName} | ${doc.docId || 'N/A'} | ${doc.fileSizeFormatted} | ${doc.documentType} | ${doc.mainTheme} | ${Array.isArray(doc.keywords) ? doc.keywords.slice(0, 3).join(', ') : 'N/A'} |`)
  .join('\n')}

## Detailed Document Information

${metadata.documents.map(doc => `### ${doc.fileName}
- **DocID:** ${doc.docId || 'N/A'}
- **Size:** ${doc.fileSizeFormatted}
- **Type:** ${doc.documentType}
- **Theme:** ${doc.mainTheme}
- **Summary:** ${doc.summary}
- **Keywords:** ${Array.isArray(doc.keywords) ? doc.keywords.join(', ') : 'N/A'}
- **Created:** ${doc.createdDate}
- **Modified:** ${doc.modifiedDate}

`).join('')}

---
*Collection metadata generated: ${new Date().toISOString()}*
`;
  }



  async concatenateMetaFiles(collection) {
    const baseDir = CollectionsUtil.getCollectionsPath();
    const collectionPath = validatePath(collection, baseDir);
    const files = await secureFs.readdir(collectionPath);
    
    const metaFiles = files.filter(file => 
      file.startsWith('META_') && 
      file.endsWith('.md') && 
      !file.includes('_Collection.md')
    );
    
    let concatenatedContent = `Collection: ${collection}\n\n`;
    
    for (const metaFile of metaFiles) {
      const filePath = path.join(collectionPath, metaFile);
      const content = await secureFs.readFile(filePath, 'utf8');
      concatenatedContent += content + '\n\n---\n\n';
    }
    
    await this.saveMetaPrompt(collection, concatenatedContent.trim());
  }

  async saveMetaPrompt(collection, metaPrompt) {
    const metaPromptsPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/meta-prompts.json');
    
    let metaPrompts = { metaPrompts: {} };
    
    try {
      const existing = await secureFs.readFile(metaPromptsPath, 'utf8');
      metaPrompts = JSON.parse(existing);
    } catch (error) {
      // File doesn't exist or is invalid, use default structure
    }
    
    // Delete existing meta-prompt for this collection if it exists
    if (metaPrompts.metaPrompts[collection]) {
      delete metaPrompts.metaPrompts[collection];
    }
    
    // Add new meta-prompt
    metaPrompts.metaPrompts[collection] = {
      prompt: metaPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await secureFs.writeFile(metaPromptsPath, JSON.stringify(metaPrompts, null, 2), 'utf8');
  }

  async getMetaPrompt(collection) {
    try {
      const metaPromptsPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/meta-prompts.json');
      const content = await secureFs.readFile(metaPromptsPath, 'utf8');
      const metaPrompts = JSON.parse(content);
      
      return metaPrompts.metaPrompts[collection]?.prompt || null;
    } catch (error) {
      return null;
    }
  }

}