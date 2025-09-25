import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../../../../shared/utils/logger.mjs';
import { validatePath, validateFilename } from '../utils/pathValidator.mjs';

class EpubConverter {
  constructor() {
    this.checkDependencies();
  }

  checkDependencies() {
    try {
      execSync('which pandoc', { stdio: 'ignore' });
    } catch {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Pandoc not found. Install with: brew install pandoc');
    }
  }

  async convertEpubToMarkdown(epubPath, outputDir = null) {
    try {
      // Validate input path
      const baseDir = path.join(process.cwd(), '../../sources/local-documents');
      const safeEpubPath = validatePath(epubPath, baseDir);
      
      if (!await secureFs.exists(safeEpubPath)) {
        throw new Error('EPUB file not found');
      }

      // Set output directory to same as EPUB file if not specified
      const targetDir = outputDir ? validatePath(outputDir, baseDir) : path.dirname(safeEpubPath);
      const baseName = path.basename(safeEpubPath, '.epub');
      const safeBaseName = validateFilename(baseName + '.md');
      const outputFile = path.join(targetDir, safeBaseName);

      logger.log('Converting EPUB file to markdown');

      // Use pandoc to convert EPUB to Markdown
      const command = `pandoc "${safeEpubPath}" -t markdown -o "${outputFile}"`;
      
      execSync(command, { stdio: 'inherit' });

      // Verify output file was created
      if (await secureFs.exists(outputFile)) {
        const stats = await secureFs.stat(outputFile);
        logger.log('Conversion successful, size KB:', Math.round(stats.size / 1024));
        return outputFile;
      } else {
        throw new Error('Output file was not created');
      }

    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('EPUB conversion failed:', error.message);
      throw error;
    }
  }

  async convertAllEpubsInDirectory(dirPath) {
    try {
      const baseDir = path.join(process.cwd(), '../../sources/local-documents');
      const safeDirPath = validatePath(dirPath, baseDir);
      const files = await secureFs.readdir(safeDirPath);
      const epubFiles = files.filter(file => file.toLowerCase().endsWith('.epub'));
      
      if (epubFiles.length === 0) {
        logger.log('No EPUB files found in directory');
        return [];
      }

      logger.log('Found EPUB files to convert:', epubFiles.length);
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
      // logger sanitizes all inputs to prevent log injection
      logger.error('Directory processing failed:', error.message);
      throw error;
    }
  }
}

export default EpubConverter;