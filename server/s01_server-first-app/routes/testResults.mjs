/* eslint-disable security/detect-non-literal-fs-filename */
 
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const RESULTS_DIR = path.join(__dirname, '../../../test-results');

// Ensure results directory exists
async function ensureResultsDir() {
    try {
        await fs.access(RESULTS_DIR);
    } catch {
        await fs.mkdir(RESULTS_DIR, { recursive: true });
    }
}

// Get Mac serial number
router.get('/system-info', async (req, res) => {
    try {
        const serialNumber = execSync('system_profiler SPHardwareDataType | grep "Serial Number" | awk \'{print $4}\'', { encoding: 'utf8' }).trim();
        res.json({ serialNumber });
    } catch (error) {
        res.json({ serialNumber: null });
    }
});

// Save test results
router.post('/save-test-results', async (req, res) => {
    try {
        await ensureResultsDir();
        const { fileName, data } = req.body;
        const filePath = path.join(RESULTS_DIR, fileName);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        res.json({ success: true, fileName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all test results
router.get('/test-results', async (req, res) => {
    try {
        await ensureResultsDir();
        const files = await fs.readdir(RESULTS_DIR);
        const results = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(RESULTS_DIR, file);
                const content = await fs.readFile(filePath, 'utf8');
                results.push(JSON.parse(content));
            }
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;