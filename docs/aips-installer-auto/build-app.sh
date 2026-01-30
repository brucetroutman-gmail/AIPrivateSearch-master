#!/bin/bash

# AIPrivateSearch .app Bundle Builder
# This script creates a proper macOS application bundle

set -e

echo "🏗️  Building AIPrivateSearch.app Bundle"
echo "======================================="

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
mkdir -p "$APP_DIR/Contents/Resources/app"
mkdir -p "$APP_DIR/Contents/Resources/scripts"

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

# Create main launcher script
echo "📝 Creating launcher script..."
cat > "$APP_DIR/Contents/MacOS/$APP_NAME" << 'EOF'
#!/bin/bash

# AIPrivateSearch Launcher
# This script launches the application and handles prerequisites

APP_SUPPORT="$HOME/Library/Application Support/AIPrivateSearch"
CONFIG_DIR="$HOME/.config/aiprivatesearch"
RESOURCES_DIR="$(dirname "$0")/../Resources"
LOG_FILE="$APP_SUPPORT/logs/app.log"

# Create directories
mkdir -p "$APP_SUPPORT"/{logs,data,sources,config}
mkdir -p "$CONFIG_DIR"

# Redirect output to log
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "=== AIPrivateSearch Starting at $(date) ==="

# Function to show dialog
show_dialog() {
    local title="$1"
    local message="$2"
    local type="${3:-informational}"
    
    osascript <<-APPLESCRIPT
        tell application "System Events"
            activate
            display dialog "$message" with title "$title" buttons {"OK"} default button "OK" with icon $type
        end tell
APPLESCRIPT
}

# Function to show alert with action
show_alert_with_action() {
    local title="$1"
    local message="$2"
    local button1="$3"
    local button2="$4"
    
    osascript <<-APPLESCRIPT
        tell application "System Events"
            activate
            set response to display dialog "$message" with title "$title" buttons {"$button1", "$button2"} default button "$button2"
            return button returned of response
        end tell
APPLESCRIPT
}

# Check for Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo "Node.js not found"
        local response=$(show_alert_with_action "Node.js Required" \
            "AIPrivateSearch requires Node.js to run.

Would you like to open the Node.js download page?" \
            "Cancel" "Open Download Page")
        
        if [ "$response" = "Open Download Page" ]; then
            open "https://nodejs.org/en/download/"
        fi
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    echo "Node.js found: $NODE_VERSION"
}

# Check for Ollama
check_ollama() {
    if ! command -v ollama &> /dev/null; then
        echo "Ollama not found"
        local response=$(show_alert_with_action "Ollama Required" \
            "AIPrivateSearch requires Ollama to run AI models locally.

Would you like to open the Ollama download page?" \
            "Cancel" "Open Download Page")
        
        if [ "$response" = "Open Download Page" ]; then
            open "https://ollama.com/download"
        fi
        exit 1
    fi
    
    echo "Ollama found"
}

# First run setup
first_run_setup() {
    if [ ! -f "$CONFIG_DIR/setup-complete" ]; then
        echo "Running first-time setup..."
        
        # Copy default configuration
        if [ -f "$RESOURCES_DIR/scripts/setup-wizard.sh" ]; then
            bash "$RESOURCES_DIR/scripts/setup-wizard.sh"
        fi
        
        # Create sample environment file
        if [ ! -f "$CONFIG_DIR/.env" ]; then
            cat > "$CONFIG_DIR/.env" << 'ENVEOF'
# AIPrivateSearch Configuration
# Edit this file to configure your installation

NODE_ENV=production
API_KEY=your-api-key-here
ADMIN_KEY=your-admin-key-here

# Default admin credentials (change these!)
DEFAULT_ADMIN_EMAIL=admin@localhost
DEFAULT_ADMIN_PASSWORD=changeme

# Database configuration (optional - leave empty for local-only mode)
DB_HOST=
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
ENVEOF
        fi
        
        # Open configuration in TextEdit
        open -a TextEdit "$CONFIG_DIR/.env"
        
        show_dialog "First Run Setup" \
            "Configuration file opened in TextEdit.

Please update the settings, then save and close the file.

Click OK when ready to continue." \
            "note"
        
        touch "$CONFIG_DIR/setup-complete"
    fi
}

# Install application files if needed
install_app_files() {
    if [ ! -d "$APP_SUPPORT/app" ]; then
        echo "Installing application files..."
        
        # Copy application from Resources
        if [ -d "$RESOURCES_DIR/app" ]; then
            cp -R "$RESOURCES_DIR/app" "$APP_SUPPORT/"
            echo "Application files installed to $APP_SUPPORT/app"
        else
            show_dialog "Installation Error" \
                "Application files not found in bundle. Please reinstall AIPrivateSearch." \
                "stop"
            exit 1
        fi
    fi
}

# Start the application
start_application() {
    echo "Starting AIPrivateSearch..."
    
    cd "$APP_SUPPORT/app"
    
    # Load environment variables
    if [ -f "$CONFIG_DIR/.env" ]; then
        export $(grep -v '^#' "$CONFIG_DIR/.env" | xargs)
    fi
    
    # Check if already running
    if pgrep -f "node.*server.mjs" > /dev/null; then
        show_dialog "Already Running" \
            "AIPrivateSearch is already running. Check your browser at http://localhost:3000" \
            "note"
        open "http://localhost:3000"
        exit 0
    fi
    
    # Start the servers
    bash "$APP_SUPPORT/app/start.sh" &
    
    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 3
    
    # Open browser
    open "http://localhost:3000"
    
    show_dialog "AIPrivateSearch Started" \
        "AIPrivateSearch is now running!

The application will open in your browser.
To stop the application, close this terminal window or use Activity Monitor." \
        "note"
    
    # Keep the terminal open to keep servers running
    echo ""
    echo "✅ AIPrivateSearch is running!"
    echo "🌐 Open http://localhost:3000 in your browser"
    echo ""
    echo "Press Ctrl+C to stop the servers"
    
    wait
}

# Main execution
main() {
    echo "Checking prerequisites..."
    check_nodejs
    check_ollama
    
    echo "Running setup..."
    first_run_setup
    install_app_files
    
    echo "Launching application..."
    start_application
}

# Run main function
main
EOF

chmod +x "$APP_DIR/Contents/MacOS/$APP_NAME"

# Create setup wizard script
echo "📝 Creating setup wizard..."
cat > "$APP_DIR/Contents/Resources/scripts/setup-wizard.sh" << 'EOF'
#!/bin/bash

# First-time setup wizard for AIPrivateSearch

CONFIG_DIR="$HOME/.config/aiprivatesearch"
APP_SUPPORT="$HOME/Library/Application Support/AIPrivateSearch"

echo "=== AIPrivateSearch Setup Wizard ==="
echo ""
echo "Welcome! Let's configure your AIPrivateSearch installation."
echo ""

# Create necessary directories
mkdir -p "$CONFIG_DIR"
mkdir -p "$APP_SUPPORT"/{data,sources/local-documents,config}

# Copy sample documents if they exist
RESOURCES_DIR="$(dirname "$0")/.."
if [ -d "$RESOURCES_DIR/samples/local-documents" ]; then
    cp -R "$RESOURCES_DIR/samples/local-documents/"* "$APP_SUPPORT/sources/local-documents/" 2>/dev/null || true
fi

echo "✅ Setup complete!"
EOF

chmod +x "$APP_DIR/Contents/Resources/scripts/setup-wizard.sh"

# Create a simple icon (placeholder - you should create a proper .icns file)
echo "🎨 Creating placeholder icon..."
cat > "$APP_DIR/Contents/Resources/AppIcon.icns" << 'EOF'
# This is a placeholder. Create a proper .icns file using:
# - Icon Composer (Xcode)
# - iconutil command line tool
# - Online .icns generator
EOF

# Create README
echo "📝 Creating README..."
cat > "$APP_DIR/Contents/Resources/README.txt" << 'EOF'
AIPrivateSearch for macOS
==========================

Installation:
1. Drag AIPrivateSearch.app to your Applications folder
2. Double-click to launch
3. Follow the setup wizard

Prerequisites:
- Node.js (https://nodejs.org/)
- Ollama (https://ollama.com/)

The app will check for these and guide you through installation if needed.

Configuration:
After first launch, edit the configuration file at:
~/.config/aiprivatesearch/.env

Support:
For issues and updates, visit: https://github.com/yourusername/aiprivatesearch

Version: 1.0.0
EOF

# Create uninstall script
echo "📝 Creating uninstall script..."
cat > "$APP_DIR/Contents/Resources/Uninstall.sh" << 'EOF'
#!/bin/bash

echo "AIPrivateSearch Uninstaller"
echo "==========================="
echo ""
echo "This will remove:"
echo "  - Application data from ~/Library/Application Support/AIPrivateSearch"
echo "  - Configuration from ~/.config/aiprivatesearch"
echo ""
read -p "Are you sure you want to uninstall? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo "Removing application data..."
    rm -rf "$HOME/Library/Application Support/AIPrivateSearch"
    rm -rf "$HOME/.config/aiprivatesearch"
    echo "✅ AIPrivateSearch has been uninstalled."
    echo "You can now delete AIPrivateSearch.app from Applications."
else
    echo "Uninstall cancelled."
fi
EOF

chmod +x "$APP_DIR/Contents/Resources/Uninstall.sh"

echo ""
echo "✅ App bundle created successfully!"
echo "📁 Location: $APP_DIR"
echo ""
echo "Next steps:"
echo "1. Add your application files to: $APP_DIR/Contents/Resources/app/"
echo "2. Create a proper icon file (AppIcon.icns)"
echo "3. Test the application"
echo "4. Code sign the app (optional but recommended)"
echo "5. Create a DMG for distribution"
echo ""
