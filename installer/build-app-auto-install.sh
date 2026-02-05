#!/bin/bash

# AIPrivateSearch .app Bundle Builder - With Auto-Install Prerequisites
# This version includes automatic installation of Node.js, Ollama, Chrome, etc.

set -e

# Auto-increment version
VERSION_FILE="./installer-version.txt"
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
    NEW_VERSION=$(echo "$CURRENT_VERSION + 0.1" | bc)
else
    NEW_VERSION="2.9"
fi
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "🏗️  Building AIPrivateSearch.app Bundle (Auto-Install Version)"
echo "Version: $NEW_VERSION"
echo "=============================================================="

APP_NAME="AIPrivateSearch"
VERSION="1.0.0"
BUNDLE_ID="com.aiprivatesearch.app"
BUILD_DIR="./build"
APP_DIR="$BUILD_DIR/$APP_NAME.app"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"

# Create app bundle structure
echo "📁 Creating app bundle structure..."
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Create Info.plist
echo "📝 Creating Info.plist..."
cat > "$APP_DIR/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>AIPrivateSearch</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.aiprivatesearch.app</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>AIPrivateSearch</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppleEventsUsageDescription</key>
    <string>AIPrivateSearch needs to control Chrome browser for search functionality.</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF

# Create main launcher script - simplified
echo "📝 Creating simplified launcher script..."
cat > "$APP_DIR/Contents/MacOS/$APP_NAME" << LAUNCHER_EOF
#!/bin/bash

# AIPrivateSearch Simple Test Installer
APP_SUPPORT="/Users/Shared/AIPrivateSearch"
LOG_FILE="\$APP_SUPPORT/logs/install.log"
INSTALLER_VERSION="$NEW_VERSION"

# Create directories
mkdir -p "\$APP_SUPPORT"/{logs,data,sources,config,repo}

# Redirect output to log
exec 1> >(tee -a "\$LOG_FILE")
exec 2>&1

echo "=== AIPrivateSearch Simple Test Starting at \$(date) ==="
echo "Installer Version: \$INSTALLER_VERSION"
echo ""

# Function to show dialog
show_dialog() {
    local title="\$1"
    local message="\$2"
    local type="\${3:-informational}"
    
    osascript <<-APPLESCRIPT 2>/dev/null || echo "\$message"
        tell application "System Events"
            activate
            display dialog "\$message" with title "\$title" buttons {"OK"} default button "OK" with icon \$type
        end tell
APPLESCRIPT
}

# Show welcome dialog
show_dialog "AIPrivateSearch Installer v\$INSTALLER_VERSION" \\
    "Welcome to AIPrivateSearch Simple Test!

Installer Version: \$INSTALLER_VERSION

This will test Mac architecture detection.

Click OK to continue." \\
    "note"

echo "🚀 Starting architecture detection test..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔄 Step 1: Mac Info Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Hardware architecture detection (bypass Rosetta)
echo "🔍 Detecting Mac architecture and system info..."

# Get actual hardware architecture
HW_ARCH=\$(sysctl -n hw.optional.arm64 2>/dev/null)
ARCH=\$(uname -m)
echo "🔍 Raw uname -m result: '\$ARCH'"
echo "🔍 Hardware ARM64 support: \$HW_ARCH"

if [ "\$HW_ARCH" = "1" ]; then
    NODE_ARCH="arm64"
    echo "✅ Apple Silicon detected (M1/M2/M3/M4) - bypassed Rosetta"
elif [ "\$ARCH" = "arm64" ]; then
    NODE_ARCH="arm64"
    echo "✅ Apple Silicon detected (M1/M2/M3/M4)"
elif [ "\$ARCH" = "x86_64" ]; then
    NODE_ARCH="x64"
    echo "✅ Intel Mac detected"
else
    echo "⚠️ Unknown architecture: \$ARCH, defaulting to x64"
    NODE_ARCH="x64"
fi

# macOS version
MACOS_VERSION=\$(sw_vers -productVersion)
echo "🍎 macOS Version: \$MACOS_VERSION"

# Hardware model
if command -v system_profiler &> /dev/null; then
    MODEL=\$(system_profiler SPHardwareDataType | grep "Model Name" | awk -F': ' '{print \$2}')
    echo "💻 Model: \$MODEL"
fi

# Node.js URL
NODE_VERSION="v20.11.0"
NODE_TAR="node-\${NODE_VERSION}-darwin-\${NODE_ARCH}.tar.gz"
NODE_URL="https://nodejs.org/dist/\${NODE_VERSION}/\${NODE_TAR}"

echo "📦 Node.js target: \$NODE_TAR"
echo "🌐 Download URL: \$NODE_URL"

echo "✅ Mac info detection completed successfully"

echo ""
echo "✅ Step 1 completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 Step 2: Node.js Installation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Node.js already installed in our custom location
if [ -f "\$APP_SUPPORT/node/bin/node" ]; then
    CURRENT_NODE=\$("\$APP_SUPPORT/node/bin/node" --version)
    echo "✅ Node.js already installed: \$CURRENT_NODE"
    echo "Skipping Node.js installation"
else
    echo "📥 Installing Node.js \$NODE_VERSION for \$NODE_ARCH..."
    
    cd "\$APP_SUPPORT"
    
    # Download Node.js
    echo "🌐 Downloading: \$NODE_URL"
    if curl -L -o "\$NODE_TAR" "\$NODE_URL"; then
        echo "✅ Download completed"
        
        # Extract to user directory (no sudo needed)
        echo "📦 Extracting Node.js..."
        tar -xzf "\$NODE_TAR"
        
        # Move to user-accessible location
        NODE_DIR="node-\${NODE_VERSION}-darwin-\${NODE_ARCH}"
        if [ -d "\$NODE_DIR" ]; then
            mv "\$NODE_DIR" "\$APP_SUPPORT/node"
            
            # Add to PATH for this session
            export PATH="\$APP_SUPPORT/node/bin:\$PATH"
            
            echo "✅ Node.js installed to: \$APP_SUPPORT/node"
            
            # Verify installation
            if "\$APP_SUPPORT/node/bin/node" --version; then
                echo "✅ Node.js verification successful"
            else
                echo "❌ Node.js verification failed"
            fi
        else
            echo "❌ Extraction failed - directory not found"
        fi
        
        # Cleanup
        rm -f "\$NODE_TAR"
    else
        echo "❌ Download failed"
    fi
fi

echo "✅ Step 2 completed!"
echo ""
echo "🎉 Node.js installation test completed!"
echo "Next: Add remaining installation steps"

show_dialog "Step 2 Complete" \\
    "Node.js installation completed!

Check the log for details:
\$LOG_FILE

Next: Add Ollama and app setup" \\
    "note"
LAUNCHER_EOF

chmod +x "$APP_DIR/Contents/MacOS/$APP_NAME"

# Create placeholder icon
echo "🎨 Creating placeholder icon..."
touch "$APP_DIR/Contents/Resources/AppIcon.icns"

echo ""
echo "✅ App bundle created successfully!"
echo "📁 Location: $APP_DIR"
echo ""
echo "Next steps:"
echo "1. Test the application: open $APP_DIR"
echo "2. Build PKG: ./build-pkg-auto-install.sh"
echo "3. Build DMG: ./build-dmg.sh"
echo ""