import express from 'express';
import cors from 'cors';
import path from 'path';
import searchRouter from './routes/search.mjs';
import modelsRouter from './routes/models.mjs';
import databaseRouter from './routes/database.mjs';
import documentsRouter from './routes/documents.mjs';
import configRouter from './routes/config.mjs';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from client
app.use(express.static(path.join(process.cwd(), '../../client/c01_client-first-app')));

// Use the routers
app.use('/api/search', searchRouter);
app.use('/api/models', modelsRouter);
app.use('/api/database', databaseRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/config', configRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
