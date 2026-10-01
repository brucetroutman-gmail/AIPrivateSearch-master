#!/bin/bash

echo "🔍 AIPrivateSearch Installation Verification"
echo "=========================================="

# Check directory structure
echo "📁 Checking directory structure..."
REQUIRED_DIRS=(
    "client/c01_client-first-app"
    "server/s01_server-first-app"
    "client/c01_client-first-app/shared"
    "client/c01_client-first-app/config"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir - MISSING"
    fi
done

# Check critical files
echo ""
echo "📄 Checking critical files..."
REQUIRED_FILES=(
    "client/c01_client-first-app/index.html"
    "client/c01_client-first-app/search.html"
    "client/c01_client-first-app/csrf.js"
    "client/c01_client-first-app/shared/common.js"
    "client/c01_client-first-app/shared/styles.css"
    "client/c01_client-first-app/shared/header.html"
    "client/c01_client-first-app/shared/footer.html"
    "server/s01_server-first-app/server.mjs"
    "server/s01_server-first-app/package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

# Check if servers are running
echo ""
echo "🔍 Checking running processes..."
if pgrep -f "node server.mjs" > /dev/null; then
    echo "✅ Backend server running"
else
    echo "❌ Backend server not running"
fi

if pgrep -f "npx serve" > /dev/null; then
    echo "✅ Frontend server running"
else
    echo "❌ Frontend server not running"
fi

# Test connectivity
echo ""
echo "🌐 Testing connectivity..."

# Read ports from app.json (runtime config first, then repo template). Never hardcode.
APP_CONFIG="/Users/Shared/AIPrivateSearch/config/app.json"
if [ ! -f "$APP_CONFIG" ]; then
    APP_CONFIG="client/c01_client-first-app/config/app.json"
fi
FRONTEND_PORT=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$APP_CONFIG','utf8')).ports.frontend)}catch(e){process.exit(1)}")
BACKEND_PORT=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$APP_CONFIG','utf8')).ports.backend)}catch(e){process.exit(1)}")

if [ -z "$FRONTEND_PORT" ] || [ -z "$BACKEND_PORT" ]; then
    echo "❌ Could not read ports from app.json ($APP_CONFIG)"
else
    echo "ℹ️  Using ports from app.json — frontend: $FRONTEND_PORT, backend: $BACKEND_PORT"

    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        echo "✅ Backend API accessible"
    else
        echo "❌ Backend API not accessible"
    fi

    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo "✅ Frontend accessible"
    else
        echo "❌ Frontend not accessible"
    fi
fi

echo ""
echo "📊 Verification complete"