#!/bin/bash

echo "🚀 Starting AI Search & Score Application..."

# Kill any existing server processes to free up ports
echo "Stopping any existing servers..."
# Kill processes by port to ensure clean shutdown
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
# Also kill by process name as backup
pkill -f "node server.mjs" 2>/dev/null || true
pkill -f "npx serve" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
sleep 2

# Ensure Ollama service is running
echo "🔍 Checking Ollama service..."
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "🚀 Starting Ollama service..."
    if ! pgrep -f "ollama serve" > /dev/null; then
        ollama serve &
        sleep 3
    fi
    
    # Verify Ollama is accessible
    for i in {1..5}; do
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            echo "✅ Ollama is accessible"
            break
        fi
        if [ $i -eq 5 ]; then
            echo "❌ Ollama not accessible after 5 attempts"
            echo "Please check if Ollama is installed: ollama --version"
            exit 1
        fi
        echo "⏳ Waiting for Ollama... (attempt $i/5)"
        sleep 2
    done
else
    echo "✅ Ollama is running"
fi

# Simplified and reliable model management
echo "Checking model status..."

# Function to safely pull a model with retries
pull_model_safe() {
    local model="$1"
    echo "📥 Pulling $model..."
    
    if timeout 600 ollama pull "$model" 2>/dev/null; then
        echo "✅ $model ready"
        return 0
    else
        echo "⚠️  Failed to pull $model - you can update it later via Models page"
        return 1
    fi
}

# Get all models from models-list.json
if [ -f "client/c01_client-first-app/config/models-list.json" ]; then
    REQUIRED_MODELS=$(grep '"modelName"' client/c01_client-first-app/config/models-list.json | cut -d'"' -f4 | sort -u)
else
    echo "⚠️  models-list.json not found, using fallback models"
    REQUIRED_MODELS="qwen2:0.5b gemma2:2b qwen2.5:3b"
fi

echo "🔍 Checking all required models..."
for model in $REQUIRED_MODELS; do
    if ! ollama list 2>/dev/null | grep -q "^${model}"; then
        echo "❌ Missing: $model"
        pull_model_safe "$model"
        sleep 2  # Brief pause between models
    else
        echo "✅ $model available"
    fi
done

echo "💡 To update or install additional models, use the Models page in the application"

# Start backend server in background
echo "Installing backend dependencies..."
cd server/s01_server-first-app

# Check for .env file in /Users/Shared
if [ ! -f /Users/Shared/.env ]; then
    echo "⚠️  .env file not found in /Users/Shared!"
    echo "Please create /Users/Shared/.env with your database configuration."
    echo "Example .env file contents:"
    echo "NODE_ENV=development"
    echo "DB_HOST=your.database.host"
    echo "DB_PORT=3306"
    echo "DB_USERNAME=your_username"
    echo "DB_PASSWORD=your_password"
    echo "DB_DATABASE=aisearchscore"
    echo ""
    read -p "Press Enter to continue without database functionality..."
else
    echo "✅ .env file found in /Users/Shared"
fi

npm install --silent
echo "Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait for backend to start and verify it's running
sleep 3
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend client
echo "Starting frontend client..."
cd ../../client/c01_client-first-app

# Kill any existing serve processes
pkill -f "npx serve" 2>/dev/null || true
sleep 1

# Start frontend with the working command
npx serve . -l 3000 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend server started successfully"
else
    echo "❌ Frontend server failed to start"
fi

echo ""
echo "✅ Application started successfully!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:3001"
echo ""
echo "🌐 Opening Chrome browser..."
open -a "Google Chrome" http://localhost:3000 2>/dev/null || open http://localhost:3000
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; lsof -ti :3001 | xargs kill -9 2>/dev/null; lsof -ti :3000 | xargs kill -9 2>/dev/null; pkill -f 'npx serve' 2>/dev/null; pkill -f 'node server.mjs' 2>/dev/null; pkill -f 'npm start' 2>/dev/null; exit" INT

# Keep both servers running
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
    sleep 5
done

echo "One or both servers stopped unexpectedly"
echo "Backend running: $(kill -0 $BACKEND_PID 2>/dev/null && echo 'Yes' || echo 'No')"
echo "Frontend running: $(kill -0 $FRONTEND_PID 2>/dev/null && echo 'Yes' || echo 'No')"