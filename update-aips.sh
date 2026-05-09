#!/bin/bash
# Quick update script for remote Mac - deletes repo and re-downloads from GitHub
# Usage: bash update-remote.sh

REPO_URL="https://github.com/brucetroutman-gmail/AIPrivateSearch-master/archive/refs/heads/main.zip"
REPO_DIR="/Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch"
TEMP_ZIP="/tmp/aiprivatesearch-update.zip"
TEMP_EXTRACT="/tmp/aiprivatesearch-extract"

echo "=== AIPrivateSearch Remote Update ==="
echo ""

# Confirm before deleting
read -p "This will DELETE and re-download the repo at $REPO_DIR. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Clean up any previous temp files
rm -f "$TEMP_ZIP"
rm -rf "$TEMP_EXTRACT"

# Download zip
echo "⬇️  Downloading repo..."
curl -L -o "$TEMP_ZIP" "$REPO_URL"
if [ $? -ne 0 ]; then
    echo "❌ Download failed"
    exit 1
fi

# Delete existing repo
echo "🗑️  Removing old repo..."
rm -rf "$REPO_DIR"
mkdir -p "$REPO_DIR"

# Extract zip
echo "📦 Extracting..."
mkdir -p "$TEMP_EXTRACT"
unzip -q "$TEMP_ZIP" -d "$TEMP_EXTRACT"
if [ $? -ne 0 ]; then
    echo "❌ Unzip failed"
    exit 1
fi

# Move contents from extracted folder (GitHub zips have a top-level folder)
EXTRACTED_FOLDER=$(ls "$TEMP_EXTRACT")
mv "$TEMP_EXTRACT/$EXTRACTED_FOLDER/"* "$REPO_DIR/" 2>/dev/null
mv "$TEMP_EXTRACT/$EXTRACTED_FOLDER/".* "$REPO_DIR/" 2>/dev/null

# Cleanup temp files
rm -f "$TEMP_ZIP"
rm -rf "$TEMP_EXTRACT"

echo "✅ Update complete: $REPO_DIR"
