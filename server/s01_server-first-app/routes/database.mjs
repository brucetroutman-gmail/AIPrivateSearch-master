import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;
import { requireAuthWithRateLimit } from '../middleware/auth.mjs';

dotenv.config();

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'aisearchscore',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

let pool;
try {
  pool = mysql.createPool(dbConfig);
} catch (error) {
  logger.error('Database pool creation failed:', error.message);
}

router.post('/save', requireAuthWithRateLimit(50, 60000), async (req, res) => {
  let connection;
  try {
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database not configured' });
    }
    
    const data = req.body;
    logger.log('Database save request received');
    logger.log('CreatedAt value length:', data.CreatedAt ? String(data.CreatedAt).length : 0);
    
    connection = await pool.getConnection();
    
    const insertQuery = `
      INSERT INTO searches (
        TestCode, TestCategory, TestDescription, UserEmail, PcCode, PcCPU, PcGraphics, PcRAM, PcOS, CreatedAt, SourceType, CollectionName, SystemPrompt, Prompt,
        \`ModelName-search\`, \`ModelContextSize-search\`, \`ModelTemperature-search\`, \`ModelTokenLimit-search\`,
        \`Duration-search-s\`, \`Load-search-ms\`, \`EvalTokensPerSecond-ssearch\`, \`Answer-search\`,
        \`ModelName-score\`, \`ModelContextSize-score\`, \`ModelTemperature-score\`, \`ModelTokenLimit-score\`,
        \`Duration-score-s\`, \`Load-score-ms\`, \`EvalTokensPerSecond-score\`,
        AccurateScore, RelevantScore, OrganizedScore, \`WeightedScore-pct\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.TestCode || '',
      data.TestCategory || 'User Selected Test',
      data.TestDescription || null,
      data.UserEmail || null,
      data.PcCode || null,
      data.PcCPU || null,
      data.PcGraphics || null,
      data.PcRAM || null,
      data.PcOS || null,
      data.CreatedAt ? data.CreatedAt.substring(0, 19).replace('T', ' ') : null,
      data.SourceType || null,
      data.CollectionName || null,
      data.SystemPrompt || null,
      data.Prompt || null,
      data['ModelName-search'] || null,
      data['ModelContextSize-search'] || null,
      data['ModelTemperature-search'] || null,
      data['ModelTokenLimit-search'] || null,
      data['Duration-search-s'] || null,
      data['Load-search-ms'] || null,
      data['EvalTokensPerSecond-ssearch'] || null,
      data['Answer-search'] || null,
      data['ModelName-score'] || null,
      data['ModelContextSize-score'] || null,
      data['ModelTemperature-score'] || null,
      data['ModelTokenLimit-score'] || null,
      data['Duration-score-s'] || null,
      data['Load-score-ms'] || null,
      data['EvalTokensPerSecond-score'] || null,
      data.AccurateScore || null,
      data.RelevantScore || null,
      data.OrganizedScore || null,
      data['WeightedScore-pct'] || null
    ];
    
    logger.log('Executing query with', values.length, 'parameters');
    const [result] = await connection.execute(insertQuery, values);
    
    logger.log('Database save successful, insertId:', String(result.insertId));
    res.json({ success: true, insertId: result.insertId });
  } catch (error) {
    logger.error('Database save error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Get all test data for analysis
router.get('/tests', requireAuthWithRateLimit(20, 60000), async (req, res) => {
  let connection;
  try {
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database not configured' });
    }
    
    connection = await pool.getConnection();
    
    const query = `
      SELECT * FROM searches 
      ORDER BY CreatedAt DESC
    `;
    
    const [rows] = await connection.execute(query);
    
    res.json({
      success: true,
      tests: rows
    });
  } catch (error) {
    logger.error('Database query error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;