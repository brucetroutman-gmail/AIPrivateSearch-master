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

# Check for Node.js installation
echo "🔍 Checking for Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found."
    echo "   AISearchScore requires Node.js to run."
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
else
    echo "❌ Ollama not found."
    echo "   AISearchScore requires Ollama to run AI models locally."
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

# Check for Chrome installation
echo "🔍 Checking for Chrome browser..."
if [ -d "/Applications/Google Chrome.app" ]; then
    echo "✅ Chrome browser found"
else
    echo "❌ Chrome browser not found."
    echo "   AISearchScore requires Chrome browser for optimal performance."
    echo ""
    read -p "Would you like to install Chrome now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Installing Chrome..."
        
        # Download and install Chrome
        echo "   Downloading Chrome installer..."
        curl -L -o "/tmp/googlechrome.dmg" "https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg" 2>/dev/null
        
        if [ -f "/tmp/googlechrome.dmg" ]; then
            echo "   Installing Chrome..."
            
            # Mount the DMG
            if hdiutil attach "/tmp/googlechrome.dmg" -quiet -nobrowse 2>/dev/null; then
                # Copy Chrome to Applications with proper permissions
                if sudo cp -R "/Volumes/Google Chrome/Google Chrome.app" "/Applications/" 2>/dev/null || \
                   cp -R "/Volumes/Google Chrome/Google Chrome.app" "/Applications/" 2>/dev/null; then
                    
                    # Unmount the DMG
                    hdiutil detach "/Volumes/Google Chrome" -quiet 2>/dev/null
                    
                    # Clean up
                    rm -f "/tmp/googlechrome.dmg"
                    
                    if [ -d "/Applications/Google Chrome.app" ]; then
                        echo "   ✅ Chrome installed successfully"
                        # Fix permissions
                        sudo chown -R root:admin "/Applications/Google Chrome.app" 2>/dev/null || true
                    else
                        echo "   ⚠️  Chrome installation verification failed"
                    fi
                else
                    echo "   ❌ Failed to copy Chrome to Applications"
                    echo "   Please check permissions or install manually"
                    hdiutil detach "/Volumes/Google Chrome" -quiet 2>/dev/null
                    rm -f "/tmp/googlechrome.dmg"
                fi
            else
                echo "   ❌ Failed to mount Chrome installer"
                rm -f "/tmp/googlechrome.dmg"
            fi
        else
            echo "   ❌ Failed to download Chrome"
            echo "   Please install manually from: https://www.google.com/chrome/"
        fi
    else
        echo "⚠️  Continuing without Chrome installation."
        echo "   You can use any web browser to access the application."
    fi
fi

echo "✅ All prerequisites checked and installed"
echo ""

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

# Download fresh copy using curl with cache-busting
echo "📥 Downloading latest version from GitHub..."
curl -L -H "Cache-Control: no-cache" -H "Pragma: no-cache" --retry 3 -o aisearchscore.zip "https://github.com/brucetroutman-gmail/aisearchscore-master/archive/refs/heads/main.zip?v=$(date +%s)&r=$RANDOM"

if [ $? -eq 0 ] && [ -f aisearchscore.zip ]; then
    echo "   Extracting repository..."
    unzip -q aisearchscore.zip 2>/dev/null
    # Try different possible directory names
    if [ -d "aisearchscore-master-main" ]; then
        mv aisearchscore-master-main aisearchscore
    elif [ -d "aisearchscore-master" ]; then
        mv aisearchscore-master aisearchscore
    fi
    rm -f aisearchscore.zip
    
    if [ -d "aisearchscore" ]; then
        echo "   ✅ Repository downloaded successfully"
        
        # Delete existing .env file and create new one
        if [ -f "/Users/Shared/.env" ]; then
            echo "🗑️  Removing existing .env file..."
            rm -f "/Users/Shared/.env"
        fi
        
        echo "📝 Creating .env configuration file..."
        echo "# API Keys" > "/Users/Shared/.env"
        echo "API_KEY=dev-key" >> "/Users/Shared/.env"
        echo "ADMIN_KEY=admin-key" >> "/Users/Shared/.env"
        echo "NODE_ENV=development" >> "/Users/Shared/.env"
        echo "" >> "/Users/Shared/.env"
        echo "# Database Configuration" >> "/Users/Shared/.env"
        echo "DB_HOST=92.112.184.206" >> "/Users/Shared/.env"
        echo "DB_PORT=3306" >> "/Users/Shared/.env"
        echo "DB_DATABASE=aisearchscore" >> "/Users/Shared/.env"
        echo "DB_USERNAME=nimdas" >> "/Users/Shared/.env"
        echo "DB_PASSWORD=FormR!1234" >> "/Users/Shared/.env"
        
        if [ -f "/Users/Shared/.env" ]; then
            echo "   ✅ .env file created at /Users/Shared/.env"
            echo "   💡 Database configured for remote MySQL server"
        else
            echo "   ❌ Failed to create .env file - check permissions"
        fi
        
        # Start the application
        cd aisearchscore
        echo "🚀 Starting AISearchScore..."
        ./start.sh
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