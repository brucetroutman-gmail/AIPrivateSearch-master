import dotenv from 'dotenv';
dotenv.config({ path: '/Users/Shared/AIPrivateSearch/.env', quiet: true, debug: false });
import express from 'express';
import cors from 'cors';
import path from 'path';
import searchRouter from './routes/search.mjs';
import multiSearchRouter from './routes/multiSearch.mjs';
import modelsRouter from './routes/models.mjs';
import databaseRouter from './routes/database.mjs';
import documentsRouter from './routes/documents.mjs';
import configRouter from './routes/config.mjs';
import sentenceTransformersRouter from './routes/sentenceTransformers.mjs';
import authRouter from './routes/auth.mjs';
import subscriptionRouter from './routes/subscription.mjs';
import testResultsRouter from './routes/testResults.mjs';
import tierAccessRouter from './routes/tierAccess.mjs';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.mjs';
import { generateCSRFToken, validateCSRFToken } from './middleware/csrf.mjs';
import { validateOrigin } from './middleware/auth.mjs';

import loggerPkg from '../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

const app = express();

// Security headers
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "connect-src 'self' http://localhost:11434; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve static files from client
app.use(express.static(path.join(process.cwd(), '../../client/c01_client-first-app')));

// CSRF token endpoint
app.get('/api/csrf-token', generateCSRFToken, (req, res) => {
  res.json({ csrfToken: req.csrfToken });
});

// System info endpoint (no auth required)
app.get('/api/system-info', async (req, res) => {
  try {
    const { getSystemInfo } = await import('./routes/../lib/utils/systemInfo.mjs');
    const systemInfo = await getSystemInfo();
    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({ 
      systemInfo: { chip: 'Unknown', graphics: 'Unknown', ram: 'Unknown', os: 'Unknown' },
      pcCode: 'Unknown'
    });
  }
});

// Version endpoint (no auth required)
app.get('/api/version', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const packageJson = JSON.parse(await fs.readFile('../../package.json', 'utf8'));
    res.json({ version: packageJson.version });
  } catch (error) {
    res.status(500).json({ version: 'Unknown' });
  }
});

// Apply routes with specific middleware
app.use('/api/search', validateOrigin, validateCSRFToken, searchRouter);
app.use('/api/multi-search', validateOrigin, multiSearchRouter);
app.use('/api/models', validateOrigin, validateCSRFToken, modelsRouter);
app.use('/api/database', validateOrigin, validateCSRFToken, databaseRouter);
app.use('/api/documents', validateOrigin, documentsRouter);
app.use('/api/config', validateOrigin, configRouter);
app.use('/api/sentence-transformers', sentenceTransformersRouter);
app.use('/api/auth', validateOrigin, authRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/tier-access', validateOrigin, tierAccessRouter);
app.use('/api', testResultsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);



const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  logger.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  logger.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});
