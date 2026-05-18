/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { CollectionsUtil } from '../lib/utils/collectionsUtil.mjs';

const FABRIC_URL = process.env.FABRIC_URL;
const FABRIC_API_KEY = process.env.FABRIC_API_KEY;

// Aggregate index cards for a collection and build a sanitized domain pattern
export async function generatePattern(collection) {
  if (!FABRIC_URL || !FABRIC_API_KEY) {
    console.log('[generatePattern] Fabric not configured — skipping pattern generation');
    return { skipped: true, reason: 'Fabric not configured' };
  }

  const dbPath = path.join(CollectionsUtil.getCollectionsPath(), collection, 'index-cards.db');
  if (!fs.existsSync(dbPath)) {
    console.log(`[generatePattern] No index cards found for collection: ${collection}`);
    return { skipped: true, reason: 'No index cards' };
  }

  try {
    // Read all index cards
    const dbBuffer = fs.readFileSync(dbPath);
    const SQL = await initSqlJs();
    const db = new SQL.Database(dbBuffer);

    const results = db.exec('SELECT document_type, topics, keywords FROM document_index');
    db.close();

    if (!results || results.length === 0 || !results[0].values.length) {
      return { skipped: true, reason: 'Empty index' };
    }

    // Aggregate across all cards — no PII, no filenames, no summaries
    const typeCounts = {};
    const topicSet = new Set();
    const keywordSet = new Set();

    results[0].values.forEach(row => {
      const [docType, topics, keywords] = row;

      // Count document types
      if (docType) {
        const t = docType.toLowerCase().trim();
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      }

      // Collect unique topics (split by comma)
      if (topics) {
        topics.split(',').forEach(t => {
          const clean = t.trim().toLowerCase();
          if (clean.length > 2) topicSet.add(clean);
        });
      }

      // Collect unique keywords (split by comma)
      if (keywords) {
        keywords.split(',').forEach(k => {
          const clean = k.trim().toLowerCase();
          if (clean.length > 2) keywordSet.add(clean);
        });
      }
    });

    // Dominant document type
    const dominantType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type)
      .slice(0, 3)
      .join(', ');

    const topTopics = [...topicSet].slice(0, 15).join(', ');
    const topKeywords = [...keywordSet].slice(0, 20).join(', ');
    const docCount = results[0].values.length;

    // Build sanitized Fabric system prompt
    const patternName = `enhance_${collection}`;
    const systemPrompt = `You are an expert query enhancer for a private document collection called "${collection}".

This collection contains ${docCount} documents of type: ${dominantType || 'general'}.

Key topics covered: ${topTopics || 'general content'}.

Domain vocabulary: ${topKeywords || 'general terms'}.

Your task: Transform the user's search query into a precise, well-structured prompt that will produce the best possible answer from a local AI model searching this collection.

Guidelines:
- Preserve the user's original intent exactly
- Add relevant domain context from the collection's topics
- Structure the query to request organized, specific answers
- Ask for document references where appropriate
- Keep the enhanced prompt focused and actionable
- Do not add information not implied by the original query`;

    // Upload pattern to Fabric
    const response = await fetch(`${FABRIC_URL}/patterns/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FABRIC_API_KEY}`
      },
      body: JSON.stringify({
        name: patternName,
        pattern: { system: systemPrompt }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[generatePattern] Fabric upload failed for ${collection}: ${response.status} ${text}`);
      return { success: false, error: `Fabric upload failed: ${response.status}` };
    }

    console.log(`[generatePattern] Pattern uploaded: ${patternName} (${docCount} docs, types: ${dominantType})`);
    return { success: true, patternName, docCount };

  } catch (error) {
    console.error(`[generatePattern] Error for collection ${collection}:`, error.message);
    return { success: false, error: error.message };
  }
}
