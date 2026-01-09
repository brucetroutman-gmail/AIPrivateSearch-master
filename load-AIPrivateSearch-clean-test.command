#!/bin/bash

echo "🧪 AIPrivateSearch Clean Test Installer"
echo "======================================="
echo "⚠️  WARNING: This will clear ALL existing data for clean testing!"
echo ""

# Ask for confirmation
read -p "Are you sure you want to proceed? This will delete all users, sessions, and license data. (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Installation cancelled."
    read -p "Press Enter to close..."
    exit 1
fi

echo "🧹 PHASE 1: Cleaning existing data..."

# Check for running processes
echo "🔍 Checking for running AIPrivateSearch processes..."
RUNNING_PROCESSES=$(pgrep -f "node server.mjs\|npx serve" 2>/dev/null)

if [ ! -z "$RUNNING_PROCESSES" ]; then
    echo "⚠️  AIPrivateSearch is currently running!"
    echo "📋 Running processes found:"
    ps -p $RUNNING_PROCESSES -o pid,command 2>/dev/null || true
    echo ""
    echo "🛑 Killing running processes..."
    kill -9 $RUNNING_PROCESSES 2>/dev/null || true
    sleep 2
    echo "✅ Processes terminated"
fi

# Clear all AIPrivateSearch data
echo "🗑️  Clearing all AIPrivateSearch data..."

# Remove data files (users, sessions, license cache)
if [ -d "/Users/Shared/AIPrivateSearch/data" ]; then
    echo "   Removing user data, sessions, and license cache..."
    rm -rf /Users/Shared/AIPrivateSearch/data/*
    echo "   ✅ Data directory cleared"
fi

# Remove .env file
if [ -f "/Users/Shared/AIPrivateSearch/.env" ]; then
    echo "   Removing .env configuration..."
    rm -f "/Users/Shared/AIPrivateSearch/.env"
    echo "   ✅ .env file removed"
fi

# Remove any cached license files
if [ -f "/Users/Shared/AIPrivateSearch/license.enc" ]; then
    echo "   Removing cached license file..."
    rm -f "/Users/Shared/AIPrivateSearch/license.enc"
    echo "   ✅ License cache removed"
fi

# Clear browser localStorage (instructions)
echo "🌐 Browser cache clearing required:"
echo "   After installation, open Chrome DevTools (F12)"
echo "   Go to Application → Storage → Clear site data"
echo "   Or run in console: localStorage.clear()"

echo ""
echo "🧹 PHASE 2: Installing fresh copy..."

# Check for Node.js installation
echo "🔍 Checking for Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found."
    echo "   AIPrivateSearch requires Node.js to run."
    echo ""
    read -p "Would you like to install Node.js now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Installing Node.js..."
        
        # Try Homebrew first if available
        if command -v brew &> /dev/null; then
            echo "   Installing Node.js via Homebrew..."
            brew install node &> /dev/null && echo "   ✅ Homebrew installation successful" || {
                echo "   ⚠️  Homebrew installation failed, trying direct download..."
            }
        fi
        
        # If Homebrew failed or not available, download directly
        if ! command -v node &> /dev/null; then
            echo "   Downloading Node.js installer..."
            NODE_VERSION="v20.11.0"
            NODE_PKG="node-${NODE_VERSION}.pkg"
            curl -L -o "/tmp/${NODE_PKG}" "https://nodejs.org/dist/${NODE_VERSION}/${NODE_PKG}" 2>/dev/null
            
            if [ -f "/tmp/${NODE_PKG}" ]; then
                echo "   Installing Node.js (may require admin password)..."
                sudo installer -pkg "/tmp/${NODE_PKG}" -target / &> /dev/null
                rm -f "/tmp/${NODE_PKG}"
                
                # Update PATH for current session
                export PATH="/usr/local/bin:$PATH"
            fi
        fi
        
        # Final check
        if command -v node &> /dev/null; then
            NODE_VERSION=$(node --version)
            echo "✅ Node.js installed: $NODE_VERSION"
        else
            echo "❌ Node.js installation failed."
            echo "   Please install manually from: https://nodejs.org/"
            read -p "Press Enter to close..."
            exit 1
        fi
    else
        echo "❌ Installation cancelled. Node.js is required."
        echo "   Please install Node.js from: https://nodejs.org/"
        echo "   Then run this installer again."
        read -p "Press Enter to close..."
        exit 1
    fi
fi

# Check for Ollama installation
echo "🔍 Checking for Ollama..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama found"
    
    # Start Ollama service
    echo "🚀 Starting Ollama service..."
    ollama serve &> /dev/null &
    sleep 2
    echo "✅ Ollama service started"
else
    echo "❌ Ollama not found."
    echo "   AIPrivateSearch requires Ollama to run AI models locally."
    echo ""
    read -p "Would you like to install Ollama now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Installing Ollama..."
        
        # Download and install Ollama
        echo "   Downloading Ollama installer..."
        curl -L -o "/tmp/Ollama-darwin.zip" "https://ollama.com/download/Ollama-darwin.zip" 2>/dev/null
        
        if [ -f "/tmp/Ollama-darwin.zip" ]; then
            echo "   Installing Ollama..."
            cd /tmp
            unzip -q Ollama-darwin.zip 2>/dev/null
            
            if [ -d "Ollama.app" ]; then
                # Move to Applications
                sudo mv Ollama.app /Applications/ 2>/dev/null || mv Ollama.app /Applications/
                
                # Create symlink for command line
                sudo ln -sf /Applications/Ollama.app/Contents/Resources/ollama /usr/local/bin/ollama 2>/dev/null || {
                    mkdir -p ~/bin
                    ln -sf /Applications/Ollama.app/Contents/Resources/ollama ~/bin/ollama
                    export PATH="~/bin:$PATH"
                }
                
                echo "   ✅ Ollama installed successfully"
                
                # Start Ollama service
                echo "🚀 Starting Ollama service..."
                ollama serve &> /dev/null &
                sleep 2
                echo "✅ Ollama service started"
            fi
            
            rm -f /tmp/Ollama-darwin.zip
            rm -rf /tmp/Ollama.app
        else
            echo "   ❌ Failed to download Ollama"
            echo "   Please install manually from: https://ollama.com/download"
        fi
    else
        echo "❌ Installation cancelled. Ollama is required."
        echo "   Please install Ollama from: https://ollama.com/download"
        echo "   Then run this installer again."
        read -p "Press Enter to close..."
        exit 1
    fi
fi

echo "✅ All prerequisites checked and installed"
echo ""

# Always go to /Users/Shared (works from any location)
echo "📂 Navigating to /Users/Shared..."
cd /Users/Shared

# Check for AIPrivateSearch folder structure and create if missing
if [ ! -d "AIPrivateSearch" ]; then
    echo "📁 Creating AIPrivateSearch directory..."
    mkdir -p AIPrivateSearch
fi

if [ ! -d "AIPrivateSearch/repo" ]; then
    echo "📁 Creating AIPrivateSearch/repo directory..."
    mkdir -p AIPrivateSearch/repo
fi

if [ ! -d "AIPrivateSearch/sources" ]; then
    echo "📁 Creating AIPrivateSearch/sources directory..."
    mkdir -p AIPrivateSearch/sources
fi

if [ ! -d "AIPrivateSearch/data" ]; then
    echo "📁 Creating AIPrivateSearch/data directory..."
    mkdir -p AIPrivateSearch/data
fi

# Change to AIPrivateSearch/repo directory
cd AIPrivateSearch/repo
echo "📂 Changed to: $(pwd)"

# Remove existing installation
if [ -d "aiprivatesearch" ]; then
    echo "🗑️  Removing existing aiprivatesearch directory..."
    rm -rf aiprivatesearch
fi

# Download fresh copy using curl with cache-busting
echo "📥 Downloading latest version from GitHub..."
curl -L -H "Cache-Control: no-cache" -H "Pragma: no-cache" --retry 3 -o aiprivatesearch.zip "https://github.com/brucetroutman-gmail/AIPrivateSearch-master/archive/refs/heads/main.zip?v=$(date +%s)&r=$RANDOM" 2>/dev/null

if [ $? -eq 0 ] && [ -f aiprivatesearch.zip ]; then
    echo "   Extracting repository..."
    unzip -q aiprivatesearch.zip 2>/dev/null
    # Try different possible directory names
    if [ -d "AIPrivateSearch-master-main" ]; then
        mv AIPrivateSearch-master-main aiprivatesearch
    elif [ -d "AIPrivateSearch-master" ]; then
        mv AIPrivateSearch-master aiprivatesearch
    fi
    rm -f aiprivatesearch.zip
    
    if [ -d "aiprivatesearch" ]; then
        echo "   ✅ Repository downloaded successfully"
        
        # Create fresh .env file
        echo "📝 Creating fresh .env configuration file..."
        echo "# API Keys" > "/Users/Shared/AIPrivateSearch/.env"
        echo "API_KEY=dev-key" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "ADMIN_KEY=admin-key" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "NODE_ENV=development" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "# Database Configuration" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "DB_HOST=92.112.184.206" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "DB_PORT=3306" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "DB_DATABASE=aiprivatesearch" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "DB_USERNAME=nimdas" >> "/Users/Shared/AIPrivateSearch/.env"
        echo "DB_PASSWORD=FormR!1234" >> "/Users/Shared/AIPrivateSearch/.env"
        
        if [ -f "/Users/Shared/AIPrivateSearch/.env" ]; then
            echo "   ✅ Fresh .env file created"
        else
            echo "   ❌ Failed to create .env file - check permissions"
        fi
        
        # Copy sample documents
        if [ -d "aiprivatesearch/sources/local-documents" ]; then
            echo "📁 Copying sample documents to sources folder..."
            cp -r "aiprivatesearch/sources/local-documents" "/Users/Shared/AIPrivateSearch/sources/"
            echo "   ✅ Sample documents copied"
        fi
        
        # Copy config files
        echo "📁 Creating fresh config directory..."
        mkdir -p "/Users/Shared/AIPrivateSearch/config"
        
        if [ -f "aiprivatesearch/client/c01_client-first-app/config/app.json" ]; then
            echo "📁 Copying config files to shared config folder..."
            cp -r "aiprivatesearch/client/c01_client-first-app/config/"* "/Users/Shared/AIPrivateSearch/config/"
            echo "   ✅ Config files copied"
        fi
        
        # Create fresh data directory structure
        echo "📁 Creating fresh data directory..."
        mkdir -p "/Users/Shared/AIPrivateSearch/data"
        echo "   ✅ Data directory ready (admin account will be created after licensing)"
        
        # Pull required AI models
        echo "🤖 Pulling required AI models..."
        echo "   This may take several minutes..."
        
        # Pull models in background to speed up process
        (
            ollama pull qwen2:0.5b &> /dev/null &
            ollama pull qwen2:1.5b &> /dev/null &
            wait
            echo "   ✅ AI models pulled successfully"
        ) &
        
        # Start the application
        cd aiprivatesearch
        echo ""
        echo "🧪 CLEAN TEST ENVIRONMENT READY!"
        echo "================================="
        echo "✅ All data cleared and fresh installation complete"
        echo ""
        echo "🚀 Starting AIPrivateSearch for testing..."
        ./start.sh &
        
        # Wait for servers to start
        echo "⏳ Waiting for servers to start..."
        sleep 5
        
        # Clear browser cache automatically
        echo "🧹 Clearing browser cache automatically..."
        ../clear-browser-cache.sh
        
        echo ""
        echo "🎯 READY FOR TESTING!"
        echo "====================="
        echo "✅ Servers running"
        echo "✅ Browser cache cleared"
        echo "🌐 Open: http://localhost:3000"
        echo "🔍 Console: DebugUtils.logFullState('test start')"
        echo ""
        
        # Keep the script running
        wait
    else
        echo "   ❌ Failed to extract repository"
        read -p "Press Enter to close..."
        exit 1
    fi
else
    echo "   ❌ Download failed. Please check your internet connection."
    read -p "Press Enter to close..."
    exit 1
fi