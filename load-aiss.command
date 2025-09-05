#!/bin/bash

echo "🔄 AISearchScore One-Click Installer"
echo "===================================="

# Check for running processes
echo "🔍 Checking for running AISearchScore processes..."
RUNNING_PROCESSES=$(pgrep -f "node server.mjs\|npx serve" 2>/dev/null)

if [ ! -z "$RUNNING_PROCESSES" ]; then
    echo "⚠️  AISearchScore is currently running!"
    echo "📋 Running processes found:"
    ps -p $RUNNING_PROCESSES -o pid,command 2>/dev/null || true
    echo ""
    echo "❌ Please close the running Terminal window with AISearchScore"
    echo "   or press Ctrl+C in that Terminal to stop the servers."
    echo ""
    echo "💡 Then run this installer again."
    echo ""
    read -p "Press Enter to close this installer..."
    exit 1
fi

echo "✅ No running processes detected, proceeding with installation..."

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

# Final cleanup before starting
echo "🧹 Final cleanup of any remaining processes..."
pkill -f "node server.mjs" 2>/dev/null || true
pkill -f "npx serve" 2>/dev/null || true
sleep 2

# Start the application
echo "🚀 Starting AISearchScore application..."
bash start.sh