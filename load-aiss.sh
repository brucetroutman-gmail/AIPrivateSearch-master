#!/bin/bash

echo "🔄 AISearchScore Load Script"
echo "============================"

# Check if we're in the right directory
if [ "$(pwd)" != "/Users/Shared" ]; then
    echo "⚠️  WARNING: This script must be run from /Users/Shared"
    echo "📍 Current directory: $(pwd)"
    echo "🔧 Please run: cd /Users/Shared && bash load-aiss.sh"
    exit 1
fi

echo "✅ Running from correct directory: $(pwd)"

# Check if Ollama is installed
echo "🔍 Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "📥 Ollama not found. Installing Ollama..."
    
    # Download and install Ollama
    echo "⬇️  Downloading Ollama installer..."
    curl -fsSL https://ollama.com/install.sh | sh
    
    if [ $? -ne 0 ]; then
        echo "❌ Ollama installation failed. Please install manually from https://ollama.com/download"
        exit 1
    fi
    
    echo "✅ Ollama installed successfully"
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service if not running
echo "🚀 Starting Ollama service..."
if ! pgrep -f "ollama serve" > /dev/null; then
    ollama serve &
    echo "✅ Ollama service started"
    sleep 3
else
    echo "✅ Ollama service is already running"
fi

# Verify Ollama is accessible
echo "🔍 Verifying Ollama accessibility..."
for i in {1..10}; do
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama is accessible"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Ollama is not accessible after 10 attempts"
        echo "Please check if Ollama is running: ollama serve"
        exit 1
    fi
    echo "⏳ Waiting for Ollama to start... (attempt $i/10)"
    sleep 2
done

# Check if Chrome is installed
echo "🔍 Checking Chrome browser installation..."
if [ ! -d "/Applications/Google Chrome.app" ]; then
    echo "📦 Chrome not found. Installing Chrome..."
    
    # Download Chrome
    echo "⬇️  Downloading Chrome installer..."
    curl -L -o /tmp/googlechrome.dmg "https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg"
    
    if [ $? -ne 0 ]; then
        echo "❌ Chrome download failed. Please install manually from https://www.google.com/chrome/"
    else
        # Mount and install Chrome
        echo "📦 Installing Chrome..."
        hdiutil attach /tmp/googlechrome.dmg -quiet
        cp -R "/Volumes/Google Chrome/Google Chrome.app" /Applications/
        hdiutil detach "/Volumes/Google Chrome" -quiet
        rm /tmp/googlechrome.dmg
        
        echo "✅ Chrome installed successfully"
        
        # Set Chrome as default browser
        echo "🔧 Setting Chrome as default browser..."
        open -a "Google Chrome" --args --make-default-browser
        echo "✅ Chrome set as default browser"
    fi
else
    echo "✅ Chrome is already installed"
fi

# Create repos directory if it doesn't exist
if [ ! -d "repos" ]; then
    echo "📁 Creating repos directory..."
    mkdir -p repos
fi

# Change to repos directory
cd repos
echo "📂 Changed to: $(pwd)"

# Remove existing installation
if [ -d "aisearchscore" ]; then
    echo "🗑️  Removing existing aisearchscore directory..."
    rm -rf aisearchscore
else
    echo "📁 No existing aisearchscore directory found"
fi

# Clone fresh copy
echo "📥 Cloning fresh copy from GitHub..."
git clone https://github.com/brucetroutman-gmail/AISearchScore-master.git aisearchscore

if [ $? -ne 0 ]; then
    echo "❌ Git clone failed. Please check your internet connection and GitHub access."
    exit 1
fi

echo "✅ Clone successful"

# Change to project directory
cd aisearchscore
echo "📂 Changed to: $(pwd)"

# Start the application
echo "🚀 Starting AISearchScore application..."
bash start.sh