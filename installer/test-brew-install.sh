#!/bin/bash

# Simple Homebrew Test Installer
# Debug why Homebrew installation is failing

echo "🧪 Testing Homebrew Installation"
echo "================================"

# Check if Homebrew exists
if command -v brew &> /dev/null; then
    echo "✅ Homebrew already installed: $(brew --version | head -1)"
    exit 0
fi

echo "❌ Homebrew not found, installing..."

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo "💻 Apple Silicon detected"
    BREW_PREFIX="/opt/homebrew"
else
    echo "💻 Intel Mac detected"  
    BREW_PREFIX="/usr/local"
fi

echo "📦 Downloading Homebrew installer..."
echo "This will require admin password and may take several minutes..."

# Install Homebrew with verbose output
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Check if installation worked
if [ -x "$BREW_PREFIX/bin/brew" ]; then
    echo "✅ Homebrew installed at $BREW_PREFIX/bin/brew"
    
    # Add to PATH
    export PATH="$BREW_PREFIX/bin:$PATH"
    
    # Test brew command
    if command -v brew &> /dev/null; then
        echo "✅ Homebrew command working: $(brew --version | head -1)"
        
        # Test Node.js installation
        echo "🍺 Testing Node.js installation..."
        if brew install node; then
            echo "✅ Node.js installed successfully"
            node --version
        else
            echo "❌ Node.js installation failed"
        fi
    else
        echo "❌ Homebrew command not found in PATH"
        echo "PATH: $PATH"
    fi
else
    echo "❌ Homebrew installation failed"
    echo "Expected location: $BREW_PREFIX/bin/brew"
    ls -la "$BREW_PREFIX/bin/" 2>/dev/null || echo "Directory does not exist"
fi

echo "🏁 Test complete"