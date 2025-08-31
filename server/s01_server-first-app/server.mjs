import express from 'express';
import cors from 'cors';
import path from 'path';
import searchRouter from './routes/search.mjs';
import modelsRouter from './routes/models.mjs';
import databaseRouter from './routes/database.mjs';
import documentsRouter from './routes/documents.mjs';
import configRouter from './routes/config.mjs';
import { errorHandler } from './middleware/errorHandler.mjs';
import { generateCSRFToken, validateCSRFToken } from './middleware/csrf.mjs';

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.json());

// Serve static files from client
app.use(express.static(path.join(process.cwd(), '../../client/c01_client-first-app')));

// CSRF token endpoint
app.get('/api/csrf-token', generateCSRFToken, (req, res) => {
  res.json({ csrfToken: req.csrfToken });
});

// Apply CSRF protection to all API routes
app.use('/api', validateCSRFToken);

// Use the routers
app.use('/api/search', searchRouter);
app.use('/api/models', modelsRouter);
app.use('/api/database', databaseRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/config', configRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});
