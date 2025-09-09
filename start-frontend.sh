#!/bin/bash

echo "🚀 Starting Frontend Server"
echo "=========================="

cd /Users/Shared/repos/aisearchscore/client/c01_client-first-app

echo "📂 Current directory: $(pwd)"
echo "📄 Files in directory:"
ls -la | head -10

echo ""
echo "🔍 Testing npx serve..."

# Try different serve commands
echo "Trying: npx serve . -l 3000"
npx serve . -l 3000 &
PID1=$!
sleep 3

if kill -0 $PID1 2>/dev/null; then
    echo "✅ Frontend server started successfully on port 3000"
    echo "🌐 Access at: http://localhost:3000"
    echo "Press Ctrl+C to stop"
    wait $PID1
else
    echo "❌ First attempt failed, trying alternative..."
    
    echo "Trying: python3 -m http.server 3000"
    if command -v python3 &> /dev/null; then
        python3 -m http.server 3000
    else
        echo "❌ Python3 not available"
        echo "Trying: node -e \"require('http').createServer((req,res)=>{require('fs').createReadStream(req.url==='/'?'index.html':req.url.slice(1)).pipe(res)}).listen(3000)\""
        node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const file=req.url==='/'?'index.html':req.url.slice(1);const ext=path.extname(file);const contentType={'html':'text/html','js':'text/javascript','css':'text/css','json':'application/json'}[ext.slice(1)]||'text/plain';res.setHeader('Content-Type',contentType);fs.createReadStream(file).on('error',()=>{res.writeHead(404);res.end('Not Found')}).pipe(res)}).listen(3000,()=>console.log('Server running on http://localhost:3000'))"
    fi
fi