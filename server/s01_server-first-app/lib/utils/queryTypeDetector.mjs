/**
 * QueryTypeDetector - classifies queries as fact / analysis / creative / general
 * Uses natural TF-IDF scoring with keyword boost fallback.
 */

import natural from 'natural';

const { TfIdf, WordTokenizer } = natural;
const tokenizer = new WordTokenizer();

// Prototype queries per type
const PROTOTYPES = {
  fact: [
    'what is the exact value',
    'who is the patient',
    'list all patients with',
    'find all records for',
    'show me the record',
    'what medications does',
    'which patients have',
    'what is the diagnosis',
    'what date was',
    'who has',
    'give me all',
    'extract all entries'
  ],
  analysis: [
    'why did',
    'explain the reasoning',
    'compare these approaches',
    'what are the root causes',
    'analyze the relationship',
    'what patterns exist',
    'how does this relate',
    'what are the implications',
    'summarize the treatment approaches',
    'what conclusions can be drawn',
    'how effective is',
    'evaluate the'
  ],
  creative: [
    'write a summary',
    'create a report',
    'suggest recommendations',
    'generate a list',
    'draft a response',
    'compose a letter',
    'describe in detail',
    'tell me about',
    'give me an overview',
    'what would you recommend'
  ]
};

// Build TF-IDF index
const tfidf = new TfIdf();
const typeLabels = [];

for (const [type, queries] of Object.entries(PROTOTYPES)) {
  for (const q of queries) {
    tfidf.addDocument(q);
    typeLabels.push(type);
  }
}

// Keyword boost patterns
const KEYWORD_PATTERNS = {
  fact: ['who', 'what', 'when', 'where', 'which', 'list', 'find', 'show', 'give', 'extract', 'all', 'every', 'each', 'does', 'have', 'has', 'how many'],
  analysis: ['why', 'explain', 'compare', 'analyze', 'analyse', 'evaluate', 'assess', 'relationship', 'pattern', 'reason', 'cause', 'effect', 'impact', 'difference', 'similar', 'affect', 'how does', 'what causes'],
  creative: ['write', 'create', 'draft', 'compose', 'suggest', 'recommend', 'describe', 'overview', 'summarize', 'summary', 'generate', 'tell me about']
};

export function detectQueryType(query) {
  const q = query.toLowerCase().trim();
  const tokens = tokenizer.tokenize(q);

  // TF-IDF scoring
  const scores = { fact: 0, analysis: 0, creative: 0 };
  const docCount = tfidf.documents.length;

  for (let i = 0; i < docCount; i++) {
    let docScore = 0;
    for (const token of tokens) {
      docScore += tfidf.tfidf(token, i);
    }
    if (docScore > 0) scores[typeLabels[i]] += docScore;
  }

  // Normalize by prototype count
  for (const type of Object.keys(scores)) {
    scores[type] /= PROTOTYPES[type].length;
  }

  // Keyword boost
  for (const [type, keywords] of Object.entries(KEYWORD_PATTERNS)) {
    for (const kw of keywords) {
      if (q.includes(kw)) scores[type] += 0.5;
    }
  }

  // Pick best
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const [type, score] = best;
  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);
  const confidence = totalScore > 0 ? Math.min(0.95, score / totalScore) : 0.6;
  const finalType = confidence < 0.4 ? 'general' : type;

  console.log(`[QueryTypeDetector] "${query.substring(0, 50)}" → ${finalType} (${confidence.toFixed(2)})`);
  return { type: finalType, confidence, scores };
}

export function applyQueryModifiers(params, queryType) {
  const { type, confidence } = queryType;
  const s = Math.max(0.6, confidence);
  const result = { ...params };

  if (type === 'fact') {
    result.temperature = Math.max(0.05, (params.temperature || 0.1) * 0.6 * s);
    result.topK = Math.min(45, Math.ceil((params.topK || 10) * 1.2 * s));
  } else if (type === 'analysis') {
    result.temperature = Math.min(0.4, (params.temperature || 0.1) * 1.5 * s);
    result.contextSize = Math.min(32768, Math.floor((params.contextSize || 8192) * 1.25 * s));
    result.tokenLimit = Math.max(params.tokenLimit || 1024, 2048);
  } else if (type === 'creative') {
    result.temperature = Math.min(0.6, (params.temperature || 0.1) * 2.0 * s);
    result.contextSize = Math.min(32768, Math.floor((params.contextSize || 8192) * 1.4 * s));
    result.tokenLimit = Math.max(params.tokenLimit || 1024, 2048);
  }

  console.log(`[QueryTypeDetector] topK:${params.topK}→${result.topK} temp:${(params.temperature||0).toFixed(2)}→${(result.temperature||0).toFixed(2)} ctx:${params.contextSize}→${result.contextSize}`);
  return result;
}
