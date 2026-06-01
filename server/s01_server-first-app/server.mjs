 
 
import dotenv from 'dotenv';
// Try multiple .env-aips locations
const envPaths = [
  '/Users/Shared/AIPrivateSearch/.env-aips',  // macOS
  '/webs/AIPrivateSearch/.env-aips',          // Ubuntu
  '.env'                                      // Local fallback
];
for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath, quiet: true });
    if (process.env.API_KEY) break;
  } catch (e) {}
}
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
import searchLogsRouter from './routes/searchLogs.mjs';
import licensingRouter from './routes/device-licensing.mjs';
import membersRouter from './routes/members.mjs';
import fabricRouter from './routes/fabric.mjs';
import breadcrumbsRouter from './routes/breadcrumbs.mjs';
import feedbackRouter from './routes/feedback.mjs';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.mjs';
import { generateCSRFToken, validateCSRFToken } from './middleware/csrf.mjs';
import { validateOrigin } from './middleware/auth.mjs';

// Debug wrapper for validateOrigin
const debugValidateOrigin = (req, res, next) => {
  console.log('validateOrigin check:', req.headers.origin, req.headers.referer);
  validateOrigin(req, res, next);
};

import loggerPkg from '../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

const app = express();

// Global request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Security headers
app.use((req, res, next) => {
  // Content Security Policy - more permissive for external links
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://iodd.com; " +
    "img-src 'self' data: https://iodd.com; " +
    "connect-src 'self' http://localhost:11434 https://iodd.com; " +
    "font-src 'self' https://iodd.com data:; " +
    "frame-src https://iodd.com; " +
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

// Load CORS origins from app.json config
let corsOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
try {
  const fs = await import('fs/promises');
  const appConfig = JSON.parse(await fs.readFile('../../client/c01_client-first-app/config/app.json', 'utf8'));
  if (appConfig.ports) {
    const frontendPort = appConfig.ports.frontend || 3000;
    const backendPort = appConfig.ports.backend || 3001;
    corsOrigins = [
      `http://localhost:${frontendPort}`,
      `http://localhost:${backendPort}`,
      `http://127.0.0.1:${frontendPort}`,
      `http://127.0.0.1:${backendPort}`
    ];
  }
} catch (error) {
  // Use defaults if config can't be read
}

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve static files from client
app.use(express.static(path.join(process.cwd(), '../../client/c01_client-first-app')));

// Specific route for config-editor to preserve query parameters
app.get('/config-editor.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), '../../client/c01_client-first-app/config-editor.html'));
});
app.get('/config-editor', (req, res) => {
  res.sendFile(path.join(process.cwd(), '../../client/c01_client-first-app/config-editor.html'));
});

// CSRF token endpoint
app.get('/api/csrf-token', generateCSRFToken, (req, res) => {
  res.json({ csrfToken: req.csrfToken });
});

// System info endpoint (no auth required)
app.get('/api/system-info', async (req, res) => {
  try {
    const { DeviceLicenseClient } = await import('./lib/licensing/device-license-client.mjs');
    const deviceClient = new DeviceLicenseClient();
    const systemInfo = await deviceClient.getSystemInfo();
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

// Direct search logs test endpoint (no middleware)
app.get('/api/search-logs-direct', (req, res) => {
  console.log('Direct search logs endpoint hit!');
  res.json({ message: 'Direct search logs working', timestamp: new Date().toISOString() });
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
// Simplified search-logs route (no middleware)
app.use('/api/search-logs', searchLogsRouter);
app.use('/api/licensing', licensingRouter);
app.use('/api/device-licensing', licensingRouter);
app.use('/api/fabric', validateOrigin, fabricRouter);
app.use('/api/breadcrumbs', breadcrumbsRouter);
app.use('/api/search-feedback', validateOrigin, feedbackRouter);
app.use('/api', membersRouter);
app.use('/api', testResultsRouter);

// Catch-all for unmatched API routes
app.use('/api/*', (req, res) => {
  console.log('Unmatched API route:', req.method, req.originalUrl);
  res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl });
});

// Error handling middleware (must be last)
app.use(errorHandler);



// Load port from app.json config
let PORT = process.env.PORT || 3001;
try {
  const fs = await import('fs/promises');
  const appConfig = JSON.parse(await fs.readFile('../../client/c01_client-first-app/config/app.json', 'utf8'));
  PORT = process.env.PORT || appConfig.ports?.backend || 3001;
} catch (error) {
  // Fallback to default if config can't be read
  PORT = process.env.PORT || 3001;
}
const server = app.listen(PORT, async () => {
  logger.log(`Server running on port ${PORT}`);
  logger.log('Device-based licensing system ready');
});

server.on('error', (err) => {
  logger.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});
