import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

const dbConfig = {
  host: '92.112.184.206',
  port: 3306,
  user: 'nimdas',
  password: 'FormR!1234',
  database: 'aisearchscore'
};

router.post('/save', async (req, res) => {
  try {
    const data = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    
    const insertQuery = `
      INSERT INTO searches (
        TestCode, TestCategory, TestDescription, UserEmail, PcCode, PcCPU, PcGraphics, PcRAM, PcOS, CreatedAt, SourceType, SystemPrompt, Prompt,
        \`ModelName-search\`, \`ModelContextSize-search\`, \`ModelTemperature-search\`, \`ModelTokenLimit-search\`,
        \`Duration-search-s\`, \`Load-search-ms\`, \`EvalTokensPerSecond-ssearch\`, \`Answer-search\`,
        \`ModelName-score\`, \`ModelContextSize-score\`, \`ModelTemperature-score\`,
        \`Duration-score-s\`, \`Load-score-ms\`, \`EvalTokensPerSecond-score\`,
        AccurateScore, RelevantScore, OrganizedScore, \`WeightedScore-pct\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.TestCode || '',
      data.TestCategory || null,
      data.TestDescription || null,
      data.UserEmail || null,
      data.PcCode || null,
      data.PcCPU || null,
      data.PcGraphics || null,
      data.PcRAM || null,
      data.PcOS || null,
      data.CreatedAt || null,
      data.SourceType || null,
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
      data['Duration-score-s'] || null,
      data['Load-score-ms'] || null,
      data['EvalTokensPerSecond-score'] || null,
      data.AccurateScore || null,
      data.RelevantScore || null,
      data.OrganizedScore || null,
      data['WeightedScore-pct'] || null
    ];
    
    const [result] = await connection.execute(insertQuery, values);
    await connection.end();
    
    res.json({ success: true, insertId: result.insertId });
  } catch (error) {
    console.error('Database save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all test data for analysis
router.get('/tests', async (req, res) => {
  try {
    const query = `
      SELECT * FROM searches 
      ORDER BY CreatedAt DESC
    `;
    
    const [rows] = await db.execute(query);
    
    res.json({
      success: true,
      tests: rows
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;