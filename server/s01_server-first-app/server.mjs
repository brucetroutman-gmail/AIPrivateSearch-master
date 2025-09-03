import 'dotenv/config';
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
import { validateOrigin } from './middleware/auth.mjs';
import loggerPkg from '../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

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

// Apply origin validation and CSRF protection to all API routes
app.use('/api', validateOrigin);
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
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
  // logger sanitizes all inputs to prevent log injection
  logger.log(`Server running on port ${PORT}`);
});
