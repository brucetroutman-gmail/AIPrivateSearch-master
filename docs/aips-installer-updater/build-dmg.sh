#!/bin/bash

# AIPrivateSearch DMG Builder
# Creates a distributable disk image with drag-to-install interface

set -e

echo "💿 Building AIPrivateSearch DMG"
echo "================================"

APP_NAME="AIPrivateSearch"
VERSION="1.0.0"
DMG_NAME="$APP_NAME-$VERSION"
BUILD_DIR="./build"
DMG_DIR="./build-dmg"

# Clean previous DMG build
echo "🧹 Cleaning previous DMG build..."
rm -rf "$DMG_DIR"
rm -f "$DMG_NAME.dmg"
rm -f "$DMG_NAME-temp.dmg"

# Create DMG directory structure
echo "📁 Creating DMG structure..."
mkdir -p "$DMG_DIR"

# Copy the app
if [ -d "$BUILD_DIR/$APP_NAME.app" ]; then
    echo "📋 Copying $APP_NAME.app..."
    cp -R "$BUILD_DIR/$APP_NAME.app" "$DMG_DIR/"
else
    echo "❌ Error: $APP_NAME.app not found in $BUILD_DIR"
    echo "Please run build-app.sh first"
    exit 1
fi

# Create Applications symlink for drag-to-install
echo "🔗 Creating Applications symlink..."
ln -s /Applications "$DMG_DIR/Applications"

# Create README
echo "📝 Creating README..."
cat > "$DMG_DIR/README.txt" << 'EOF'
AIPrivateSearch Installation
=============================

To install:
1. Drag AIPrivateSearch.app to the Applications folder
2. Eject this disk image
3. Launch AIPrivateSearch from Applications

Prerequisites:
- Node.js: https://nodejs.org/
- Ollama: https://ollama.com/

First Launch:
The app will check for prerequisites and guide you through setup.

Configuration:
After first launch, edit: ~/.config/aiprivatesearch/.env

Support: https://github.com/yourusername/aiprivatesearch
EOF

# Create a simple background (text-based for demo)
# In production, create a proper background image
echo "🎨 Creating background info..."
cat > "$DMG_DIR/.background.txt" << 'EOF'
For a professional DMG, create a background image:
- Size: 600x400 pixels (or 1200x800 for Retina)
- Include arrow pointing from app to Applications
- Save as .background/background.png
EOF

# Calculate DMG size
echo "📊 Calculating required size..."
DMG_SIZE=$(du -sm "$DMG_DIR" | awk '{print $1}')
DMG_SIZE=$((DMG_SIZE + 50)) # Add 50MB padding

# Create temporary DMG
echo "💿 Creating temporary DMG..."
hdiutil create \
    -srcfolder "$DMG_DIR" \
    -volname "$APP_NAME" \
    -fs HFS+ \
    -fsargs "-c c=64,a=16,e=16" \
    -format UDRW \
    -size ${DMG_SIZE}m \
    "$DMG_NAME-temp.dmg"

# Mount the temporary DMG
echo "📂 Mounting DMG..."
MOUNT_DIR=$(hdiutil attach -readwrite -noverify -noautoopen "$DMG_NAME-temp.dmg" | egrep '^/dev/' | sed 1q | awk '{print $3}')

echo "Mounted at: $MOUNT_DIR"

# Set DMG window properties using AppleScript
echo "🎨 Configuring DMG window..."
osascript << APPLESCRIPT
tell application "Finder"
    tell disk "$APP_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {400, 100, 1000, 500}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 128
        set background picture of viewOptions to file ".background:background.png"
        
        -- Position icons
        set position of item "$APP_NAME.app" of container window to {150, 200}
        set position of item "Applications" of container window to {450, 200}
        
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
APPLESCRIPT 2>/dev/null || echo "⚠️  AppleScript configuration failed (this is OK for demo)"

# Unmount
echo "📤 Unmounting DMG..."
sleep 2
hdiutil detach "$MOUNT_DIR" || true

# Convert to compressed, read-only DMG
echo "🗜️  Compressing DMG..."
hdiutil convert \
    "$DMG_NAME-temp.dmg" \
    -format UDZO \
    -imagekey zlib-level=9 \
    -o "$DMG_NAME.dmg"

# Clean up
echo "🧹 Cleaning up..."
rm -f "$DMG_NAME-temp.dmg"

echo ""
echo "✅ DMG created successfully!"
echo "📦 Location: $DMG_NAME.dmg"
echo "📏 Size: $(du -h "$DMG_NAME.dmg" | awk '{print $1}')"
echo ""
echo "Next steps:"
echo "1. Test the DMG on a clean system"
echo "2. Sign and notarize for distribution:"
echo "   codesign --deep --force --verify --verbose --sign 'Developer ID Application: Your Name' $DMG_NAME.dmg"
echo "3. Distribute to users"
echo ""
