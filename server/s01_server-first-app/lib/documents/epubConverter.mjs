import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { safeLog, safeError } from '../utils/safeLogger.mjs';
import { validatePath, validateFilename } from '../utils/pathValidator.mjs';

class EpubConverter {
  constructor() {
    this.checkDependencies();
  }

  checkDependencies() {
    try {
      execSync('which pandoc', { stdio: 'ignore' });
    } catch (error) {
      safeError('Pandoc not found. Install with: brew install pandoc');
    }
  }

  async convertEpubToMarkdown(epubPath, outputDir = null) {
    try {
      // Validate input path
      const baseDir = path.join(process.cwd(), '../../sources/local-documents');
      const safeEpubPath = validatePath(epubPath, baseDir);
      
      if (!fs.existsSync(safeEpubPath)) {
        throw new Error('EPUB file not found');
      }

      // Set output directory to same as EPUB file if not specified
      const targetDir = outputDir ? validatePath(outputDir, baseDir) : path.dirname(safeEpubPath);
      const baseName = path.basename(safeEpubPath, '.epub');
      const safeBaseName = validateFilename(baseName + '.md');
      const outputFile = path.join(targetDir, safeBaseName);

      safeLog('Converting EPUB file to markdown');

      // Use pandoc to convert EPUB to Markdown
      const command = `pandoc "${safeEpubPath}" -t markdown -o "${outputFile}"`;
      
      execSync(command, { stdio: 'inherit' });

      // Verify output file was created
      if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        safeLog('Conversion successful, size KB:', Math.round(stats.size / 1024));
        return outputFile;
      } else {
        throw new Error('Output file was not created');
      }

    } catch (error) {
      safeError('EPUB conversion failed:', error.message);
      throw error;
    }
  }

  async convertAllEpubsInDirectory(dirPath) {
    try {
      const baseDir = path.join(process.cwd(), '../../sources/local-documents');
      const safeDirPath = validatePath(dirPath, baseDir);
      const files = fs.readdirSync(safeDirPath);
      const epubFiles = files.filter(file => file.toLowerCase().endsWith('.epub'));
      
      if (epubFiles.length === 0) {
        safeLog('No EPUB files found in directory');
        return [];
      }

      safeLog('Found EPUB files to convert:', epubFiles.length);
      const results = [];

      for (const epubFile of epubFiles) {
        const safeFilename = validateFilename(epubFile);
        const epubPath = path.join(safeDirPath, safeFilename);
        try {
          const outputFile = await this.convertEpubToMarkdown(path.relative(baseDir, epubPath));
          results.push({ success: true, input: epubPath, output: outputFile });
        } catch (error) {
          results.push({ success: false, input: epubPath, error: error.message });
        }
      }

      return results;
    } catch (error) {
      safeError('Directory processing failed:', error.message);
      throw error;
    }
  }
}

export default EpubConverter;