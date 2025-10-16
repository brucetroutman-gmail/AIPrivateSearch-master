import dotenv from 'dotenv';
dotenv.config({ path: '/Users/Shared/.env', quiet: true, debug: false });
import express from 'express';
import cors from 'cors';
import path from 'path';
import searchRouter from './routes/search.mjs';
import multiSearchRouter from './routes/multiSearch.mjs';
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
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

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

// Apply origin validation and CSRF protection to all API routes
app.use('/api', validateOrigin);
app.use('/api', validateCSRFToken);

// Use the routers
app.use('/api/search', searchRouter);
app.use('/api/multi-search', multiSearchRouter);
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
