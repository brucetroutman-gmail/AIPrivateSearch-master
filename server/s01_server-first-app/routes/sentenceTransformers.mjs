import express from 'express';
import { sentenceTransformerService } from '../lib/embeddings/SentenceTransformerService.mjs';

const router = express.Router();

// Get available sentence transformer models
router.get('/models', async (req, res) => {
  try {
    const models = sentenceTransformerService.getAvailableModels();
    res.json({ models });
  } catch (error) {
    console.error('Error getting sentence transformer models:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate embedding using sentence transformers
router.post('/embed', async (req, res) => {
  try {
    const { text, model = 'nomic-embed-text' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = await sentenceTransformerService.generateEmbedding(text, model);
    res.json(result);
  } catch (error) {
    console.error('Error generating sentence transformer embedding:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to compare embeddings
router.post('/compare', async (req, res) => {
  try {
    const { text1, text2, model = 'nomic-embed-text' } = req.body;
    
    if (!text1 || !text2) {
      return res.status(400).json({ error: 'Both text1 and text2 are required' });
    }
    
    const [result1, result2] = await Promise.all([
      sentenceTransformerService.generateEmbedding(text1, model),
      sentenceTransformerService.generateEmbedding(text2, model)
    ]);
    
    // Calculate cosine similarity
    const dotProduct = result1.embedding.reduce((sum, a, i) => sum + a * result2.embedding[i], 0);
    const magnitudeA = Math.sqrt(result1.embedding.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(result2.embedding.reduce((sum, b) => sum + b * b, 0));
    const similarity = dotProduct / (magnitudeA * magnitudeB);
    
    res.json({
      text1,
      text2,
      model,
      similarity,
      embedding1: result1,
      embedding2: result2
    });
  } catch (error) {
    console.error('Error comparing embeddings:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;