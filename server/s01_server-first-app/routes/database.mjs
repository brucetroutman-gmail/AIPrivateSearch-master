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
        TestCode, PcCode, PcCPU, PcGraphics, PcRAM, PcOS, CreatedAt, SourceType, SystemPrompt, Prompt,
        \`ModelName-search\`, \`ModelContextSize-search\`, \`ModelTemperature-search\`, \`ModelTokenLimit-search\`,
        \`Duration-search-s\`, \`Load-search-ms\`, \`EvalTokensPerSecond-ssearch\`, \`Answer-search\`,
        \`ModelName-score\`, \`ModelContextSize-score\`, \`ModelTemperature-score\`,
        \`Duration-score-s\`, \`Load-score-ms\`, \`EvalTokensPerSecond-score\`,
        AccurateScore, RelevantScore, OrganizedScore, \`WeightedScore-pct\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.TestCode || '',
      data.PcCode,
      data.PcCPU,
      data.PcGraphics,
      data.PcRAM,
      data.PcOS,
      data.CreatedAt,
      data.SourceType,
      data.SystemPrompt,
      data.Prompt,
      data['ModelName-search'],
      data['ModelContextSize-search'],
      data['ModelTemperature-search'],
      data['ModelTokenLimit-search'],
      data['Duration-search-s'],
      data['Load-search-ms'],
      data['EvalTokensPerSecond-ssearch'],
      data['Answer-search'],
      data['ModelName-score'],
      data['ModelContextSize-score'],
      data['ModelTemperature-score'],
      data['Duration-score-s'],
      data['Load-score-ms'],
      data['EvalTokensPerSecond-score'],
      data.AccurateScore,
      data.RelevantScore,
      data.OrganizedScore,
      data['WeightedScore-pct']
    ];
    
    const [result] = await connection.execute(insertQuery, values);
    await connection.end();
    
    res.json({ success: true, insertId: result.insertId });
  } catch (error) {
    console.error('Database save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;