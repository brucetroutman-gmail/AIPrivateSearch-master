#!/bin/bash

echo "🚀 Starting AI Search & Score Application..."

# Kill any existing server processes to free up ports
echo "Stopping any existing servers..."
pkill -f "node server.mjs" 2>/dev/null || true
pkill -f "npx serve" 2>/dev/null || true
sleep 1

# Quick check if Ollama is running
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "❌ Ollama not running. Please run: bash load-aiss.sh"
    exit 1
fi
echo "✅ Ollama is running"

# Check and pull required models
echo "Checking model status..."
LAST_PULL_FILE=".last_model_pull"
CURRENT_TIME=$(date +%s)
SHOULD_UPDATE=false
MISSING_MODELS=()

# Get list of required models
REQUIRED_MODELS=$(grep '"modelName"' client/c01_client-first-app/config/models-list.json | cut -d'"' -f4 | sort -u)

# Get list of installed models
INSTALLED_MODELS=$(ollama list | tail -n +2 | awk '{print $1}' | sed 's/:latest$//')

# Check for missing models
echo "🔍 Checking for missing models..."
for model in $REQUIRED_MODELS; do
    if ! echo "$INSTALLED_MODELS" | grep -q "^${model}$"; then
        MISSING_MODELS+=("$model")
        echo "❌ Missing: $model"
    fi
done

# Check if we need to update (24 hour check)
if [ -f "$LAST_PULL_FILE" ]; then
    LAST_PULL_TIME=$(cat "$LAST_PULL_FILE")
    TIME_DIFF=$((CURRENT_TIME - LAST_PULL_TIME))
    # 86400 seconds = 24 hours
    if [ $TIME_DIFF -gt 86400 ]; then
        SHOULD_UPDATE=true
        echo "⏰ Last model update was over 24 hours ago"
    fi
else
    SHOULD_UPDATE=true
    echo "📥 First time setup detected"
fi

# Pull missing models immediately
if [ ${#MISSING_MODELS[@]} -gt 0 ]; then
    echo "📥 Pulling missing models..."
    for model in "${MISSING_MODELS[@]}"; do
        echo "📥 Pulling $model..."
        ollama pull "$model"
        if [ $? -eq 0 ]; then
            echo "✅ $model ready"
        else
            echo "❌ Failed to pull $model"
        fi
    done
fi

# Update all models if needed (24 hour check)
if [ "$SHOULD_UPDATE" = true ] && [ ${#MISSING_MODELS[@]} -eq 0 ]; then
    echo "🔄 Updating all models..."
    for model in $REQUIRED_MODELS; do
        echo "🔄 Updating $model..."
        ollama pull "$model"
    done
    echo "$CURRENT_TIME" > "$LAST_PULL_FILE"
    echo "✅ All models updated"
elif [ ${#MISSING_MODELS[@]} -gt 0 ]; then
    # Update timestamp after pulling missing models
    echo "$CURRENT_TIME" > "$LAST_PULL_FILE"
    echo "✅ Missing models installed"
else
    echo "✅ All models ready (using cached versions)"
fi

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
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; pkill -f 'npx serve' 2>/dev/null; pkill -f 'node server.mjs' 2>/dev/null; exit" INT

# Keep both servers running
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
    sleep 5
done

echo "One or both servers stopped unexpectedly"
echo "Backend running: $(kill -0 $BACKEND_PID 2>/dev/null && echo 'Yes' || echo 'No')"
echo "Frontend running: $(kill -0 $FRONTEND_PID 2>/dev/null && echo 'Yes' || echo 'No')"