import express from 'express';
import CombinedSearchScorer from '../lib/models/combinedSearchScorer.mjs';

const router = express.Router();

// Create an instance of the scorer
const scorer = new CombinedSearchScorer();

// Define the POST route
router.post('/', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { query, score } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('Processing query:', query);
    console.log('Scoring enabled:', score);
    
    const result = await scorer.process(query, score);
    
    console.log('Sending response:', result);
    res.json(result);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;
