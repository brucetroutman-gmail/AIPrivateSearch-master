# AISearchScore - Tester Instructions

## Quick Start (First Time or Reload)

1. **Open Terminal**

2. **Run the load script:**
   ```bash
   cd /Users/Shared
   bash load-aiss.sh
   ```

3. **Wait for startup** (2-3 minutes for model downloads on first run)

4. **Open your browser to:**
   - **http://localhost:3000**

## That's it! 🎉

The app will automatically:
- Download the latest version
- Install dependencies  
- Pull AI models (first time only)
- Start both server and client
- No login or API keys needed for testing

## To Stop the App

Press `Ctrl+C` in the terminal

## To Restart/Reload

Just run the same command again:
```bash
cd /Users/Shared
bash load-aiss.sh
```

## Troubleshooting

- **"Permission denied"**: Run `chmod +x load-aiss.sh` first
- **"Directory not found"**: The script will create `/Users/Shared/repos` automatically
- **Port conflicts**: The script automatically kills existing processes
- **Ollama errors**: Install from https://ollama.com/download and run `ollama serve`

## Need Help?

Contact the development team with:
- Your operating system
- Any error messages from the terminal
- Screenshots of issues