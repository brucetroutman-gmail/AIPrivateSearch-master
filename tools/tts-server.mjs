#!/usr/bin/env node

/**
 * TTS Web Server
 * Serves the TTS web interface and handles API requests
 */

import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Create audio output directory
const audioOutputDir = path.join(__dirname, 'audio-output');

// Serve static files
app.use(express.static(__dirname));

// Serve audio files with proper headers
app.use('/audio', (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    if (ext === '.wav') {
        res.header('Content-Type', 'audio/wav');
    } else if (ext === '.aiff') {
        res.header('Content-Type', 'audio/aiff');
    }
    res.header('Accept-Ranges', 'bytes');
    next();
}, express.static(audioOutputDir));

// Main TTS page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'tts-web.html'));
});

// TTS Generation API
app.post('/api/tts/generate', async (req, res) => {
    try {
        const { text, voice = 'Samantha', rate = 200, filename, saveOnly = false } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        // Create output directory
        const outputDir = path.join(__dirname, 'audio-output');
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }

        // Generate filename (use WAV for better browser support)
        const baseFilename = filename ? filename.replace(/\.[^.]+$/, '') : `tts-${Date.now()}`;
        const aiffFilename = `${baseFilename}.aiff`;
        const wavFilename = `${baseFilename}.wav`;
        const aiffPath = path.join(outputDir, aiffFilename);
        const wavPath = path.join(outputDir, wavFilename);

        console.log(`Generating TTS: voice=${voice}, rate=${rate}, file=${wavFilename}`);
        console.log(`Output path: ${wavPath}`);

        // Generate audio using macOS say command (AIFF first)
        const sayProcess = spawn('say', [
            '-v', voice,
            '-r', rate.toString(),
            '-o', aiffPath,
            text
        ]);

        await new Promise((resolve, reject) => {
            sayProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`say command failed with code ${code}`));
                }
            });

            sayProcess.on('error', (error) => {
                reject(new Error(`say command error: ${error.message}`));
            });
        });

        // Convert AIFF to WAV for better browser support
        const ffmpegProcess = spawn('ffmpeg', [
            '-i', aiffPath,
            '-y', // Overwrite output file
            wavPath
        ]);

        await new Promise((resolve, reject) => {
            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`ffmpeg conversion failed with code ${code}`));
                }
            });

            ffmpegProcess.on('error', (error) => {
                reject(new Error(`ffmpeg error: ${error.message}`));
            });
        });

        // Clean up AIFF file
        try {
            await fs.unlink(aiffPath);
        } catch (error) {
            // Ignore cleanup errors
        }

        // Verify WAV file was created
        try {
            const stats = await fs.stat(wavPath);
            console.log(`Audio generated: ${wavFilename} (${stats.size} bytes)`);
            console.log(`Audio URL will be: /audio/${wavFilename}`);
        } catch (error) {
            console.error('File verification failed:', error);
            throw new Error('Audio file was not created');
        }

        // Return response
        if (saveOnly) {
            res.json({
                success: true,
                filename: wavFilename,
                message: 'Audio saved successfully'
            });
        } else {
            res.json({
                success: true,
                filename: wavFilename,
                audioUrl: `/audio/${wavFilename}`,
                message: 'Audio generated successfully'
            });
        }

    } catch (error) {
        console.error('TTS generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'TTS generation failed'
        });
    }
});

// Get available voices
app.get('/api/tts/voices', async (req, res) => {
    try {
        const voicesProcess = spawn('say', ['-v', '?']);
        let voicesOutput = '';

        voicesProcess.stdout.on('data', (data) => {
            voicesOutput += data.toString();
        });

        await new Promise((resolve) => {
            voicesProcess.on('close', () => {
                const voices = voicesOutput
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const parts = line.trim().split(/\s+/);
                        const name = parts[0];
                        const description = parts.slice(1).join(' ');
                        return { name, description };
                    })
                    .filter(voice => voice.name);

                res.json({ success: true, voices });
                resolve();
            });
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get voices'
        });
    }
});

// List generated files
app.get('/api/tts/files', async (req, res) => {
    try {
        const outputDir = path.join(__dirname, 'audio-output');
        const files = await fs.readdir(outputDir);
        const audioFiles = files
            .filter(file => file.endsWith('.aiff'))
            .map(file => ({
                name: file,
                url: `/audio/${file}`,
                path: path.join(outputDir, file)
            }));

        res.json({ success: true, files: audioFiles });
    } catch (error) {
        res.json({ success: true, files: [] });
    }
});

// Delete file
app.delete('/api/tts/files/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'audio-output', filename);
        
        await fs.unlink(filePath);
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete file' });
    }
});

// Start server
app.listen(PORT, async () => {
    // Create audio output directory
    try {
        await fs.mkdir(audioOutputDir, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
    console.log(`🎤 TTS Web Interface running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Audio files: http://localhost:${PORT}/audio/`);
    console.log(`\n🎯 Usage:`);
    console.log(`   1. Open http://localhost:${PORT} in your browser`);
    console.log(`   2. Select voice and enter text`);
    console.log(`   3. Click Play or Save`);
    console.log(`\n⏹️  Press Ctrl+C to stop server`);
});

export default app;