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

# Check for NVS installation
echo "🔍 Checking for NVS (Node Version Switcher)..."
if [ ! -d "$HOME/.nvs" ]; then
    echo "❌ NVS not found. Installing NVS and Node.js 22..."
    
    # Clone NVS
    git clone https://github.com/jasongin/nvs.git ~/.nvs
    
    # Add to shell configs
    echo 'export NVS_HOME="$HOME/.nvs"' >> ~/.zshrc 2>/dev/null || true
    echo 'export PATH="$NVS_HOME:$PATH"' >> ~/.zshrc 2>/dev/null || true
    echo 'export NVS_HOME="$HOME/.nvs"' >> ~/.bash_profile 2>/dev/null || true
    echo 'export PATH="$NVS_HOME:$PATH"' >> ~/.bash_profile 2>/dev/null || true
    
    # Set up environment for current session
    export NVS_HOME="$HOME/.nvs"
    export PATH="$NVS_HOME:$PATH"
    
    # Install and link Node.js 22
    ~/.nvs/nvs add 22
    ~/.nvs/nvs link 22
    
    echo "✅ NVS and Node.js 22 installed successfully"
else
    echo "✅ NVS found, ensuring Node.js 22 is available..."
    export NVS_HOME="$HOME/.nvs"
    export PATH="$NVS_HOME:$PATH"
    ~/.nvs/nvs add 22 2>/dev/null || true
    ~/.nvs/nvs link 22 2>/dev/null || true
fi

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

# Create shared .env file BEFORE starting the app
echo "🔧 Creating shared .env file..."
cat > /Users/Shared/.env << 'EOF'
# API Keys
API_KEY=dev-key
ADMIN_KEY=admin-key
NODE_ENV=development

# Database Configuration
DB_HOST=92.112.184.206
DB_PORT=3306
DB_DATABASE=aisearchscore
DB_USERNAME=nimdas
DB_PASSWORD=FormR!1234
EOF

echo "✅ Shared .env file created at /Users/Shared/.env"

# Final cleanup before starting
echo "🧹 Final cleanup of any remaining processes..."
pkill -f "node server.mjs" 2>/dev/null || true
pkill -f "npx serve" 2>/dev/null || true
sleep 2

# Start the application
echo "🚀 Starting AISearchScore application..."
bash start.sh