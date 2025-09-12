import fs from 'fs-extra';
import path from 'path';
import { validatePath, validateFilename } from '../utils/pathValidator.mjs';

/* global process */

export class DocumentProcessor {
  constructor() {
    this.supportedFormats = ['.txt', '.pdf'];
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
}