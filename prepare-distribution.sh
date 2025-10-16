#!/bin/bash

# AIPrivateSearch Distribution Preparation Script
# Version 19.02

set -e

VERSION="19.02"
DIST_DIR="AIPrivateSearch-Distribution-v${VERSION}"
APP_NAME="AIPrivateSearch Installer.app"

echo "=== AIPrivateSearch Distribution Preparation ==="
echo "Version: $VERSION"
echo "Distribution directory: $DIST_DIR"

# Clean and create distribution directory
if [ -d "$DIST_DIR" ]; then
    echo "Removing existing distribution directory..."
    rm -rf "$DIST_DIR"
fi

echo "Creating distribution directory..."
mkdir -p "$DIST_DIR"

# Copy installer app
echo "Copying installer app..."
if [ -d "$APP_NAME" ]; then
    cp -R "$APP_NAME" "$DIST_DIR/"
    echo "✓ Installer app copied"
else
    echo "✗ Error: $APP_NAME not found"
    exit 1
fi

# Copy documentation
echo "Copying documentation..."
if [ -f "README-Installer.md" ]; then
    cp "README-Installer.md" "$DIST_DIR/Installation Guide.md"
    echo "✓ Installation guide copied"
else
    echo "✗ Warning: README-Installer.md not found"
fi

# Set proper permissions
echo "Setting permissions..."
chmod +x "$DIST_DIR/$APP_NAME/Contents/MacOS/AIPrivateSearch Installer"

# Create DMG (optional)
echo "Creating DMG..."
cd "$DIST_DIR"
hdiutil create -volname "AIPrivateSearch Installer v$VERSION" -srcfolder . -ov -format UDZO "../AIPrivateSearch-Installer-v${VERSION}.dmg"
cd ..

echo ""
echo "=== Distribution Ready ==="
echo "Files created:"
echo "• $DIST_DIR/ (distribution folder)"
echo "• AIPrivateSearch-Installer-v${VERSION}.dmg (disk image)"
echo ""
echo "Ready for customer distribution!"