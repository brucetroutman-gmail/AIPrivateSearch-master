import express from 'express';
import cors from 'cors';
import searchRouter from './routes/search.mjs';
import modelsRouter from './routes/models.mjs';
import databaseRouter from './routes/database.mjs';

const app = express();
app.use(cors());
app.use(express.json());

// Use the routers
app.use('/api/search', searchRouter);
app.use('/api/models', modelsRouter);
app.use('/api/database', databaseRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
