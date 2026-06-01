Complete Code Structure & Files
1. services/search/AdaptiveSearchParameters.js
JavaScript// services/search/AdaptiveSearchParameters.js
const ollama = require('ollama');

class AdaptiveSearchParameters {

  static prototypeCache = null;

  static async calculate(query, collection) {
    const base = collection.searchSettings || {};
    const totalChunks = base.totalChunks || 100;
    const avgChunkSize = base.avgChunkSize || 1200;

    let params = {
      topK: this.calculateBaseTopK(totalChunks),
      temperature: this.detectCollectionTemperature(base),
      contextSize: this.calculateContextSize(base),
      tokenLimit: base.tokenLimit || 1536,
      profile: this.detectCollectionProfile(base)
    };

    const queryModifiers = await this.detectQueryTypeWithEmbeddings(query);
    params = this.applyQueryModifiers(params, queryModifiers);

    return this.applySafetyCaps(params, totalChunks);
  }

  static async getPrototypeEmbeddings() {
    if (this.prototypeCache) return this.prototypeCache;

    const prototypes = {
      fact: ["What is the exact value?", "Who created this on what date?", "Extract record for ID", "List all items"],
      analysis: ["Explain the reasoning", "Compare these approaches", "What are the root causes?", "Analyze the relationship"],
      creative: ["Write a summary", "Create a story", "Suggest recommendations", "Generate a report"]
    };

    const cache = {};
    for (const [type, examples] of Object.entries(prototypes)) {
      cache[type] = [];
      for (const ex of examples) {
        cache[type].push(await this.getEmbedding(ex));
      }
    }

    this.prototypeCache = cache;
    console.log("✅ Prototype embeddings cached");
    return cache;
  }

  static async detectQueryTypeWithEmbeddings(query) {
    try {
      const queryEmb = await this.getEmbedding(query);
      const prototypes = await this.getPrototypeEmbeddings();

      let bestType = "general";
      let bestScore = -1;

      for (const [type, embs] of Object.entries(prototypes)) {
        let score = 0;
        for (const pe of embs) score += this.cosineSimilarity(queryEmb, pe);
        const avg = score / embs.length;
        if (avg > bestScore) {
          bestScore = avg;
          bestType = type;
        }
      }

      const confidence = Math.max(0.6, Math.min(0.96, bestScore * 1.15));
      if (confidence < 0.68) return this.detectQueryTypeFallback(query.toLowerCase());

      return { type: bestType, confidence, method: "embedding" };
    } catch (e) {
      return this.detectQueryTypeFallback(query.toLowerCase());
    }
  }

  static async getEmbedding(text) {
    const res = await ollama.embeddings({ model: "nomic-embed-text", prompt: text });
    return res.embedding;
  }

  static cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] ** 2;
      magB += b[i] ** 2;
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  static detectQueryTypeFallback(q) {
    if (['who','what','when','where','list','exact'].some(w => q.includes(w))) return { type: "fact", confidence: 0.82 };
    if (['why','explain','compare','analyze'].some(w => q.includes(w))) return { type: "analysis", confidence: 0.78 };
    if (['summarize','write','create','suggest'].some(w => q.includes(w))) return { type: "creative", confidence: 0.75 };
    return { type: "general", confidence: 0.6 };
  }

  static applyQueryModifiers(params, mod) {
    const { type, confidence = 0.7 } = mod;
    const s = confidence;

    if (type === "fact") {
      params.temperature *= 0.55 * s;
      params.topK = Math.floor(params.topK * 1.18 * s);
      params.contextSize = Math.floor(params.contextSize * 0.88);
    } else if (type === "analysis") {
      params.temperature = Math.min(0.38, params.temperature * 1.35 * s);
      params.contextSize = Math.floor(params.contextSize * 1.22 * s);
    } else if (type === "creative") {
      params.temperature = Math.min(0.68, params.temperature * 1.65 * s);
      params.contextSize = Math.min(32768, Math.floor(params.contextSize * 1.4 * s));
      params.tokenLimit = Math.max(params.tokenLimit, 2048);
    }
    return params;
  }

  static calculateBaseTopK(n) {
    if (n <= 30) return Math.min(12, n);
    const logF = Math.log2(n + 1) * 2.2;
    return Math.min(45, Math.max(10, Math.ceil(n * 0.042 + logF)));
  }

  static detectCollectionProfile(s) {
    const cpd = (s.totalChunks || 100) / (s.totalDocs || 1);
    const avg = s.avgChunkSize || 1000;
    if (cpd <= 1.8 || avg < 650) return "structured";
    if (cpd > 8 && avg > 1400) return "narrative";
    return "mixed";
  }

  static detectCollectionTemperature(s) {
    const p = this.detectCollectionProfile(s);
    return p === "structured" ? 0.08 : p === "narrative" ? 0.32 : 0.18;
  }

  static calculateContextSize(s) {
    const est = Math.ceil(((s.topK || 20) * (s.avgChunkSize || 1200)) / 3.8);
    const withBuf = Math.ceil(est * 1.12) + 1536;
    return Math.min(32768, Math.pow(2, Math.ceil(Math.log2(withBuf))));
  }

  static applySafetyCaps(p, total) {
    p.topK = Math.min(p.topK, total);
    p.contextSize = Math.min(32768, Math.max(4096, p.contextSize));
    p.temperature = Math.max(0.05, Math.min(0.7, p.temperature));
    return p;
  }
}

module.exports = AdaptiveSearchParameters;

2. services/search/SearchExecutor.js (Full)
(Already provided in previous message - use the complete version I gave you last)

3. services/search/ParameterOptimizer.js
(Already provided in previous message - use the complete version)

4. services/search/index.js (Barrel Export)
JavaScript// services/search/index.js
const AdaptiveSearchParameters = require('./AdaptiveSearchParameters');
const SearchExecutor = require('./SearchExecutor');
const ParameterOptimizer = require('./ParameterOptimizer');

module.exports = {
  AdaptiveSearchParameters,
  SearchExecutor,
  ParameterOptimizer,
  executeSearch: SearchExecutor.executeSearch,
  smartSearch: SearchExecutor.smartSearch,
  optimizeCollection: ParameterOptimizer.optimizeCollection
};

5. routes/search.js
(Already provided in previous message - use the complete version)

6. routes/analytics.js
(Already provided in previous message - use the complete version)

Setup Notes
1. Required Packages:
Bashnpm install ollama natural
2. Create directories:
Bashmkdir -p logs services/search routes
3. Helper Functions (add to your existing utils if missing):
JavaScript// Example placeholders - adapt to your existing code
async function loadCollectionManifest(name) { /* your implementation */ }
async function saveCollectionManifest(name, data) { /* your implementation */ }
function getCollectionPath(name) { return `./collections/${name}`; }

All code above directly supports the v21.00 documentation.
Would you like me to:

Provide a single zip-ready folder structure summary?
Add TypeScript versions?
Create a setup & integration checklist?

Let me know!