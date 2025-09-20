import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger.js';

class DocumentProcessor {
  constructor() {
    this.supportedExtensions = ['.txt', '.md', '.json', '.csv'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Process a single document file
   * @param {string} filePath - Path to the document file
   * @returns {Promise<Object>} Processed document object
   */
  async processDocument(filePath) {
    try {
      logger.info(`Processing document: ${filePath}`);
      
      // Check if file exists
      const stats = await fs.stat(filePath);
      
      // Check file size
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
      }

      // Get file extension
      const ext = path.extname(filePath).toLowerCase();
      
      // Check if extension is supported
      if (!this.supportedExtensions.includes(ext)) {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract metadata
      const metadata = this.extractMetadata(filePath, stats);
      
      // Process content based on file type
      const processedContent = this.processContentByType(content, ext);
      
      const document = {
        filename: path.basename(filePath),
        filepath: filePath,
        content: processedContent,
        metadata,
        processedAt: new Date().toISOString()
      };

      logger.info(`Successfully processed document: ${path.basename(filePath)}`);
      return document;

    } catch (error) {
      logger.error(`Error processing document ${filePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process multiple documents from a directory
   * @param {string} directoryPath - Path to directory containing documents
   * @returns {Promise<Array>} Array of processed documents
   */
  async processDirectory(directoryPath) {
    try {
      logger.info(`Processing directory: ${directoryPath}`);
      
      const files = await fs.readdir(directoryPath);
      const processedDocuments = [];

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath);

        // Skip directories and unsupported files
        if (stats.isFile() && this.isSupportedFile(file)) {
          try {
            const document = await this.processDocument(filePath);
            processedDocuments.push(document);
          } catch (error) {
            logger.warn(`Skipping file ${file}: ${error.message}`);
          }
        }
      }

      logger.info(`Processed ${processedDocuments.length} documents from directory`);
      return processedDocuments;

    } catch (error) {
      logger.error(`Error processing directory ${directoryPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract metadata from file
   * @param {string} filePath - File path
   * @param {Object} stats - File stats object
   * @returns {Object} Metadata object
   */
  extractMetadata(filePath, stats) {
    return {
      filename: path.basename(filePath),
      extension: path.extname(filePath),
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      directory: path.dirname(filePath)
    };
  }

  /**
   * Process content based on file type
   * @param {string} content - Raw file content
   * @param {string} extension - File extension
   * @returns {string} Processed content
   */
  processContentByType(content, extension) {
    switch (extension) {
      case '.json':
        try {
          // Validate JSON and extract searchable text
          const parsed = JSON.parse(content);
          return this.extractTextFromJson(parsed);
        } catch (error) {
          logger.warn(`Invalid JSON content, treating as plain text`);
          return content;
        }

      case '.csv':
        return this.processCsvContent(content);

      case '.md':
        return this.processMarkdownContent(content);

      case '.txt':
      default:
        return content.trim();
    }
  }

  /**
   * Extract searchable text from JSON object
   * @param {Object} obj - JSON object
   * @returns {string} Extracted text
   */
  extractTextFromJson(obj) {
    const extractText = (value) => {
      if (typeof value === 'string') {
        return value;
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.map(extractText).join(' ');
        } else {
          return Object.values(value).map(extractText).join(' ');
        }
      }
      return String(value);
    };

    return extractText(obj);
  }

  /**
   * Process CSV content for better searchability
   * @param {string} content - CSV content
   * @returns {string} Processed content
   */
  processCsvContent(content) {
    // Convert CSV to searchable text by replacing commas with spaces
    return content
      .split('\n')
      .map(line => line.replace(/,/g, ' '))
      .join('\n')
      .trim();
  }

  /**
   * Process Markdown content
   * @param {string} content - Markdown content
   * @returns {string} Processed content
   */
  processMarkdownContent(content) {
    // Remove markdown syntax for better text search
    return content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link text
      .trim();
  }

  /**
   * Check if file is supported
   * @param {string} filename - File name
   * @returns {boolean} True if supported
   */
  isSupportedFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  /**
   * Get supported file extensions
   * @returns {Array} Array of supported extensions
   */
  getSupportedExtensions() {
    return [...this.supportedExtensions];
  }

  /**
   * Add support for new file extension
   * @param {string} extension - File extension (e.g., '.pdf')
   */
  addSupportedExtension(extension) {
    if (!this.supportedExtensions.includes(extension.toLowerCase())) {
      this.supportedExtensions.push(extension.toLowerCase());
      logger.info(`Added support for ${extension} files`);
    }
  }

  /**
   * Set maximum file size
   * @param {number} sizeInBytes - Maximum file size in bytes
   */
  setMaxFileSize(sizeInBytes) {
    this.maxFileSize = sizeInBytes;
    logger.info(`Set maximum file size to ${sizeInBytes} bytes`);
  }
}

// Export singleton instance
export default new DocumentProcessor();
