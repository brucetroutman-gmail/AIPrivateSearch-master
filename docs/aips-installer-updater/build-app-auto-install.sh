#!/bin/bash

# AIPrivateSearch .app Bundle Builder - With Auto-Install Prerequisites
# This version includes automatic installation of Node.js, Ollama, Chrome, etc.

set -e

echo "🏗️  Building AIPrivateSearch.app Bundle (Auto-Install Version)"
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

# Create main launcher script with auto-installation
echo "📝 Creating launcher script with auto-install..."
cat > "$APP_DIR/Contents/MacOS/$APP_NAME" << 'LAUNCHEREOF'
#!/bin/bash

# AIPrivateSearch Launcher - Auto-Install Version
# This script automatically installs prerequisites

APP_SUPPORT="/Users/Shared/AIPrivateSearch"
RESOURCES_DIR="$(dirname "$0")/../Resources"
LOG_FILE="$APP_SUPPORT/logs/install.log"

# Create directories
mkdir -p "$APP_SUPPORT"/{logs,data,sources,config,repo}

# Redirect output to log
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "=== AIPrivateSearch Installation Starting at $(date) ==="
echo ""

# Function to show dialog
show_dialog() {
    local title="$1"
    local message="$2"
    local type="${3:-informational}"
    
    osascript <<-APPLESCRIPT 2>/dev/null || echo "$message"
        tell application "System Events"
            activate
            display dialog "$message" with title "$title" buttons {"OK"} default button "OK" with icon $type
        end tell
APPLESCRIPT
}

# Function to show progress
show_progress() {
    local message="$1"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $message"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Check for running processes
check_running_processes() {
    show_progress "Checking for running processes..."
    
    RUNNING_PROCESSES=$(pgrep -f "node server.mjs\|npx serve" 2>/dev/null)
    
    if [ ! -z "$RUNNING_PROCESSES" ]; then
        show_dialog "AIPrivateSearch Already Running" \
            "AIPrivateSearch is currently running!

Please close the running application first:
1. Press Ctrl+C in the Terminal window, or
2. Quit from Activity Monitor

Then launch again." \
            "stop"
        exit 1
    fi
    
    echo "✅ No running processes detected"
}

# Install Node.js
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
        echo "✅ Node.js found: $NODE_VERSION"
        return 0
    fi
    
    show_progress "Installing Node.js..."
    
    # Try Homebrew first if available
    if command -v brew &> /dev/null; then
        echo "Installing Node.js via Homebrew..."
        brew install node &> /dev/null && {
            echo "✅ Node.js installed via Homebrew"
            return 0
        }
    fi
    
    # Download and install directly
    echo "Downloading Node.js installer..."
    NODE_VERSION="v20.11.0"
    NODE_PKG="node-${NODE_VERSION}.pkg"
    
    curl -L -o "/tmp/${NODE_PKG}" "https://nodejs.org/dist/${NODE_VERSION}/${NODE_PKG}" 2>/dev/null
    
    if [ -f "/tmp/${NODE_PKG}" ]; then
        echo "Installing Node.js (may require admin password)..."
        
        # Try without sudo first
        installer -pkg "/tmp/${NODE_PKG}" -target CurrentUserHomeDirectory 2>/dev/null || \
        sudo installer -pkg "/tmp/${NODE_PKG}" -target / 2>/dev/null
        
        rm -f "/tmp/${NODE_PKG}"
        
        # Update PATH
        export PATH="/usr/local/bin:$PATH"
        
        if command -v node &> /dev/null; then
            echo "✅ Node.js installed successfully"
            return 0
        fi
    fi
    
    show_dialog "Node.js Installation Failed" \
        "Could not install Node.js automatically.

Please install manually from: https://nodejs.org/

Then launch AIPrivateSearch again." \
        "stop"
    
    exit 1
}

# Install Ollama
install_ollama() {
    if command -v ollama &> /dev/null; then
        echo "✅ Ollama found"
        return 0
    fi
    
    show_progress "Installing Ollama..."
    
    echo "Downloading Ollama installer..."
    curl -L -o "/tmp/Ollama-darwin.zip" "https://ollama.com/download/Ollama-darwin.zip" 2>/dev/null
    
    if [ -f "/tmp/Ollama-darwin.zip" ]; then
        echo "Installing Ollama..."
        cd /tmp
        unzip -q Ollama-darwin.zip 2>/dev/null
        
        if [ -d "Ollama.app" ]; then
            # Move to Applications
            sudo mv Ollama.app /Applications/ 2>/dev/null || mv Ollama.app /Applications/ 2>/dev/null
            
            # Create symlink for command line
            sudo ln -sf /Applications/Ollama.app/Contents/Resources/ollama /usr/local/bin/ollama 2>/dev/null || {
                mkdir -p ~/bin
                ln -sf /Applications/Ollama.app/Contents/Resources/ollama ~/bin/ollama
                export PATH="~/bin:$PATH"
            }
            
            echo "✅ Ollama installed successfully"
            
            rm -f /tmp/Ollama-darwin.zip
            rm -rf /tmp/Ollama.app
            return 0
        fi
    fi
    
    show_dialog "Ollama Installation Failed" \
        "Could not install Ollama automatically.

Please install manually from: https://ollama.com/download

Then launch AIPrivateSearch again." \
        "stop"
    
    exit 1
}

# Install Chrome
install_chrome() {
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo "✅ Chrome browser found"
        return 0
    fi
    
    show_progress "Installing Chrome browser..."
    
    echo "Downloading Chrome installer..."
    curl -L -o "/tmp/googlechrome.dmg" "https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg" 2>/dev/null
    
    if [ -f "/tmp/googlechrome.dmg" ]; then
        echo "Installing Chrome..."
        
        # Mount the DMG
        if hdiutil attach "/tmp/googlechrome.dmg" -quiet -nobrowse 2>/dev/null; then
            # Copy Chrome to Applications
            if sudo cp -R "/Volumes/Google Chrome/Google Chrome.app" "/Applications/" 2>/dev/null || \
               cp -R "/Volumes/Google Chrome/Google Chrome.app" "/Applications/" 2>/dev/null; then
                
                # Unmount
                hdiutil detach "/Volumes/Google Chrome" -quiet 2>/dev/null
                
                # Clean up
                rm -f "/tmp/googlechrome.dmg"
                
                if [ -d "/Applications/Google Chrome.app" ]; then
                    echo "✅ Chrome installed successfully"
                    sudo chown -R root:admin "/Applications/Google Chrome.app" 2>/dev/null || true
                    return 0
                fi
            else
                hdiutil detach "/Volumes/Google Chrome" -quiet 2>/dev/null
            fi
        fi
        
        rm -f "/tmp/googlechrome.dmg"
    fi
    
    echo "⚠️  Chrome installation failed (optional)"
    echo "   You can install manually from: https://www.google.com/chrome/"
}

# Install Rosetta (Apple Silicon)
install_rosetta() {
    if [[ $(uname -m) != "arm64" ]]; then
        echo "✅ Intel Mac detected - Rosetta not needed"
        return 0
    fi
    
    # Check if Rosetta is installed
    if /usr/bin/pgrep -q oahd 2>/dev/null || arch -x86_64 /usr/bin/true 2>/dev/null; then
        echo "✅ Rosetta found (Apple Silicon compatibility enabled)"
        return 0
    fi
    
    show_progress "Installing Rosetta (Apple Silicon compatibility)..."
    
    echo "This may take a few minutes and requires admin password..."
    
    if sudo softwareupdate --install-rosetta --agree-to-license 2>/dev/null; then
        echo "✅ Rosetta installed successfully"
    else
        echo "⚠️  Rosetta installation may have failed (optional)"
    fi
}

# Download and setup application
setup_application() {
    show_progress "Setting up AIPrivateSearch..."
    
    cd "$APP_SUPPORT"
    
    # Remove existing installation
    if [ -d "repo/aiprivatesearch" ]; then
        echo "Removing existing installation..."
        rm -rf repo/aiprivatesearch
    fi
    
    # Download fresh copy
    echo "Downloading latest version from GitHub..."
    curl -L -H "Cache-Control: no-cache" -H "Pragma: no-cache" --retry 3 \
         -o repo/aiprivatesearch.zip \
         "https://github.com/brucetroutman-gmail/AIPrivateSearch-master/archive/refs/heads/main.zip?v=$(date +%s)&r=$RANDOM" 2>/dev/null
    
    if [ $? -eq 0 ] && [ -f "repo/aiprivatesearch.zip" ]; then
        echo "Extracting repository..."
        cd repo
        unzip -q aiprivatesearch.zip 2>/dev/null
        
        # Try different possible directory names
        if [ -d "AIPrivateSearch-master-main" ]; then
            mv AIPrivateSearch-master-main aiprivatesearch
        elif [ -d "AIPrivateSearch-master" ]; then
            mv AIPrivateSearch-master aiprivatesearch
        fi
        
        rm -f aiprivatesearch.zip
        
        if [ -d "aiprivatesearch" ]; then
            echo "✅ Repository downloaded successfully"
        else
            show_dialog "Download Failed" \
                "Failed to extract repository.

Please check your internet connection and try again." \
                "stop"
            exit 1
        fi
    else
        show_dialog "Download Failed" \
            "Failed to download AIPrivateSearch.

Please check your internet connection and try again." \
            "stop"
        exit 1
    fi
}

# Create configuration
create_configuration() {
    show_progress "Creating configuration..."
    
    # Delete existing .env file
    if [ -f "$APP_SUPPORT/.env-aips" ]; then
        echo "Removing existing configuration..."
        rm -f "$APP_SUPPORT/.env-aips"
    fi
    
    echo "Creating .env-aips configuration file..."
    cat > "$APP_SUPPORT/.env-aips" << 'ENVEOF'
# AI Private Search Application Environment Variables

# API Keys
API_KEY=dev-key
ADMIN_KEY=admin-key
NODE_ENV=development

# Default Admin Account
DEFAULT_ADMIN_EMAIL=adm-std@a.com
DEFAULT_ADMIN_PASSWORD=123

# Member Database Configuration
DB_HOST=92.112.184.206
DB_PORT=3306
DB_DATABASE=iodd2
DB_USERNAME=iodd-api
DB_PASSWORD=IODD@Api
ENVEOF
    
    if [ -f "$APP_SUPPORT/.env-aips" ]; then
        echo "✅ Configuration file created"
    else
        echo "⚠️  Warning: Failed to create configuration file"
    fi
}

# Copy sample data
copy_sample_data() {
    show_progress "Copying sample data..."
    
    cd "$APP_SUPPORT"
    
    # Copy local-documents if needed
    if [ ! -d "sources/local-documents" ]; then
        if [ -d "repo/aiprivatesearch/sources/local-documents" ]; then
            echo "Copying sample documents..."
            cp -r "repo/aiprivatesearch/sources/local-documents" "sources/"
            echo "✅ Sample documents copied"
        fi
    fi
    
    # Copy config files
    if [ ! -d "config" ]; then
        mkdir -p "config"
    fi
    
    if [ ! -f "config/app.json" ]; then
        if [ -f "repo/aiprivatesearch/client/c01_client-first-app/config/app.json" ]; then
            echo "Copying config files..."
            cp -r "repo/aiprivatesearch/client/c01_client-first-app/config/"* "config/"
            echo "✅ Config files copied"
        fi
    fi
    
    # Copy data files
    if [ ! -f "data/users.json" ]; then
        if [ -f "repo/aiprivatesearch/data/users.json" ]; then
            echo "Copying user data files..."
            cp "repo/aiprivatesearch/data/users.json" "data/"
        fi
    fi
    
    if [ ! -f "data/sessions.json" ]; then
        if [ -f "repo/aiprivatesearch/data/sessions.json" ]; then
            cp "repo/aiprivatesearch/data/sessions.json" "data/"
        fi
    fi
}

# Start the application
start_application() {
    show_progress "Starting AIPrivateSearch..."
    
    cd "$APP_SUPPORT/repo/aiprivatesearch"
    
    # Check if already running
    if pgrep -f "node.*server.mjs" > /dev/null; then
        show_dialog "Already Running" \
            "AIPrivateSearch is already running!

Open your browser to: http://localhost:3000" \
            "note"
        open "http://localhost:3000"
        exit 0
    fi
    
    # Start the servers
    if [ -f "./start.sh" ]; then
        chmod +x ./start.sh
        ./start.sh &
        
        # Wait for server to start
        echo "Waiting for server to start..."
        sleep 5
        
        # Open browser
        open "http://localhost:3000"
        
        show_dialog "AIPrivateSearch Started" \
            "AIPrivateSearch is now running!

The application will open in your browser.

To stop: Close this Terminal window or press Ctrl+C" \
            "note"
        
        echo ""
        echo "✅ AIPrivateSearch is running!"
        echo "🌐 Open http://localhost:3000 in your browser"
        echo ""
        echo "Press Ctrl+C to stop the servers"
        
        wait
    else
        show_dialog "Startup Failed" \
            "Could not find start.sh script.

Please check the installation and try again." \
            "stop"
        exit 1
    fi
}

# Main execution
main() {
    show_dialog "AIPrivateSearch Installer" \
        "Welcome to AIPrivateSearch!

This will:
• Install Node.js (if needed)
• Install Ollama (if needed)  
• Install Chrome (if needed)
• Download AIPrivateSearch
• Configure and start the application

This may take several minutes.

Click OK to continue." \
        "note"
    
    check_running_processes
    install_nodejs
    install_ollama
    install_chrome
    install_rosetta
    setup_application
    create_configuration
    copy_sample_data
    start_application
}

# Run main function
main
LAUNCHEREOF

chmod +x "$APP_DIR/Contents/MacOS/$APP_NAME"

# Create Update launcher (separate from main launcher)
echo "📝 Creating Update launcher..."
cat > "$APP_DIR/Contents/MacOS/Update" << 'UPDATELAUNCHEREOF'
#!/bin/bash

# Update Launcher - Can be run separately or from main app

RESOURCES_DIR="$(dirname "$0")/../Resources"
"$RESOURCES_DIR/scripts/Update-AIPrivateSearch.sh"
UPDATELAUNCHEREOF

chmod +x "$APP_DIR/Contents/MacOS/Update"

# Create a simple icon placeholder
echo "🎨 Creating placeholder icon..."
touch "$APP_DIR/Contents/Resources/AppIcon.icns"

# Create Update script
echo "📝 Creating Update script..."
mkdir -p "$APP_DIR/Contents/Resources/scripts"
cat > "$APP_DIR/Contents/Resources/scripts/Update-AIPrivateSearch.sh" << 'UPDATEEOF'
#!/bin/bash

# AIPrivateSearch Updater
# This script updates to the latest version from GitHub

APP_SUPPORT="/Users/Shared/AIPrivateSearch"
LOG_FILE="$APP_SUPPORT/logs/update.log"

# Create log directory
mkdir -p "$APP_SUPPORT/logs"

# Redirect output to log
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "=== AIPrivateSearch Update Starting at $(date) ==="
echo ""

# Function to show dialog
show_dialog() {
    local title="$1"
    local message="$2"
    local type="${3:-informational}"
    
    osascript <<-APPLESCRIPT 2>/dev/null || echo "$message"
        tell application "System Events"
            activate
            display dialog "$message" with title "$title" buttons {"OK"} default button "OK" with icon $type
        end tell
APPLESCRIPT
}

# Function to show yes/no dialog
show_confirm() {
    local title="$1"
    local message="$2"
    
    result=$(osascript <<-APPLESCRIPT 2>/dev/null
        tell application "System Events"
            activate
            set response to display dialog "$message" with title "$title" buttons {"Cancel", "Update"} default button "Update"
            return button returned of response
        end tell
APPLESCRIPT
    )
    
    if [ "$result" = "Update" ]; then
        return 0
    else
        return 1
    fi
}

# Check if AIPrivateSearch is installed
if [ ! -d "$APP_SUPPORT/repo/aiprivatesearch" ]; then
    show_dialog "Not Installed" \
        "AIPrivateSearch does not appear to be installed.

Please run AIPrivateSearch first to install it." \
        "stop"
    exit 1
fi

# Check for running processes
echo "Checking for running processes..."
RUNNING_PROCESSES=$(pgrep -f "node server.mjs|npx serve" 2>/dev/null)

if [ ! -z "$RUNNING_PROCESSES" ]; then
    show_dialog "AIPrivateSearch is Running" \
        "AIPrivateSearch is currently running!

Please stop the application before updating:
1. Close the Terminal window running AIPrivateSearch
2. Or press Ctrl+C in that Terminal

Then run the updater again." \
        "stop"
    exit 1
fi

echo "✅ No running processes detected"

# Show confirmation
if ! show_confirm "Update AIPrivateSearch" \
    "Update to the latest version from GitHub?

This will:
• Backup your current version
• Download the latest code
• Preserve your configuration
• Preserve your data

Continue?"; then
    echo "Update cancelled by user"
    exit 0
fi

# Backup current version
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Creating backup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BACKUP_DIR="$APP_SUPPORT/backups/aiprivatesearch-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$APP_SUPPORT/backups"

if [ -d "$APP_SUPPORT/repo/aiprivatesearch" ]; then
    echo "Backing up to: $BACKUP_DIR"
    cp -R "$APP_SUPPORT/repo/aiprivatesearch" "$BACKUP_DIR"
    echo "✅ Backup created"
fi

# Download latest version
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Downloading latest version..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$APP_SUPPORT/repo"
rm -f aiprivatesearch-new.zip

echo "Downloading from GitHub..."
curl -L -H "Cache-Control: no-cache" -H "Pragma: no-cache" --retry 3 \
     -o aiprivatesearch-new.zip \
     "https://github.com/brucetroutman-gmail/AIPrivateSearch-master/archive/refs/heads/main.zip?v=$(date +%s)&r=$RANDOM" 2>/dev/null

if [ $? -ne 0 ] || [ ! -f "aiprivatesearch-new.zip" ]; then
    show_dialog "Download Failed" \
        "Failed to download the latest version.

Your current version has not been changed." \
        "stop"
    exit 1
fi

echo "✅ Download successful"

# Extract new version
echo ""
echo "Extracting new version..."
TMP_DIR="$APP_SUPPORT/repo/aiprivatesearch-temp"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

unzip -q aiprivatesearch-new.zip -d "$TMP_DIR" 2>/dev/null

# Find the extracted directory
if [ -d "$TMP_DIR/AIPrivateSearch-master-main" ]; then
    EXTRACTED_DIR="$TMP_DIR/AIPrivateSearch-master-main"
elif [ -d "$TMP_DIR/AIPrivateSearch-master" ]; then
    EXTRACTED_DIR="$TMP_DIR/AIPrivateSearch-master"
else
    show_dialog "Extraction Failed" \
        "Failed to extract the downloaded files." \
        "stop"
    rm -rf "$TMP_DIR"
    rm -f aiprivatesearch-new.zip
    exit 1
fi

echo "✅ Extraction successful"

# Install new version
echo ""
echo "Installing new version..."

if [ -d "$APP_SUPPORT/repo/aiprivatesearch" ]; then
    rm -rf "$APP_SUPPORT/repo/aiprivatesearch"
fi

mv "$EXTRACTED_DIR" "$APP_SUPPORT/repo/aiprivatesearch"

# Cleanup
rm -rf "$TMP_DIR"
rm -f aiprivatesearch-new.zip

echo "✅ New version installed"
echo ""
echo "✅ Configuration preserved"
echo "✅ User data preserved"
echo ""

show_dialog "Update Complete" \
    "AIPrivateSearch has been updated successfully!

Your configuration and data have been preserved.

Backup location: $BACKUP_DIR

You can now launch AIPrivateSearch." \
    "note"

exit 0
UPDATEEOF

chmod +x "$APP_DIR/Contents/Resources/scripts/Update-AIPrivateSearch.sh"

# Create easy-to-find updater in main Resources
echo "📝 Creating easy-access updater..."
cat > "$APP_DIR/Contents/Resources/Update AIPrivateSearch.command" << 'EASYUPDATEEOF'
#!/bin/bash

# Easy-access updater - users can double-click this

SCRIPT_DIR="$(dirname "$0")/scripts"
"$SCRIPT_DIR/Update-AIPrivateSearch.sh"
EASYUPDATEEOF

chmod +x "$APP_DIR/Contents/Resources/Update AIPrivateSearch.command"

# Create a helper app that can be launched from Dock/Applications
echo "📝 Creating Update helper app..."
mkdir -p "$APP_DIR/Contents/Resources/Updater.app/Contents/MacOS"
cat > "$APP_DIR/Contents/Resources/Updater.app/Contents/MacOS/Updater" << 'HELPERUPDATEEOF'
#!/bin/bash

# Helper updater app
MAIN_APP_RESOURCES="/Applications/AIPrivateSearch.app/Contents/Resources"
"$MAIN_APP_RESOURCES/scripts/Update-AIPrivateSearch.sh"
HELPERUPDATEEOF

chmod +x "$APP_DIR/Contents/Resources/Updater.app/Contents/MacOS/Updater"

# Create Info.plist for updater app
cat > "$APP_DIR/Contents/Resources/Updater.app/Contents/Info.plist" << 'UPDATEPLISTEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Updater</string>
    <key>CFBundleIdentifier</key>
    <string>com.aiprivatesearch.updater</string>
    <key>CFBundleName</key>
    <string>Update AIPrivateSearch</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
</dict>
</plist>
UPDATEPLISTEOF

# Create README
echo "📝 Creating README..."
cat > "$APP_DIR/Contents/Resources/README.txt" << 'EOF'
AIPrivateSearch for macOS
==========================

Installation:
1. Drag AIPrivateSearch.app to your Applications folder
2. Double-click to launch
3. The app will automatically install all prerequisites:
   - Node.js
   - Ollama
   - Chrome browser
   - Rosetta (on Apple Silicon Macs)

The installation may take several minutes the first time.

UPDATING TO NEW VERSIONS
-------------------------
When a new version is available on GitHub:

UPDATING TO NEW VERSIONS
-------------------------
When a new version is available on GitHub:

**EASIEST METHOD:**
1. In Applications, right-click AIPrivateSearch.app
2. Select "Show Package Contents"
3. Go to Contents → Resources
4. Double-click "Update AIPrivateSearch.command"
5. Click "Update" - wait 1 minute - done!

**ALTERNATIVE - Keep Updater Handy:**
1. Right-click AIPrivateSearch.app → Show Package Contents
2. Go to Contents → Resources
3. Drag "Updater.app" to your Desktop (or anywhere)
4. Double-click Updater.app anytime to update
5. (You can keep this for future updates!)

**OR - From Terminal:**
/Applications/AIPrivateSearch.app/Contents/Resources/scripts/Update-AIPrivateSearch.sh

**NOTE:** Your data and configuration are always preserved!

Configuration:
After installation, settings are stored at:
/Users/Shared/AIPrivateSearch/.env-aips

Support:
For issues and updates, visit: https://github.com/yourusername/aiprivatesearch

Version: 1.0.0
EOF

echo ""
echo "✅ App bundle created successfully!"
echo "📁 Location: $APP_DIR"
echo ""
echo "⚠️  IMPORTANT: This version automatically installs:"
echo "   • Node.js"
echo "   • Ollama"
echo "   • Chrome"
echo "   • Downloads latest code from GitHub"
echo ""
echo "Next steps:"
echo "1. Test the application: open $APP_DIR"
echo "2. Build PKG: ./build-pkg-auto-install.sh"
echo "3. Build DMG: ./build-dmg.sh"
echo ""
