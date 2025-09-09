#!/bin/bash

echo "🔍 Frontend Debugging Script"
echo "============================"

cd /Users/Shared/repos/aisearchscore/client/c01_client-first-app

echo "📂 Current directory: $(pwd)"
echo ""

# Check if backend is running
echo "🔍 Checking backend connectivity..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend API accessible"
else
    echo "❌ Backend API not accessible - this could cause frontend errors"
fi

# Check if Ollama is running
echo "🔍 Checking Ollama connectivity..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama accessible"
else
    echo "❌ Ollama not accessible - this could cause frontend errors"
fi

echo ""
echo "🔍 Checking critical files..."
CRITICAL_FILES=(
    "index.html"
    "shared/common.js"
    "shared/styles.css"
    "shared/header.html"
    "shared/footer.html"
    "csrf.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

echo ""
echo "🔍 Testing file serving..."
echo "Starting Node.js HTTP server for testing..."
echo "🌐 Open http://localhost:3000 in browser"
echo "📋 Watch for JavaScript errors in browser console"
echo "Press Ctrl+C to stop"

node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? 'index.html' : req.url.slice(1);
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    }[ext] || 'text/plain';
    
    console.log('Request:', req.url, '->', filePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log('Error loading:', filePath, err.message);
            res.writeHead(404);
            res.end('Not Found: ' + filePath);
        } else {
            res.setHeader('Content-Type', contentType);
            res.writeHead(200);
            res.end(data);
        }
    });
});

server.listen(3000, () => {
    console.log('🌐 Server running on http://localhost:3000');
    console.log('📋 Watch for JavaScript errors in browser console');
    console.log('Press Ctrl+C to stop');
});
"