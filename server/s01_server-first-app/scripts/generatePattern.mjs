/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs';
import path from 'path';
import { CollectionsUtil } from '../lib/utils/collectionsUtil.mjs';

const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should',
  'this','that','these','those','it','its','from','as','not','no','so','if','then','than','when','where',
  'who','what','which','how','all','any','each','more','also','into','about','up','out','over','after']);

export async function generatePattern(collection) {
  const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), collection);
  if (!fs.existsSync(collectionPath)) {
    return { skipped: true, reason: 'Collection not found' };
  }

  try {
    // Use only converted .md files from manifest — not raw source files
    const manifest = await CollectionsUtil.readManifest(collection);
    let mdFiles = [];

    if (manifest) {
      mdFiles = manifest.documents
        .filter(doc => doc.convertedFile && doc.convertedFile.endsWith('.md'))
        .map(doc => doc.convertedFile)
        .filter(f => fs.existsSync(path.join(collectionPath, f)));
    }

    // Fallback: scan for .md files if no manifest or no converted files
    if (mdFiles.length === 0) {
      mdFiles = fs.readdirSync(collectionPath)
        .filter(f => f.endsWith('.md') && f !== 'fabric-pattern.md' && !f.startsWith('META_'));
    }

    if (mdFiles.length === 0) {
      return { skipped: true, reason: 'No converted .md files found' };
    }

    // Extract words from all documents — aggregate frequency
    const wordFreq = {};
    let totalWords = 0;

    mdFiles.forEach(filename => {
      const filePath = path.join(collectionPath, filename);
      const content = fs.readFileSync(filePath, 'utf8');

      const words = content.toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4 && !STOP_WORDS.has(w));

      words.forEach(w => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
        totalWords++;
      });
    });

    const topKeywords = Object.entries(wordFreq)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([word]) => word)
      .join(', ');

    const docCount = mdFiles.length;

    // Build sanitized Fabric system prompt
    const patternName = `enhance_${collection}`;
    const systemPrompt = `You are an expert query enhancer for a private document collection called "${collection}".

This collection contains ${docCount} documents.

Key domain vocabulary from this collection: ${topKeywords || 'general terms'}.

Your task: Transform the user's search query into a precise, well-structured prompt that will produce the best possible answer from a local AI model searching this collection.

Guidelines:
- Preserve the user's original intent exactly
- Add relevant domain context using the vocabulary above
- Structure the query to request organized, specific answers
- Ask for document references where appropriate
- Keep the enhanced prompt focused and actionable
- Do not add information not implied by the original query
- Do not include any personal names, patient data, or confidential information`;

    // Save pattern locally in collection folder
    const patternPath = path.join(collectionPath, 'fabric-pattern.md');
    fs.writeFileSync(patternPath, systemPrompt, 'utf8');

    console.log(`[generatePattern] Pattern saved locally: ${patternPath} (${docCount} docs, ${totalWords} words)`);
    return { success: true, patternName, docCount };

  } catch (error) {
    console.error(`[generatePattern] Error for collection ${collection}:`, error.message);
    return { success: false, error: error.message };
  }
}
