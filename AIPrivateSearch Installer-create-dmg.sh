#!/bin/bash

# AIPrivateSearch DMG Creator v19.06
# Creates a signed and notarized DMG for distribution

set -e

# Configuration
APP_NAME="AIPrivateSearch Installer"
DMG_NAME="AIPrivateSearch-Installer-v19.06"
VOLUME_NAME="AIPrivateSearch Installer"
SOURCE_APP="AIPrivateSearch Installer.app"
TEMP_DMG="temp.dmg"
FINAL_DMG="${DMG_NAME}.dmg"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== AIPrivateSearch DMG Creator ===${NC}"

# Check if app exists
if [ ! -d "$SOURCE_APP" ]; then
    echo -e "${RED}Error: $SOURCE_APP not found${NC}"
    exit 1
fi

# Clean up any existing files
rm -f "$TEMP_DMG" "$FINAL_DMG"

# Create temporary DMG
echo "Creating temporary DMG..."
hdiutil create -srcfolder "$SOURCE_APP" -volname "$VOLUME_NAME" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW -size 100m "$TEMP_DMG"

# Mount the DMG
echo "Mounting DMG..."
DEVICE=$(hdiutil attach -readwrite -noverify -noautoopen "$TEMP_DMG" | egrep '^/dev/' | sed 1q | awk '{print $1}')
MOUNT_POINT="/Volumes/$VOLUME_NAME"

# Wait for mount
sleep 2

# Create Applications symlink
echo "Creating Applications symlink..."
ln -sf /Applications "$MOUNT_POINT/Applications"

# Set DMG window properties (optional - requires AppleScript)
cat > dmg_setup.applescript << 'EOF'
tell application "Finder"
    tell disk "AIPrivateSearch Installer"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {400, 100, 900, 400}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 72
        set position of item "AIPrivateSearch Installer.app" of container window to {150, 150}
        set position of item "Applications" of container window to {350, 150}
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
EOF

# Run AppleScript if osascript is available
if command -v osascript >/dev/null 2>&1; then
    echo "Setting up DMG appearance..."
    osascript dmg_setup.applescript || echo "Warning: Could not set DMG appearance"
fi

# Clean up AppleScript
rm -f dmg_setup.applescript

# Unmount the DMG
echo "Unmounting DMG..."
hdiutil detach "$DEVICE"

# Convert to final read-only DMG
echo "Creating final DMG..."
hdiutil convert "$TEMP_DMG" -format UDZO -imagekey zlib-level=9 -o "$FINAL_DMG"

# Clean up
rm -f "$TEMP_DMG"

# Sign the DMG (requires Developer ID)
if [ -n "$DEVELOPER_ID" ]; then
    echo "Signing DMG with Developer ID: $DEVELOPER_ID"
    codesign --force --verify --verbose --sign "$DEVELOPER_ID" "$FINAL_DMG"
    
    # Verify signature
    codesign --verify --verbose=2 "$FINAL_DMG"
    spctl --assess --type open --context context:primary-signature --verbose "$FINAL_DMG"
else
    echo -e "${YELLOW}Warning: No DEVELOPER_ID set. DMG will not be signed.${NC}"
    echo "To sign, set DEVELOPER_ID environment variable to your Developer ID certificate name"
fi

# Notarize (requires Apple ID credentials)
if [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASSWORD" ] && [ -n "$TEAM_ID" ]; then
    echo "Notarizing DMG..."
    xcrun notarytool submit "$FINAL_DMG" --apple-id "$APPLE_ID" --password "$APPLE_ID_PASSWORD" --team-id "$TEAM_ID" --wait
    
    # Staple the notarization
    xcrun stapler staple "$FINAL_DMG"
else
    echo -e "${YELLOW}Warning: Notarization credentials not set. DMG will not be notarized.${NC}"
    echo "To notarize, set APPLE_ID, APPLE_ID_PASSWORD, and TEAM_ID environment variables"
fi

echo -e "${GREEN}✓ DMG created successfully: $FINAL_DMG${NC}"
echo -e "${GREEN}✓ Size: $(du -h "$FINAL_DMG" | cut -f1)${NC}"

# Verify the final DMG
echo "Verifying DMG..."
hdiutil verify "$FINAL_DMG"

echo -e "${GREEN}=== DMG Creation Complete ===${NC}"