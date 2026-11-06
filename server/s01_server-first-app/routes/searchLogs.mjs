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

export default router;