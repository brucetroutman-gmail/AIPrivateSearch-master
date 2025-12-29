#!/usr/bin/env node

/**
 * AIPrivateSearch Text-to-Speech Generator
 * Converts text to speech using local Ollama TTS models
 * Based on AIPS-Demo-TTS-Snagit.md guide
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

class TTSGenerator {
  constructor() {
    this.outputDir = './audio-output';
    this.currentPlayback = null;
  }

  async initialize() {
    // Create output directory
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    // Check if say command is available (macOS) - silent check
    try {
      const sayProcess = spawn('which', ['say'], { stdio: 'pipe' });
      await new Promise((resolve, reject) => {
        sayProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('say command not found'));
          }
        });
        sayProcess.on('error', reject);
      });
      console.log('✓ macOS say command verified');
    } catch (error) {
      throw new Error('macOS say command not available. This tool requires macOS.');
    }
  }

  async generateAudio(text, options = {}) {
    const {
      voice = 'Samantha',
      rate = 200,
      saveFile = true,
      filename = null
    } = options;

    console.log('🎤 Generating TTS audio...');
    
    try {
      const outputFilename = filename || `tts-${Date.now()}.aiff`;
      const outputPath = path.join(this.outputDir, outputFilename);
      
      // Use macOS say command to generate audio
      const sayProcess = spawn('say', [
        '-v', voice,
        '-r', rate.toString(),
        '-o', outputPath,
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
        
        sayProcess.on('error', reject);
      });
      
      // Read the generated audio file
      const audioBuffer = await fs.readFile(outputPath);
      
      if (saveFile) {
        console.log(`💾 Audio saved: ${outputPath}`);
        return { audioBuffer, filePath: outputPath };
      } else {
        // Clean up if not saving
        await fs.unlink(outputPath);
        return { audioBuffer, filePath: null };
      }
    } catch (error) {
      console.error('❌ TTS generation failed:', error.message);
      throw error;
    }
  }

  async playAudio(audioBuffer) {
    return new Promise(async (resolve, reject) => {
      console.log('🔊 Playing audio... (Press Ctrl+C to stop)');
      
      try {
        // Save to temporary file for playback
        const tempFile = path.join(this.outputDir, `temp-${Date.now()}.mp3`);
        await fs.writeFile(tempFile, audioBuffer);
        
        // Use system audio player with file path
        const player = process.platform === 'darwin' ? 'afplay' : 
                      process.platform === 'linux' ? 'mpg123' : 'mplayer';
        
        this.currentPlayback = spawn(player, [tempFile], { stdio: 'inherit' });
        
        this.currentPlayback.on('close', async (code) => {
          console.log('🔇 Playback finished');
          this.currentPlayback = null;
          
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
          } catch (error) {
            // Ignore cleanup errors
          }
          
          resolve();
        });
        
        this.currentPlayback.on('error', (error) => {
          console.error('❌ Playback error:', error.message);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stopPlayback() {
    if (this.currentPlayback) {
      this.currentPlayback.kill();
      this.currentPlayback = null;
      console.log('⏹️ Playback stopped');
    }
  }

  async processScript(scriptText, options = {}) {
    try {
      await this.initialize();
      const result = await this.generateAudio(scriptText, options);
      
      if (options.autoPlay !== false) {
        console.log('🔊 Playing generated audio file...');
        const playProcess = spawn('afplay', [result.filePath]);
        
        await new Promise((resolve) => {
          playProcess.on('close', () => {
            console.log('🔇 Playback finished');
            resolve();
          });
          
          playProcess.on('error', (error) => {
            console.error('❌ Playback error:', error.message);
            resolve();
          });
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Script processing failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🎤 AIPrivateSearch TTS Generator

Usage:
  node tts-generator.mjs "Your text here"
  node tts-generator.mjs --file script.txt
  node tts-generator.mjs --interactive

Options:
  --voice <name>     Voice to use (default: Samantha)
  --rate <speed>     Speech rate 100-300 (default: 200)
  --no-play         Don't auto-play generated audio
  --no-save         Don't save audio file
  --output <file>    Custom output filename

Examples:
  node tts-generator.mjs "Hello world"
  node tts-generator.mjs --file demo-script.txt --voice Alex --rate 180
  node tts-generator.mjs "Welcome to AIPrivateSearch" --output welcome.aiff
`);
    process.exit(0);
  }

  const tts = new TTSGenerator();
  let text = '';
  let options = {
    voice: 'Samantha',
    rate: 200,
    autoPlay: true,
    saveFile: true,
    filename: null
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file') {
      const filePath = args[++i];
      try {
        text = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        console.error(`❌ Cannot read file: ${filePath}`);
        process.exit(1);
      }
    } else if (arg === '--voice') {
      options.voice = args[++i];
    } else if (arg === '--rate') {
      options.rate = parseInt(args[++i]) || 200;
    } else if (arg === '--no-play') {
      options.autoPlay = false;
    } else if (arg === '--no-save') {
      options.saveFile = false;
    } else if (arg === '--output') {
      options.filename = args[++i];
    } else if (arg === '--interactive') {
      await interactiveMode(tts);
      return;
    } else if (!arg.startsWith('--')) {
      text = arg;
    }
  }

  if (!text) {
    console.error('❌ No text provided');
    process.exit(1);
  }

  // Handle Ctrl+C for stopping playback
  process.on('SIGINT', () => {
    tts.stopPlayback();
    process.exit(0);
  });

  try {
    await tts.processScript(text, options);
  } catch (error) {
    process.exit(1);
  }
}

async function interactiveMode(tts) {
  console.log('🎤 Interactive TTS Mode - Type text and press Enter (type "quit" to exit)');
  
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (input) => {
    const text = input.trim();
    
    if (text === 'quit' || text === 'exit') {
      console.log('👋 Goodbye!');
      process.exit(0);
    }
    
    if (text) {
      try {
        await tts.processScript(text, { 
          saveFile: true, 
          filename: `interactive-${Date.now()}.aiff`,
          autoPlay: true 
        });
      } catch (error) {
        // Error already logged
      }
    }
    
    process.stdout.write('> ');
  });
  
  process.stdout.write('> ');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TTSGenerator };