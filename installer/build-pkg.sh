#!/bin/bash

# AIPrivateSearch PKG Installer Builder
# This script creates a professional macOS .pkg installer

set -e

echo "📦 Building AIPrivateSearch.pkg Installer"
echo "=========================================="

PKG_NAME="AIPrivateSearch"
VERSION="1.0.0"
IDENTIFIER="com.aiprivatesearch.installer"
BUILD_DIR="./build-pkg"
PKG_ROOT="$BUILD_DIR/root"
SCRIPTS_DIR="$BUILD_DIR/scripts"
RESOURCES_DIR="$BUILD_DIR/resources"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
rm -f "$PKG_NAME-$VERSION.pkg"

# Create directory structure
echo "📁 Creating package structure..."
mkdir -p "$PKG_ROOT/Applications"
mkdir -p "$SCRIPTS_DIR"
mkdir -p "$RESOURCES_DIR"

# Copy the .app bundle (assume it's already built)
if [ -d "./build/AIPrivateSearch.app" ]; then
    echo "📋 Copying AIPrivateSearch.app..."
    cp -R "./build/AIPrivateSearch.app" "$PKG_ROOT/Applications/"
else
    echo "⚠️  Warning: AIPrivateSearch.app not found. Run build-app.sh first."
    echo "Creating placeholder for demonstration..."
    mkdir -p "$PKG_ROOT/Applications/AIPrivateSearch.app/Contents/MacOS"
fi

# Create preinstall script
echo "📝 Creating preinstall script..."
cat > "$SCRIPTS_DIR/preinstall" << 'EOF'
#!/bin/bash

# Preinstall script - runs before installation

echo "=== AIPrivateSearch Preinstall ==="

# Check for running processes
if pgrep -f "AIPrivateSearch" > /dev/null; then
    osascript <<-APPLESCRIPT
        tell application "System Events"
            display dialog "AIPrivateSearch is currently running. Please quit the application before installing." with title "Installation Error" buttons {"OK"} default button "OK" with icon stop
        end tell
APPLESCRIPT
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    osascript <<-APPLESCRIPT
        tell application "System Events"
            set response to display dialog "Node.js is required but not installed.

Would you like to open the download page after this installation?" with title "Node.js Required" buttons {"Continue", "Open Download Page"} default button "Continue"
            if button returned of response is "Open Download Page" then
                do shell script "open https://nodejs.org/en/download/"
            end if
        end tell
APPLESCRIPT
fi

# Check for Ollama
if ! command -v ollama &> /dev/null; then
    osascript <<-APPLESCRIPT
        tell application "System Events"
            set response to display dialog "Ollama is required but not installed.

Would you like to open the download page after this installation?" with title "Ollama Required" buttons {"Continue", "Open Download Page"} default button "Continue"
            if button returned of response is "Open Download Page" then
                do shell script "open https://ollama.com/download"
            end if
        end tell
APPLESCRIPT
fi

# Backup existing configuration if present
USER_HOME=$(eval echo ~$USER)
CONFIG_DIR="$USER_HOME/.config/aiprivatesearch"
if [ -d "$CONFIG_DIR" ]; then
    echo "Backing up existing configuration..."
    BACKUP_DIR="$CONFIG_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    cp -R "$CONFIG_DIR" "$BACKUP_DIR"
    echo "Backup created at: $BACKUP_DIR"
fi

exit 0
EOF

chmod +x "$SCRIPTS_DIR/preinstall"

# Create postinstall script
echo "📝 Creating postinstall script..."
cat > "$SCRIPTS_DIR/postinstall" << 'EOF'
#!/bin/bash

# Postinstall script - runs after installation

echo "=== AIPrivateSearch Postinstall ==="

# Get the user who ran the installer (not root)
CURRENT_USER="${USER}"
if [ "$CURRENT_USER" = "root" ]; then
    CURRENT_USER=$(stat -f "%Su" /dev/console)
fi

USER_HOME=$(eval echo ~$CURRENT_USER)

# Create necessary directories
echo "Creating application directories..."
APP_SUPPORT="$USER_HOME/Library/Application Support/AIPrivateSearch"
CONFIG_DIR="$USER_HOME/.config/aiprivatesearch"

mkdir -p "$APP_SUPPORT"/{logs,data,sources/local-documents,config}
mkdir -p "$CONFIG_DIR"

# Create default configuration
if [ ! -f "$CONFIG_DIR/.env" ]; then
    echo "Creating default configuration..."
    cat > "$CONFIG_DIR/.env" << 'ENVEOF'
# AIPrivateSearch Configuration
# Generated during installation

NODE_ENV=production
API_KEY=dev-key
ADMIN_KEY=admin-key

# Default admin credentials (CHANGE THESE!)
DEFAULT_ADMIN_EMAIL=admin@localhost
DEFAULT_ADMIN_PASSWORD=changeme123

# Database configuration (optional - leave empty for local-only mode)
DB_HOST=
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
ENVEOF
    
    chown "$CURRENT_USER" "$CONFIG_DIR/.env"
    chmod 600 "$CONFIG_DIR/.env"
fi

# Set proper ownership
chown -R "$CURRENT_USER" "$APP_SUPPORT"
chown -R "$CURRENT_USER" "$CONFIG_DIR"

# Create launch agent (optional - for auto-start)
# Commented out by default
# LAUNCH_AGENTS="$USER_HOME/Library/LaunchAgents"
# mkdir -p "$LAUNCH_AGENTS"
# cat > "$LAUNCH_AGENTS/com.aiprivatesearch.app.plist" << 'PLISTEOF'
# <?xml version="1.0" encoding="UTF-8"?>
# <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
# <plist version="1.0">
# <dict>
#     <key>Label</key>
#     <string>com.aiprivatesearch.app</string>
#     <key>ProgramArguments</key>
#     <array>
#         <string>/Applications/AIPrivateSearch.app/Contents/MacOS/AIPrivateSearch</string>
#     </array>
#     <key>RunAtLoad</key>
#     <false/>
# </dict>
# </plist>
# PLISTEOF

echo "Installation completed successfully!"

# Show completion dialog
osascript <<-APPLESCRIPT
    tell application "System Events"
        display dialog "AIPrivateSearch has been installed successfully!

Location: /Applications/AIPrivateSearch.app

Next steps:
1. Install Node.js if you haven't already (https://nodejs.org/)
2. Install Ollama (https://ollama.com/)
3. Launch AIPrivateSearch from Applications

Configuration file: ~/.config/aiprivatesearch/.env" with title "Installation Complete" buttons {"OK"} default button "OK"
    end tell
APPLESCRIPT

exit 0
EOF

chmod +x "$SCRIPTS_DIR/postinstall"

# Create Welcome.txt
echo "📝 Creating welcome document..."
cat > "$RESOURCES_DIR/Welcome.txt" << 'EOF'
Welcome to AIPrivateSearch!
===========================

Thank you for installing AIPrivateSearch - your private, local AI-powered search assistant.

What is AIPrivateSearch?
------------------------
AIPrivateSearch runs entirely on your Mac, using local AI models to search and analyze your documents while keeping all your data private and secure.

Prerequisites:
--------------
Before using AIPrivateSearch, please ensure you have:

1. Node.js (v16 or later)
   Download: https://nodejs.org/

2. Ollama (for local AI models)
   Download: https://ollama.com/

Installation Location:
---------------------
Application: /Applications/AIPrivateSearch.app
Configuration: ~/.config/aiprivatesearch/
Data: ~/Library/Application Support/AIPrivateSearch/

Getting Started:
---------------
1. Install the prerequisites above if you haven't already
2. Launch AIPrivateSearch from your Applications folder
3. Follow the setup wizard
4. Configure your settings in ~/.config/aiprivatesearch/.env

Documentation:
-------------
For more information, visit:
https://github.com/yourusername/aiprivatesearch

Support:
--------
If you encounter any issues, please:
1. Check the log file: ~/Library/Application Support/AIPrivateSearch/logs/app.log
2. Visit our GitHub issues page
3. Contact support

Privacy:
--------
AIPrivateSearch respects your privacy:
- All processing happens locally on your Mac
- No data is sent to external servers (unless you configure it)
- You have full control over your data

Version: 1.0.0
EOF

# Create Distribution.xml for customization
echo "📝 Creating distribution definition..."
cat > "$BUILD_DIR/Distribution.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>AIPrivateSearch</title>
    <organization>com.aiprivatesearch</organization>
    <domains enable_localSystem="true"/>
    <options customize="never" require-scripts="true" rootVolumeOnly="true" />
    
    <welcome file="Welcome.txt" mime-type="text/plain" />
    
    <pkg-ref id="com.aiprivatesearch.app">
        <bundle-version/>
    </pkg-ref>
    
    <options customize="never" require-scripts="false"/>
    
    <choices-outline>
        <line choice="default">
            <line choice="com.aiprivatesearch.app"/>
        </line>
    </choices-outline>
    
    <choice id="default"/>
    
    <choice id="com.aiprivatesearch.app" visible="false">
        <pkg-ref id="com.aiprivatesearch.app"/>
    </choice>
    
    <pkg-ref id="com.aiprivatesearch.app" version="1.0.0" onConclusion="none">
        AIPrivateSearch.pkg
    </pkg-ref>
    
</installer-gui-script>
EOF

# Build the component package
echo "🔨 Building component package..."
pkgbuild \
    --root "$PKG_ROOT" \
    --identifier "$IDENTIFIER" \
    --version "$VERSION" \
    --scripts "$SCRIPTS_DIR" \
    --install-location "/" \
    "$BUILD_DIR/AIPrivateSearch-component.pkg"

# Build the product (distribution) package
echo "🔨 Building distribution package..."
productbuild \
    --distribution "$BUILD_DIR/Distribution.xml" \
    --resources "$RESOURCES_DIR" \
    --package-path "$BUILD_DIR" \
    "$PKG_NAME-$VERSION.pkg"

echo ""
echo "✅ Package created successfully!"
echo "📦 Location: $PKG_NAME-$VERSION.pkg"
echo ""
echo "Next steps:"
echo "1. Test the installer on a clean system"
echo "2. Sign the package for distribution (optional but recommended):"
echo "   productsign --sign 'Developer ID Installer: Your Name' \\"
echo "     $PKG_NAME-$VERSION.pkg $PKG_NAME-$VERSION-signed.pkg"
echo "3. Notarize the package with Apple (for distribution outside the App Store)"
echo ""
echo "To install: Double-click $PKG_NAME-$VERSION.pkg"
echo ""
