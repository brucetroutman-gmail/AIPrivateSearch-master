Yes, you can absolutely do this in a Node.js (ES6 modules) script! Instead of ElevenLabs (which is cloud-based), we'll use a **local Ollama TTS model** for fully offline text-to-speech. This gives you:

- Generate audio from your script text.
- **Play** the audio directly (start/stop control via buttons or keys).
- **Optionally save** it as an MP3/WAV file.

### Recommended Ollama TTS Model (2025)
The best current option is **Orpheus** – a high-quality, natural-sounding TTS model with multiple voices and emotional tags (e.g., laughter, sighs).

1. Install Ollama if you haven't: https://ollama.com/download
2. Pull the model:
   ```bash
   ollama pull legraphista/orpheus
   ```
   (It's a ~3B parameter quantised model – runs well on most modern hardware with GPU acceleration preferred.)

Other good alternatives if Orpheus doesn't suit: `chattts` forks or Piper-based setups, but Orpheus is top-rated for naturalness.

### Node.js ES6 Example: TTS with Play/Stop + Optional Save
This script:
- Takes your script text.
- Calls Ollama's `/api/generate` endpoint (Ollama doesn't have a native TTS endpoint yet, but community TTS models expose audio via generation).
- Streams the audio response.
- Uses Node's `fs` to save (optional).
- Uses the `play-sound` library for cross-platform playback with start/stop control.

#### Install Dependencies
```bash
npm init -y
npm install node-fetch play-sound
```

#### Code: `local-tts-player.mjs` (ES6 modules)
```javascript
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import player from 'play-sound';  // For playback with controls

const playback = player();  // Initialize player
let currentProcess = null;  // To track and stop playback

// Your demo script text
const text = `Hello, this is my demo script using a local Ollama TTS model.
It sounds incredibly natural, with pauses and emotion if you add tags like <laugh> or <sigh>.
Welcome to offline voiceover generation!`;

// Ollama config
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'legraphista/orpheus';  // Change voice with prompt, e.g., "Use voice: tara"

// Optional: Add voice/emotion (Orpheus supports 8 voices + tags)
const fullPrompt = `Voice: tara (female, conversational). ${text}`;

// Function to generate TTS audio and return buffer
async function generateTTS() {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: fullPrompt,
      stream: false,  // Set true for streaming progress if desired
      // Orpheus-specific: raw mode for audio output
      raw: true,
      options: { num_ctx: 2048 }  // Adjust if needed
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  // Orpheus outputs base64 audio or direct binary – adjust based on model docs
  // For most GGUF TTS in Ollama, it returns audio blob
  const audioBuffer = Buffer.from(data.response, 'base64');  // If base64; else response.body

  return audioBuffer;
}

// Main function
async function main(saveToFile = true) {
  try {
    console.log('Generating TTS audio locally with Ollama...');
    const audioBuffer = await generateTTS();

    // Optional: Save to MP3/WAV
    if (saveToFile) {
      const outputPath = path.join(process.cwd(), 'demo-voiceover-orpheus.mp3');
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`Saved audio to: ${outputPath}`);
    }

    // Play audio with start/stop control
    console.log('Playing audio... Press Ctrl+C to stop early.');
    currentProcess = playback.playBuffer(audioBuffer, { format: 'mp3' }, (err) => {
      if (err) console.error('Playback error:', err);
      else console.log('Playback finished!');
    });

    // Optional: Stop playback on key press (e.g., 'q')
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      if (key.toString() === 'q') {
        if (currentProcess) {
          currentProcess.kill();
          console.log('\nPlayback stopped!');
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main(true);  // Set false to skip saving
```

#### How to Run
```bash
node local-tts-player.mjs
```

### Notes & Tips
- **Voice/Emotion**: Orpheus supports voices like "tara", "leo", etc. – add to the prompt. Use tags like `<laugh>` in text for effects.
- **Playback Library**: `play-sound` uses system players (mpg123 on Linux, afplay on Mac, mplayer on Windows). For more control (pause/resume), consider `howler.js` in an Electron app.
- **Performance**: On a decent GPU, generation takes seconds. CPU-only is slower but works.
- **If Orpheus doesn't output audio directly**: Some TTS models need a wrapper (e.g., Piper via separate process). Check `ollama list` and model page for exact usage – Orpheus is designed for direct audio.
- **Browser Version**: For a web UI with play/stop buttons, wrap this in Express + HTML audio element.

This is fully local, private, and free – perfect for your demo workflow (generate MP3, then import to Snagit). If you run into issues with the model output format or want a different voice, share details and I can tweak!