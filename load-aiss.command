#!/bin/bash

echo "🔄 AISearchScore One-Click Installer"
echo "===================================="

# Check if Git and command line developer tools are installed
echo "🔍 Checking Git and command line developer tools installation..."

# Function to check if command line developer tools are installed
check_command_line_tools() {
    # Check for common command line tools without using xcode-select
    if [ -f "/usr/bin/git" ] || [ -f "/Library/Developer/CommandLineTools/usr/bin/git" ]; then
        return 0
    fi
    return 1
}

# Check if command line developer tools are installed
if ! check_command_line_tools; then
    echo "❌ Command line developer tools not found."
    echo "   These tools include Git, make, and other development utilities."
    echo ""
    read -p "Would you like to install command line developer tools now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Installing command line developer tools..."
        
        # Try automatic installation first
        echo "⬇️  Attempting automatic installation..."
        touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
        
        PROD=$(softwareupdate -l 2>/dev/null | grep "Command Line Tools" | tail -1 | awk -F"*" '{print $2}' | sed 's/^ *//' | tr -d '\n')
        
        if [ -n "$PROD" ]; then
            echo "   Installing: $PROD"
            softwareupdate -i "$PROD" --verbose 2>/dev/null || {
                echo "   Automatic installation failed, triggering manual dialog..."
                rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
                xcode-select --install 2>/dev/null || true
            }
        else
            echo "   No automatic installer found, triggering manual dialog..."
            rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
            xcode-select --install 2>/dev/null || true
        fi
        
        echo "⚠️  Please complete the installation in the dialog that appeared."
        echo "⏳ Waiting for installation to complete..."
        
        # Wait for installation
        TIMEOUT=600
        ELAPSED=0
        
        while ! check_command_line_tools && [ $ELAPSED -lt $TIMEOUT ]; do
            sleep 10
            ELAPSED=$((ELAPSED + 10))
            echo "   Still waiting... (${ELAPSED}s elapsed)"
        done
        
        rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
        
        if ! check_command_line_tools; then
            echo "❌ Installation failed or incomplete."
            echo "   Please install manually: System Preferences > Software Update"
            echo "   Or run: xcode-select --install"
            read -p "Press Enter to close..."
            exit 1
        fi
        
        echo "✅ Command line developer tools installed successfully"
    else
        echo "❌ Installation cancelled. Command line tools are required."
        echo "   Please install manually: System Preferences > Software Update"
        echo "   Or run: xcode-select --install"
        echo "   Then run this installer again."
        read -p "Press Enter to close..."
        exit 1
    fi
else
    echo "✅ Command line developer tools already installed"
fi

echo ""
echo "📋 System Check Complete"
echo "   ✅ Command line developer tools: Ready"
if [ -n "$GIT_COMMAND" ]; then
    echo "   ✅ Git: Ready ($GIT_VERSION)"
else
    echo "   ⚠️  Git: Will use alternative download method"
fi
echo ""
read -p "Press Enter to continue with dependency checks..."

# Verify Git is available and functional
echo "🔍 Verifying Git functionality..."

# Debug: Show current PATH
echo "   Current PATH: $PATH"

# Try to find Git in common locations
GIT_PATHS=(
    "/usr/bin/git"
    "/Library/Developer/CommandLineTools/usr/bin/git"
    "/Applications/Xcode.app/Contents/Developer/usr/bin/git"
)

GIT_COMMAND=""
for git_path in "${GIT_PATHS[@]}"; do
    echo "   Checking: $git_path"
    if [ -f "$git_path" ]; then
        echo "   File exists, testing functionality..."
        if "$git_path" --version &> /dev/null; then
            echo "✅ Git found and functional at: $git_path"
            GIT_COMMAND="$git_path"
            # Add to PATH if not already there
            if ! echo "$PATH" | grep -q "$(dirname "$git_path")"; then
                export PATH="$(dirname "$git_path"):$PATH"
                echo "   Added $(dirname "$git_path") to PATH"
            fi
            break
        else
            echo "   File exists but not functional"
        fi
    else
        echo "   File does not exist"
    fi
done

# If no git found, try to proceed anyway with system git
if [ -z "$GIT_COMMAND" ]; then
    echo "⚠️  Git not found in expected locations, trying system git..."
    if command -v git &> /dev/null; then
        GIT_COMMAND="git"
        echo "✅ System git found"
    else
        echo "❌ No Git available. Attempting to continue with curl download..."
        GIT_COMMAND=""
    fi
fi

if [ -n "$GIT_COMMAND" ]; then
    GIT_VERSION=$($GIT_COMMAND --version 2>/dev/null || echo "unknown")
    echo "✅ Git is ready: $GIT_VERSION"
else
    echo "⚠️  Will attempt alternative download method"
fi

echo ""

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
if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Safari.app" ] || [ -d "/Applications/Firefox.app" ]; then
    echo "✅ Web browser found"
else
    echo "❌ No web browser found."
    echo "   AISearchScore works best with Chrome, but any modern browser will work."
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
            hdiutil attach "/tmp/googlechrome.dmg" -quiet -nobrowse
            
            # Copy Chrome to Applications
            cp -R "/Volumes/Google Chrome/Google Chrome.app" "/Applications/" 2>/dev/null
            
            # Unmount the DMG
            hdiutil detach "/Volumes/Google Chrome" -quiet
            
            # Clean up
            rm -f "/tmp/googlechrome.dmg"
            
            if [ -d "/Applications/Google Chrome.app" ]; then
                echo "   ✅ Chrome installed successfully"
            else
                echo "   ⚠️  Chrome installation may have failed"
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

# Clone fresh copy
echo "📥 Downloading fresh copy from GitHub..."

CLONE_SUCCESS=1

# Try Git first if available
if [ -n "$GIT_COMMAND" ]; then
    echo "   Attempting Git clone..."
    $GIT_COMMAND clone https://github.com/brucetroutman-gmail/AISearchScore-master.git aisearchscore 2>/dev/null
    CLONE_SUCCESS=$?
    if [ $CLONE_SUCCESS -ne 0 ]; then
        echo "   Git clone failed, trying curl fallback..."
    fi
fi

# Fallback to curl if Git failed or wasn't available
if [ $CLONE_SUCCESS -ne 0 ]; then
    echo "   Using curl to download repository..."
    curl -L -o aisearchscore.zip https://github.com/brucetroutman-gmail/AISearchScore-master/archive/refs/heads/main.zip 2>/dev/null
    if [ $? -eq 0 ] && [ -f aisearchscore.zip ]; then
        echo "   Extracting repository..."
        unzip -q aisearchscore.zip 2>/dev/null
        # Try different possible directory names
        if [ -d "AISearchScore-master-main" ]; then
            mv AISearchScore-master-main aisearchscore
        elif [ -d "AISearchScore-master" ]; then
            mv AISearchScore-master aisearchscore
        fi
        rm -f aisearchscore.zip
        
        if [ -d "aisearchscore" ]; then
            CLONE_SUCCESS=0
            echo "   ✅ Repository downloaded successfully"
        else
            echo "   ❌ Failed to extract repository"
        fi
    else
        echo "   ❌ Curl download failed"
    fi
fi

if [ $CLONE_SUCCESS -ne 0 ]; then
    echo "❌ Download failed. Please check your internet connection."
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