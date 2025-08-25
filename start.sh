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

# Pull required models (only if not pulled in last 24 hours)
echo "Checking model status..."
LAST_PULL_FILE=".last_model_pull"
CURRENT_TIME=$(date +%s)
SHOULD_PULL=false

if [ -f "$LAST_PULL_FILE" ]; then
    LAST_PULL_TIME=$(cat "$LAST_PULL_FILE")
    TIME_DIFF=$((CURRENT_TIME - LAST_PULL_TIME))
    # 86400 seconds = 24 hours
    if [ $TIME_DIFF -gt 86400 ]; then
        SHOULD_PULL=true
        echo "⏰ Last model pull was over 24 hours ago, updating models..."
    else
        echo "✅ Models were pulled recently (within 24 hours), skipping pull"
    fi
else
    SHOULD_PULL=true
    echo "📥 First time setup, pulling models..."
fi

if [ "$SHOULD_PULL" = true ]; then
    MODELS=$(cat client/c01_client-first-app/config/models-list.json | grep '"modelName"' | cut -d'"' -f4 | sort -u)
    for model in $MODELS; do
        echo "📥 Pulling $model..."
        ollama pull "$model"
        echo "✅ $model ready"
    done
    # Record the current time
    echo "$CURRENT_TIME" > "$LAST_PULL_FILE"
    echo "✅ All models updated"
else
    echo "✅ All models ready (using cached versions)"
fi

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