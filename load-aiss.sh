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