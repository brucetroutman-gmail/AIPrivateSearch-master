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

Current location: $APP_SUPPORT/repo/aiprivatesearch

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
else
    echo "⚠️  No existing installation to backup"
fi

# Download latest version
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Downloading latest version..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$APP_SUPPORT/repo"

# Remove old download if exists
rm -f aiprivatesearch-new.zip

# Download with cache-busting
echo "Downloading from GitHub..."
curl -L -H "Cache-Control: no-cache" -H "Pragma: no-cache" --retry 3 \
     -o aiprivatesearch-new.zip \
     "https://github.com/brucetroutman-gmail/AIPrivateSearch-master/archive/refs/heads/main.zip?v=$(date +%s)&r=$RANDOM" 2>/dev/null

if [ $? -ne 0 ] || [ ! -f "aiprivatesearch-new.zip" ]; then
    show_dialog "Download Failed" \
        "Failed to download the latest version from GitHub.

Your current version has not been changed.

Please check:
• Your internet connection
• GitHub is accessible

Backup location: $BACKUP_DIR" \
        "stop"
    exit 1
fi

echo "✅ Download successful"

# Extract new version
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Extracting new version..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create temporary directory
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
        "Failed to extract the downloaded files.

Your current version has not been changed.

Backup location: $BACKUP_DIR" \
        "stop"
    rm -rf "$TMP_DIR"
    rm -f aiprivatesearch-new.zip
    exit 1
fi

echo "✅ Extraction successful"

# Remove old version and install new
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Installing new version..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Remove old installation
if [ -d "$APP_SUPPORT/repo/aiprivatesearch" ]; then
    echo "Removing old version..."
    rm -rf "$APP_SUPPORT/repo/aiprivatesearch"
fi

# Move new version into place
echo "Installing new version..."
mv "$EXTRACTED_DIR" "$APP_SUPPORT/repo/aiprivatesearch"

# Cleanup
rm -rf "$TMP_DIR"
rm -f aiprivatesearch-new.zip

echo "✅ New version installed"

# Preserve user data and configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Preserving your data..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Configuration preserved at: $APP_SUPPORT/.env-aips"
echo "✅ User data preserved at: $APP_SUPPORT/data/"
echo "✅ Documents preserved at: $APP_SUPPORT/sources/"

# Show completion
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Update Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ AIPrivateSearch has been updated to the latest version!"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Update log: $LOG_FILE"
echo ""

show_dialog "Update Complete" \
    "AIPrivateSearch has been updated successfully!

New version installed: $APP_SUPPORT/repo/aiprivatesearch

Your configuration and data have been preserved.

Backup of previous version: 
$BACKUP_DIR

You can now launch AIPrivateSearch." \
    "note"

exit 0
