import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { safeLog, safeError } from '../lib/utils/safeLogger.mjs';
import { requireAuth } from '../middleware/auth.mjs';

dotenv.config();

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

const pool = mysql.createPool(dbConfig);

router.post('/save', requireAuth, async (req, res) => {
  let connection;
  try {
    const data = req.body;
    safeLog('Database save request received');
    safeLog('CreatedAt value length:', data.CreatedAt ? String(data.CreatedAt).length : 0);
    
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
    
    safeLog('Executing query with', values.length, 'parameters');
    const [result] = await connection.execute(insertQuery, values);
    
    safeLog('Database save successful, insertId:', String(result.insertId));
    res.json({ success: true, insertId: result.insertId });
  } catch (error) {
    safeError('Database save error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Get all test data for analysis
router.get('/tests', requireAuth, async (req, res) => {
  let connection;
  try {
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
    safeError('Database query error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;