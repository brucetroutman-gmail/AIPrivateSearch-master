import express from 'express';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API info route
router.get('/api', (req, res) => {
  res.json({
    name: 'Document Search API',
    version: '1.0.0',
    description: 'Multi-method document search application'
  });
});

// Search routes
router.post('/search', (req, res) => {
  const { query, method = 'fuzzy' } = req.body;
  
  console.log('Search request:', { query, method });
  
  // Mock search results for now
  const mockResults = [
    {
      id: 1,
      title: 'France Information',
      filename: 'france.md',
      content: 'France is a country in Europe. The capital of France is Paris.',
      excerpt: 'The capital of France is Paris.',
      score: 0.95,
      type: 'document',
      size: 1024,
      lastModified: new Date().toISOString()
    },
    {
      id: 2,
      title: 'European Capitals',
      filename: 'capitals.md', 
      content: 'Paris is the capital and largest city of France.',
      excerpt: 'Paris is the capital and largest city of France.',
      score: 0.87,
      type: 'document',
      size: 2048,
      lastModified: new Date().toISOString()
    }
  ];
  
  // More flexible search - check for keywords
  let filteredResults = mockResults;
  if (query && query.trim()) {
    const searchTerms = query.toLowerCase().split(' ');
    filteredResults = mockResults.filter(result => {
      const searchText = (result.content + ' ' + result.title).toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });
  }
  
  console.log('Search results:', filteredResults.length, 'found');
  res.json(filteredResults);
});

router.get('/search', (req, res) => {
  res.json({
    message: 'Use POST method for search',
    query: req.query
  });
});

// Documents routes placeholder
router.get('/documents', (req, res) => {
  res.json({
    message: 'Documents endpoint - coming soon'
  });
});

export default router;
