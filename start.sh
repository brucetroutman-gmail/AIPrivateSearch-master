#!/bin/bash

echo "Starting AI Search & Score Application..."

# Kill any existing server processes to free up ports
echo "Stopping any existing servers..."
pkill -f "node server.mjs" 2>/dev/null || true
pkill -f "npx serve" 2>/dev/null || true
sleep 1

# Check if Ollama is available
echo "Checking Ollama availability..."
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "❌ Ollama not available at http://localhost:11434"
    echo "📥 Please install Ollama from: https://ollama.com/download"
    echo "🚀 Then run: ollama serve"
    exit 1
fi
echo "✅ Ollama is running"

# Pull required models
echo "Pulling required models..."
MODELS=$(cat client/c01_client-first-app/config/models-list.json | grep '"modelName"' | cut -d'"' -f4 | sort -u)
for model in $MODELS; do
    echo "📥 Pulling $model..."
    ollama pull "$model"
    echo "✅ $model ready"
done
echo "✅ All models ready"

# Start backend server in background
echo "Installing backend dependencies..."
cd server/s01_server-first-app
npm install
echo "Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend client
echo "Starting frontend client..."
cd ../../client/c01_client-first-app
npx serve . &
FRONTEND_PID=$!

echo ""
echo "✅ Application started successfully!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait