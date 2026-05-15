class CollectionMetadataGenerator {
  constructor() {
    this.collectionTemplate = {
      collectionName: '',
      createdDate: new Date().toISOString(),
      totalDocuments: 0,
      totalSize: 0,
      documentTypes: {},
      overallThemes: [],
      documents: [],
      statistics: {},
      relationships: []
    };
  }

  async generateCollectionMetadata(collectionPath, collectionName) {
    try {
      console.log(`Generating collection metadata for: ${collectionName}`);
      
      // Read all files in the collection directory
      const allFiles = await this.getAllFiles(collectionPath);
      const documents = [];
      const metaFiles = [];
      
      // Separate document files from META files
      allFiles.forEach(file => {
        if (file.fileName.startsWith('META_') && file.fileName.endsWith('.md')) {
          metaFiles.push(file);
        } else if (!file.fileName.startsWith('META-')) {
          documents.push(file);
        }
      });

      // Process each document and its corresponding META file
      const processedDocuments = await this.processDocumentsWithMeta(documents, metaFiles, collectionPath);
      
      // Generate collection-level analysis
      const collectionMetadata = await this.buildCollectionMetadata(
        processedDocuments, 
        collectionName, 
        collectionPath
      );

      // Write the collection metadata file
      const outputFileName = `META-${collectionName.replace(/\s+/g, '-')}_Collection.md`;
      const outputPath = path.join(collectionPath, outputFileName);
      
      await this.writeCollectionMetadataFile(collectionMetadata, outputPath);
      
      console.log(`Collection metadata generated: ${outputFileName}`);
      return collectionMetadata;

    } catch (error) {
      throw new Error(`Error generating collection metadata: ${error.message}`);
    }
  }

  async getAllFiles(directoryPath) {
    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    const allFiles = [];

    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(directoryPath, file.name);
        const stats = await fs.stat(filePath);
        
        allFiles.push({
          fileName: file.name,
          filePath: filePath,
          size: stats.size,
          createdDate: stats.birthtime,
          modifiedDate: stats.mtime,
          extension: path.extname(file.name).toLowerCase()
        });
      }
    }

    return allFiles;
  }

  async processDocumentsWithMeta(documents, metaFiles, collectionPath) {
    const processedDocuments = [];

    for (const doc of documents) {
      try {
        // Find corresponding META file
        const baseFileName = path.parse(doc.fileName).name;
        const metaFileName = `META_${baseFileName}.md`;
        const metaFile = metaFiles.find(meta => meta.fileName === metaFileName);

        let metadata = {};
        if (metaFile) {
          // Read and parse existing META file
          metadata = await this.parseMetaFile(metaFile.filePath);
        } else {
          console.log(`No META file found for: ${doc.fileName}`);
          // Generate basic metadata if META file doesn't exist
          metadata = await this.generateBasicMetadata(doc.filePath);
        }

        processedDocuments.push({
          fileName: doc.fileName,
          filePath: doc.filePath,
          fileSize: doc.size,
          fileSizeFormatted: this.formatFileSize(doc.size),
          createdDate: doc.createdDate,
          modifiedDate: doc.modifiedDate,
          extension: doc.extension,
          documentType: metadata.documentType || 'unknown',
          mainTheme: metadata.mainTheme || 'Not specified',
          keywords: metadata.keywords || [],
          summary: metadata.summary || 'No summary available',
          author: metadata.author || 'Unknown',
          status: metadata.status || 'Unknown',
          language: metadata.language || 'Unknown',
          pageCount: metadata.pageCount || 'Unknown',
          wordCount: metadata.wordCount || 'Unknown',
          importance: metadata.importance || 'Medium',
          relatedDocuments: metadata.relatedDocuments || [],
          lastProcessed: metadata.lastProcessed || 'Never'
        });

      } catch (error) {
        console.error(`Error processing document ${doc.fileName}:`, error.message);
        // Still include the document with basic info
        processedDocuments.push({
          fileName: doc.fileName,
          filePath: doc.filePath,
          fileSize: doc.size,
          fileSizeFormatted: this.formatFileSize(doc.size),
          documentType: 'error',
          mainTheme: 'Error processing document',
          error: error.message
        });
      }
    }

    return processedDocuments;
  }

  async parseMetaFile(metaFilePath) {
    try {
      const content = await fs.readFile(metaFilePath, 'utf-8');
      const metadata = {};

      // Parse YAML front matter or structured content
      const lines = content.split('\n');
      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith(':**')) {
          currentSection = trimmedLine.replace(/\*\*/g, '').replace(':', '').toLowerCase();
        } else if (trimmedLine && currentSection) {
          switch (currentSection) {
            case 'document type':
              metadata.documentType = trimmedLine;
              break;
            case 'main theme':
              metadata.mainTheme = trimmedLine;
              break;
            case 'keywords':
              metadata.keywords = trimmedLine.split(',').map(k => k.trim());
              break;
            case 'summary':
              metadata.summary = trimmedLine;
              break;
            case 'author':
              metadata.author = trimmedLine;
              break;
            case 'status':
              metadata.status = trimmedLine;
              break;
            case 'language':
              metadata.language = trimmedLine;
              break;
            case 'page count':
              metadata.pageCount = parseInt(trimmedLine) || trimmedLine;
              break;
            case 'word count':
              metadata.wordCount = parseInt(trimmedLine) || trimmedLine;
              break;
            case 'importance':
              metadata.importance = trimmedLine;
              break;
          }
        }
      }

      return metadata;
    } catch (error) {
      console.error(`Error parsing META file ${metaFilePath}:`, error.message);
      return {};
    }
  }

  async buildCollectionMetadata(processedDocuments, collectionName, collectionPath) {
    const metadata = { ...this.collectionTemplate };
    
    metadata.collectionName = collectionName;
    metadata.collectionPath = collectionPath;
    metadata.totalDocuments = processedDocuments.length;
    metadata.totalSize = processedDocuments.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    metadata.totalSizeFormatted = this.formatFileSize(metadata.totalSize);
    
    // Document type statistics
    processedDocuments.forEach(doc => {
      const type = doc.documentType || 'unknown';
      metadata.documentTypes[type] = (metadata.documentTypes[type] || 0) + 1;
    });

    // Extract overall themes
    const allThemes = processedDocuments
      .map(doc => doc.mainTheme)
      .filter(theme => theme && theme !== 'Not specified')
      .reduce((acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
      }, {});
    
    metadata.overallThemes = Object.entries(allThemes)
      .sort(([,a], [,b]) => b - a)
      .map(([theme, count]) => ({ theme, count }));

    // Additional statistics
    metadata.statistics = {
      averageFileSize: Math.round(metadata.totalSize / metadata.totalDocuments),
      averageFileSizeFormatted: this.formatFileSize(Math.round(metadata.totalSize / metadata.totalDocuments)),
      largestDocument: this.findLargestDocument(processedDocuments),
      smallestDocument: this.findSmallestDocument(processedDocuments),
      mostCommonType: Object.entries(metadata.documentTypes)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown',
      languageDistribution: this.getLanguageDistribution(processedDocuments),
      statusDistribution: this.getStatusDistribution(processedDocuments),
      importanceDistribution: this.getImportanceDistribution(processedDocuments)
    };

    // Document relationships
    metadata.relationships = this.analyzeDocumentRelationships(processedDocuments);
    
    metadata.documents = processedDocuments;
    
    return metadata;
  }

  async writeCollectionMetadataFile(metadata, outputPath) {
    const content = this.generateMarkdownContent(metadata);
    await fs.writeFile(outputPath, content, 'utf-8');
  }

  generateMarkdownContent(metadata) {
    return `# Collection Metadata: ${metadata.collectionName}

## Collection Overview
- **Collection Name:** ${metadata.collectionName}
- **Total Documents:** ${metadata.totalDocuments}
- **Total Size:** ${metadata.totalSizeFormatted} (${metadata.totalSize} bytes)
- **Created:** ${metadata.createdDate}
- **Collection Path:** ${metadata.collectionPath}

## Document Type Distribution
${Object.entries(metadata.documentTypes)
  .map(([type, count]) => `- **${type}:** ${count} documents`)
  .join('\n')}

## Overall Collection Themes
${metadata.overallThemes
  .map(({ theme, count }) => `- **${theme}** (${count} documents)`)
  .join('\n')}

## Collection Statistics
- **Average File Size:** ${metadata.statistics.averageFileSizeFormatted}
- **Largest Document:** ${metadata.statistics.largestDocument?.fileName} (${metadata.statistics.largestDocument?.fileSizeFormatted})
- **Smallest Document:** ${metadata.statistics.smallestDocument?.fileName} (${metadata.statistics.smallestDocument?.fileSizeFormatted})
- **Most Common Document Type:** ${metadata.statistics.mostCommonType}

### Language Distribution
${Object.entries(metadata.statistics.languageDistribution)
  .map(([lang, count]) => `- **${lang}:** ${count} documents`)
  .join('\n')}

### Status Distribution
${Object.entries(metadata.statistics.statusDistribution)
  .map(([status, count]) => `- **${status}:** ${count} documents`)
  .join('\n')}

### Importance Distribution
${Object.entries(metadata.statistics.importanceDistribution)
  .map(([importance, count]) => `- **${importance}:** ${count} documents`)
  .join('\n')}

## Document Relationships
${metadata.relationships.length > 0 
  ? metadata.relationships.map(rel => `- **${rel.document1}** ↔ **${rel.document2}** (${rel.relationship})`).join('\n')
  : '- No explicit relationships detected'}

## Complete Document Inventory

| Document Name | Size | Type | Main Theme | Status | Author | Keywords |
|---------------|------|------|------------|--------|--------|----------|
${metadata.documents
  .map(doc => `| ${doc.fileName} | ${doc.fileSizeFormatted} | ${doc.documentType} | ${doc.mainTheme} | ${doc.status} | ${doc.author} | ${Array.isArray(doc.keywords) ? doc.keywords.join(', ') : doc.keywords || 'N/A'} |`)
  .join('\n')}

## Detailed Document Information

${metadata.documents.map(doc => `### ${doc.fileName}
- **File Size:** ${doc.fileSizeFormatted} (${doc.fileSize} bytes)
- **Document Type:** ${doc.documentType}
- **Main Theme:** ${doc.mainTheme}
- **Summary:** ${doc.summary}
- **Author:** ${doc.author}
- **Status:** ${doc.status}
- **Language:** ${doc.language}
- **Page Count:** ${doc.pageCount}
- **Word Count:** ${doc.wordCount}
- **Importance:** ${doc.importance}
- **Keywords:** ${Array.isArray(doc.keywords) ? doc.keywords.join(', ') : doc.keywords || 'N/A'}
- **Created:** ${doc.createdDate}
- **Modified:** ${doc.modifiedDate}
- **Last Processed:** ${doc.lastProcessed}
${doc.relatedDocuments && doc.relatedDocuments.length > 0 
  ? `- **Related Documents:** ${doc.relatedDocuments.join(', ')}`
  : ''}
${doc.error ? `- **Processing Error:** ${doc.error}` : ''}

`).join('\n')}

---
*Collection metadata generated on ${new Date().toISOString()}*
`;
  }

  // Helper methods
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  findLargestDocument(documents) {
    return documents.reduce((largest, current) => 
      (current.fileSize > largest.fileSize) ? current : largest
    );
  }

  findSmallestDocument(documents) {
    return documents.reduce((smallest, current) => 
      (current.fileSize < smallest.fileSize) ? current : smallest
    );
  }

  getLanguageDistribution(documents) {
    return documents.reduce((acc, doc) => {
      const lang = doc.language || 'Unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
  }

  getStatusDistribution(documents) {
    return documents.reduce((acc, doc) => {
      const status = doc.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  getImportanceDistribution(documents) {
    return documents.reduce((acc, doc) => {
      const importance = doc.importance || 'Medium';
      acc[importance] = (acc[importance] || 0) + 1;
      return acc;
    }, {});
  }

  analyzeDocumentRelationships(documents) {
    const relationships = [];
    
    documents.forEach(doc => {
      if (doc.relatedDocuments && doc.relatedDocuments.length > 0) {
        doc.relatedDocuments.forEach(relatedDoc => {
          relationships.push({
            document1: doc.fileName,
            document2: relatedDoc,
            relationship: 'explicitly related'
          });
        });
      }
    });

    return relationships;
  }

  async generateBasicMetadata(filePath) {
    // Fallback metadata generation for documents without META files
    const stats = await fs.stat(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    return {
      documentType: this.guessDocumentType(extension),
      mainTheme: 'Not analyzed',
      summary: 'No summary available - META file missing',
      status: 'Unprocessed',
      language: 'Unknown',
      importance: 'Medium',
      lastProcessed: 'Never'
    };
  }

  guessDocumentType(extension) {
    const typeMap = {
      '.pdf': 'PDF Document',
      '.doc': 'Word Document',
      '.docx': 'Word Document',
      '.txt': 'Text Document',
      '.md': 'Markdown Document',
      '.html': 'HTML Document',
      '.rtf': 'Rich Text Document'
    };
    
    return typeMap[extension] || 'Unknown Document Type';
  }
}

// Usage Example
const generator = new CollectionMetadataGenerator();

// Generate collection metadata
generator.generateCollectionMetadata('./usa-history-docs', 'USA History')
  .then(metadata => {
    console.log(`Collection metadata generated for ${metadata.totalDocuments} documents`);
    console.log(`Total collection size: ${metadata.totalSizeFormatted}`);
    console.log(`Document types found: ${Object.keys(metadata.documentTypes).join(', ')}`);
  })
  .catch(error => console.error('Error:', error));

// Generate metadata for multiple collections
async function processMultipleCollections(collections) {
  for (const { path: collectionPath, name } of collections) {
    try {
      await generator.generateCollectionMetadata(collectionPath, name);
      console.log(`✓ Completed: ${name}`);
    } catch (error) {
      console.error(`✗ Failed: ${name} - ${error.message}`);
    }
  }
}

// Example usage with multiple collections
const collections = [
  { path: './legal-documents', name: 'Legal Documents' },
  { path: './insurance-policies', name: 'Insurance Policies' },
  { path: './academic-papers', name: 'Academic Research' },
  { path: './technical-manuals', name: 'Technical Documentation' }
];

processMultipleCollections(collections);
