import express from 'express';
import cors from 'cors';
import searchRouter from './routes/search.mjs';

const app = express();
app.use(cors());
app.use(express.json());

// Use the search router
app.use('/api/search', searchRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
