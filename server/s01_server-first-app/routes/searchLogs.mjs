import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { secureFs } from '../lib/utils/secureFileOps.mjs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = '/Users/Shared/AIPrivateSearch/logs';

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Search logs route is working', logsDir: LOGS_DIR });
});

// Get search logs with filtering
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, searchType } = req.query;
        
        // Get all log files
        const files = await secureFs.readdir(LOGS_DIR);
        const logFiles = files.filter(file => file.endsWith('-log.json'));
        
        let allLogs = [];
        
        for (const file of logFiles) {
            try {
                const filePath = path.join(LOGS_DIR, file);
                const content = await secureFs.readFile(filePath, 'utf8');
                const logs = JSON.parse(content);
                
                if (Array.isArray(logs)) {
                    allLogs = allLogs.concat(logs);
                }
            } catch (error) {
                console.error(`Error reading log file ${file}:`, error);
            }
        }
        
        // Filter logs based on criteria
        let filteredLogs = allLogs;
        
        if (startDate) {
            const start = new Date(startDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
        }
        
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59.999Z');
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
        }
        
        if (searchType) {
            filteredLogs = filteredLogs.filter(log => log.searchType === searchType);
        }
        
        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(filteredLogs);
        
    } catch (error) {
        console.error('Error loading search logs:', error);
        res.status(500).json({ error: 'Failed to load search logs', details: error.message });
    }
});

// Export logs to database (Professional tier only)
router.post('/export-logs-to-database', async (req, res) => {
    try {
        // Check user tier (Professional only)
        const userTier = req.session?.user?.tier || 'standard';
        if (userTier !== 'professional') {
            return res.status(403).json({ error: 'Professional tier required for database export' });
        }
        
        const { logs } = req.body;
        
        if (!logs || !Array.isArray(logs)) {
            return res.status(400).json({ error: 'Invalid logs data' });
        }
        
        // Import database connection
        const { getConnection } = await import('../lib/database/connection.mjs');
        const connection = await getConnection();
        
        if (!connection) {
            return res.status(500).json({ error: 'Database connection not available' });
        }
        
        let exported = 0;
        
        for (const log of logs) {
            try {
                // Check if log already exists
                const [existing] = await connection.execute(
                    'SELECT id FROM search_logs WHERE timestamp = ? AND query = ? AND search_model = ?',
                    [log.timestamp, log.query, log.searchModel]
                );
                
                if (existing.length === 0) {
                    // Insert new log entry
                    await connection.execute(`
                        INSERT INTO search_logs (
                            timestamp, search_type, query, collection, search_model, 
                            score_model, result_count, duration, error, user_email,
                            source_type, assistant_type, temperature, context_length,
                            max_tokens, generate_scores, test_code
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        log.timestamp,
                        log.searchType || null,
                        log.query || null,
                        log.collection || null,
                        log.searchModel || null,
                        log.scoreModel || null,
                        log.resultCount || 0,
                        log.duration || null,
                        log.error || null,
                        log.userEmail || null,
                        log.sourceType || null,
                        log.assistantType || null,
                        log.temperature || null,
                        log.contextLength || null,
                        log.maxTokens || null,
                        log.generateScores || false,
                        log.testCode || null
                    ]);
                    
                    exported++;
                }
            } catch (error) {
                console.error('Error inserting log:', error);
            }
        }
        
        res.json({ exported, total: logs.length });
        
    } catch (error) {
        console.error('Error exporting logs to database:', error);
        res.status(500).json({ error: 'Failed to export logs to database' });
    }
});

export default router;