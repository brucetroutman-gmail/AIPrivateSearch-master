#!/bin/bash

echo "🔄 AISearchScore One-Click Installer"
echo "===================================="

# Always go to /Users/Shared (works from any location)
echo "📂 Navigating to /Users/Shared..."
cd /Users/Shared

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
fi

# Clone fresh copy
echo "📥 Cloning fresh copy from GitHub..."
git clone https://github.com/brucetroutman-gmail/AISearchScore-master.git aisearchscore

if [ $? -ne 0 ]; then
    echo "❌ Git clone failed. Please check your internet connection and GitHub access."
    read -p "Press Enter to close..."
    exit 1
fi

echo "✅ Clone successful"

# Change to project directory
cd aisearchscore
echo "📂 Changed to: $(pwd)"

# Start the application
echo "🚀 Starting AISearchScore application..."
bash start.sh