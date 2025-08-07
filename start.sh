#!/bin/bash

echo "Starting AI Search & Score Application..."

# Check if Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Warning: Ollama service not detected. Please start with 'ollama serve'"
fi

# Start backend server in background
echo "Starting backend server..."
cd server/s01_server-first-app
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