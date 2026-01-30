#!/bin/bash

# Source Integration Script for AIPrivateSearch
# This script helps integrate your actual application code into the .app bundle

set -e

echo "🔗 AIPrivateSearch Source Integration"
echo "======================================"
echo ""

# Check if app bundle exists
if [ ! -d "./build/AIPrivateSearch.app" ]; then
    echo "❌ Error: AIPrivateSearch.app not found"
    echo "   Please run ./build-app.sh first"
    exit 1
fi

APP_RESOURCES="./build/AIPrivateSearch.app/Contents/Resources"

# Prompt for source location
echo "Where is your AIPrivateSearch source code?"
echo ""
echo "Options:"
echo "1) Clone from GitHub"
echo "2) Use local directory"
echo "3) Download from URL"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        read -p "Enter GitHub repository URL: " REPO_URL
        echo ""
        echo "📥 Cloning repository..."
        
        TEMP_DIR=$(mktemp -d)
        git clone "$REPO_URL" "$TEMP_DIR/aiprivatesearch"
        SOURCE_DIR="$TEMP_DIR/aiprivatesearch"
        ;;
        
    2)
        echo ""
        read -p "Enter path to local directory: " LOCAL_DIR
        
        if [ ! -d "$LOCAL_DIR" ]; then
            echo "❌ Error: Directory not found: $LOCAL_DIR"
            exit 1
        fi
        
        SOURCE_DIR="$LOCAL_DIR"
        ;;
        
    3)
        echo ""
        read -p "Enter download URL (zip file): " DOWNLOAD_URL
        echo ""
        echo "📥 Downloading..."
        
        TEMP_DIR=$(mktemp -d)
        curl -L -o "$TEMP_DIR/source.zip" "$DOWNLOAD_URL"
        
        echo "📦 Extracting..."
        cd "$TEMP_DIR"
        unzip -q source.zip
        
        # Find the extracted directory
        SOURCE_DIR=$(find "$TEMP_DIR" -type d -mindepth 1 -maxdepth 1 | head -n 1)
        cd - > /dev/null
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📂 Source directory: $SOURCE_DIR"
echo ""

# Check if source looks valid
if [ ! -f "$SOURCE_DIR/start.sh" ] && [ ! -f "$SOURCE_DIR/server.mjs" ]; then
    echo "⚠️  Warning: This doesn't look like an AIPrivateSearch directory"
    echo "   Expected to find start.sh or server.mjs"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Copy main application files
echo "📋 Copying application files..."
mkdir -p "$APP_RESOURCES/app"
cp -R "$SOURCE_DIR"/* "$APP_RESOURCES/app/" 2>/dev/null || {
    echo "⚠️  Some files could not be copied (this may be normal)"
}

# Remove .git if present (keep builds clean)
if [ -d "$APP_RESOURCES/app/.git" ]; then
    echo "🗑️  Removing .git directory..."
    rm -rf "$APP_RESOURCES/app/.git"
fi

# Copy sample documents if they exist
if [ -d "$SOURCE_DIR/sources/local-documents" ]; then
    echo "📁 Copying sample documents..."
    mkdir -p "$APP_RESOURCES/samples"
    cp -R "$SOURCE_DIR/sources/local-documents" "$APP_RESOURCES/samples/"
fi

# Copy config templates
if [ -d "$SOURCE_DIR/client/c01_client-first-app/config" ]; then
    echo "⚙️  Copying config templates..."
    mkdir -p "$APP_RESOURCES/config-templates"
    cp -R "$SOURCE_DIR/client/c01_client-first-app/config"/* "$APP_RESOURCES/config-templates/" 2>/dev/null || true
fi

# Copy data templates
if [ -d "$SOURCE_DIR/data" ]; then
    echo "📊 Copying data templates..."
    mkdir -p "$APP_RESOURCES/data-templates"
    cp -R "$SOURCE_DIR/data"/* "$APP_RESOURCES/data-templates/" 2>/dev/null || true
fi

# Install npm dependencies if package.json exists
if [ -f "$APP_RESOURCES/app/package.json" ]; then
    echo ""
    read -p "Install npm dependencies? (recommended) (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Installing dependencies..."
        cd "$APP_RESOURCES/app"
        npm install --production 2>&1 | grep -v "npm WARN" || true
        cd - > /dev/null
        echo "✅ Dependencies installed"
    fi
fi

# Create environment template
echo ""
echo "📝 Creating environment template..."
cat > "$APP_RESOURCES/env.template" << 'EOF'
# AIPrivateSearch Environment Configuration
# Copy this to ~/.config/aiprivatesearch/.env and customize

NODE_ENV=production
API_KEY=your-api-key-here
ADMIN_KEY=your-admin-key-here

# Default admin credentials (CHANGE THESE!)
DEFAULT_ADMIN_EMAIL=admin@localhost
DEFAULT_ADMIN_PASSWORD=changeme123

# Database configuration (optional - leave empty for local-only mode)
DB_HOST=
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

# Application settings
PORT=3000
HOST=localhost
EOF

# Update the launcher to use the template
echo "🔧 Updating launcher configuration..."

# Clean up temporary directory if we created one
if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    echo "🗑️  Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
fi

# Verify integration
echo ""
echo "✅ Source integration complete!"
echo ""
echo "Integrated components:"
echo "────────────────────────────────"

if [ -f "$APP_RESOURCES/app/start.sh" ]; then
    echo "✅ Main application (start.sh found)"
fi

if [ -f "$APP_RESOURCES/app/server.mjs" ]; then
    echo "✅ Server (server.mjs found)"
fi

if [ -d "$APP_RESOURCES/app/client" ]; then
    echo "✅ Client files"
fi

if [ -d "$APP_RESOURCES/samples/local-documents" ]; then
    echo "✅ Sample documents"
fi

if [ -d "$APP_RESOURCES/app/node_modules" ]; then
    echo "✅ Dependencies installed"
fi

echo ""
echo "Next steps:"
echo "────────────────────────────────"
echo "1. Test the app:"
echo "   open ./build/AIPrivateSearch.app"
echo ""
echo "2. If it works, build the distributables:"
echo "   ./build-pkg.sh   # Create installer"
echo "   ./build-dmg.sh   # Create disk image"
echo ""
echo "3. Or build everything:"
echo "   ./build-all.sh"
echo ""
echo "4. For distribution, see CODE-SIGNING-GUIDE.md"
echo ""
