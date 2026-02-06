#!/bin/bash

# AIPrivateSearch PKG Installer Builder - Auto-Install Version
# Builds installer that automatically installs all prerequisites

set -e

echo "📦 Building AIPrivateSearch.pkg Installer (Auto-Install Version)"
echo "================================================================="

PKG_NAME="aiprivatesearch-installer"
VERSION="1.0.0"
IDENTIFIER="com.aiprivatesearch.installer"
BUILD_DIR="./build-pkg"
PKG_ROOT="$BUILD_DIR/root"
SCRIPTS_DIR="$BUILD_DIR/scripts"
RESOURCES_DIR="$BUILD_DIR/resources"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
rm -f "aiprivatesearch-installer.pkg"

# Create directory structure
echo "📁 Creating package structure..."
mkdir -p "$PKG_ROOT/Applications"
mkdir -p "$SCRIPTS_DIR"
mkdir -p "$RESOURCES_DIR"

# Copy the .app bundle
if [ -d "./build/AIPrivateSearch-installer.app" ]; then
    echo "📋 Copying AIPrivateSearch-installer.app..."
    cp -R "./build/AIPrivateSearch-installer.app" "$PKG_ROOT/Applications/"
else
    echo "⚠️  Warning: AIPrivateSearch-installer.app not found. Run build-app-auto-install.sh first."
    exit 1
fi

# Create preinstall script
echo "📝 Creating preinstall script..."
cat > "$SCRIPTS_DIR/preinstall" << 'EOF'
#!/bin/bash

# Preinstall script - Auto-install version

echo "=== AIPrivateSearch Preinstall ==="

# Check for running processes
if pgrep -f "AIPrivateSearch\|node server.mjs\|npx serve" > /dev/null; then
    osascript <<-APPLESCRIPT
        tell application "System Events"
            display dialog "AIPrivateSearch is currently running. Please quit the application before installing." with title "Installation Error" buttons {"OK"} default button "OK" with icon stop
        end tell
APPLESCRIPT
    exit 1
fi

# Backup existing installation
if [ -d "/Users/Shared/AIPrivateSearch" ]; then
    echo "Backing up existing installation..."
    BACKUP_DIR="/Users/Shared/AIPrivateSearch.backup.$(date +%Y%m%d_%H%M%S)"
    cp -R "/Users/Shared/AIPrivateSearch" "$BACKUP_DIR"
    echo "Backup created at: $BACKUP_DIR"
fi

exit 0
EOF

chmod +x "$SCRIPTS_DIR/preinstall"

# Create postinstall script
echo "📝 Creating postinstall script..."
cat > "$SCRIPTS_DIR/postinstall" << 'EOF'
#!/bin/bash

# Postinstall script - Auto-install version

echo "=== AIPrivateSearch Postinstall ==="

# Create shared directory structure
mkdir -p /Users/Shared/AIPrivateSearch/{logs,data,sources,config,repo}

# Set proper permissions
chmod -R 777 /Users/Shared/AIPrivateSearch

echo "Installation completed successfully!"

# Show completion dialog
osascript <<-APPLESCRIPT
    tell application "System Events"
        display dialog "AIPrivateSearch has been installed successfully!

Location: /Applications/AIPrivateSearch-installer.app

When you launch AIPrivateSearch, it will:
• Automatically install Node.js (if needed)
• Automatically install Ollama (if needed)
• Automatically install Chrome (if needed)
• Download the latest version
• Configure everything for you

The first launch may take several minutes.

Ready to launch AIPrivateSearch?" with title "Installation Complete" buttons {"Not Now", "Launch Now"} default button "Launch Now"
        
        if button returned of result is "Launch Now" then
            do shell script "open -a AIPrivateSearch-installer"
        end if
    end tell
APPLESCRIPT

exit 0
EOF

chmod +x "$SCRIPTS_DIR/postinstall"

# Create Welcome document
echo "📝 Creating welcome document..."
cat > "$RESOURCES_DIR/Welcome.txt" << 'EOF'
Welcome to AIPrivateSearch!
===========================

Thank you for installing AIPrivateSearch - your private, local AI-powered search assistant.

AUTOMATIC INSTALLATION
-----------------------
When you launch AIPrivateSearch for the first time, it will automatically:

1. Install Node.js (if not already installed)
2. Install Ollama for local AI models (if not already installed)
3. Install Chrome browser (if not already installed)
4. Download the latest AIPrivateSearch code
5. Configure everything automatically

This process may take 5-15 minutes depending on your internet connection.

LAUNCHING THE APPLICATION
-------------------------
After installation completes:
1. Open Applications folder
2. Double-click AIPrivateSearch
3. Wait for automatic setup to complete
4. The application will open in your browser automatically

INSTALLATION LOCATION
---------------------
Application: /Applications/AIPrivateSearch.app
Data & Config: /Users/Shared/AIPrivateSearch/
Configuration: /Users/Shared/AIPrivateSearch/.env-aips

DEFAULT CREDENTIALS
-------------------
Email: adm-std@a.com
Password: 123

(You can change these in the configuration file)

SYSTEM REQUIREMENTS
-------------------
- macOS 10.15 (Catalina) or later
- Internet connection (for first-time setup)
- 4GB RAM minimum, 8GB recommended
- 5GB free disk space

WHAT GETS INSTALLED
-------------------
The automatic installer will download and install:
- Node.js v20.11.0 (JavaScript runtime)
- Ollama (for running AI models locally)
- Google Chrome (recommended browser)
- Rosetta (on Apple Silicon Macs, for compatibility)

All installations happen automatically - no user intervention needed!

TROUBLESHOOTING
---------------
Installation logs are saved to:
/Users/Shared/AIPrivateSearch/logs/install.log

If installation fails:
1. Check the log file for errors
2. Ensure you have administrator access
3. Check your internet connection
4. Try launching again

PRIVACY
-------
AIPrivateSearch runs entirely on your Mac:
- All AI processing happens locally
- No data sent to external servers
- You have full control over your data

For support and updates:
https://github.com/yourusername/aiprivatesearch

Version: 1.0.0
EOF

# Create Distribution.xml
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
    "aiprivatesearch-installer.pkg"

echo ""
echo "✅ Package created successfully!"
echo "📦 Location: aiprivatesearch-installer.pkg"
echo ""
echo "⚠️  IMPORTANT: This installer will automatically:"
echo "   • Install Node.js"
echo "   • Install Ollama"
echo "   • Install Chrome"
echo "   • Download latest code from GitHub"
echo "   • Configure everything"
echo ""
echo "First launch may take 5-15 minutes."
echo ""
echo "To distribute: Double-click to test, then distribute aiprivatesearch-installer.pkg"
echo ""
