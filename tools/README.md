# AIPrivateSearch Development Tools

## Demo and support scripts

**`no-data-share.sh` — privacy demo.** Runs a small local model through Ollama, then checks
network connections to show that Ollama made no external connections while processing.
Starts Ollama if needed and downloads a small model once if none is installed.
```bash
bash tools/no-data-share.sh
```

**`clear-aips-storage.js` — selective browser reset.** A snippet to paste into the browser
console on an AIPrivateSearch page. It removes only AIPS-related items from localStorage,
sessionStorage and localhost cookies, and leaves other sites alone. For a complete test reset
that also clears device registration, use `clear-storage.sh` in the repo root instead.

## TTS Generator

Convert text to speech using macOS built-in say command for demo videos and voiceovers.

### Prerequisites

1. **macOS Required**: This tool uses the built-in `say` command
2. **Install Dependencies**:
   ```bash
   cd tools
   npm install
   ```

### Usage

**Basic Text-to-Speech:**
```bash
node tts-generator.mjs "Welcome to AIPrivateSearch"
```

**From File:**
```bash
node tts-generator.mjs --file ../docs/demo-script.txt
```

**Custom Voice & Rate:**
```bash
node tts-generator.mjs "Hello world" --voice Alex --rate 180
```

**Save Without Playing:**
```bash
node tts-generator.mjs "Demo text" --no-play --output demo.mp3
```

**Interactive Mode:**
```bash
node tts-generator.mjs --interactive
```

### Options

- `--voice <name>`: Voice to use (Samantha, Alex, etc.)
- `--rate <speed>`: Speech rate 100-300 (default: 200)
- `--no-play`: Don't auto-play generated audio
- `--no-save`: Don't save audio file
- `--output <file>`: Custom output filename
- `--file <path>`: Read text from file
- `--interactive`: Interactive mode

### Supported Voices

macOS includes many built-in voices:
- **Samantha**: Female, natural (default)
- **Alex**: Male, clear
- **Victoria**: Female, British
- **Daniel**: Male, British
- **Karen**: Female, Australian
- **Moira**: Female, Irish

### Audio Output

Generated audio files are saved to `./audio-output/` directory in AIFF format.

### Integration with Snagit

1. Generate voiceover: `node tts-generator.mjs --file script.txt --output demo-vo.aiff`
2. Import AIFF into Snagit for video narration
3. Sync with screen recording

### Troubleshooting

**macOS Required:**
This tool only works on macOS with the built-in `say` command.

**Audio Playback Issues:**
- Uses `afplay` (built-in on macOS)
- Generates AIFF format for best compatibility

**List Available Voices:**
```bash
say -v ?
```