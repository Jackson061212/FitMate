#!/bin/bash

# Start FitMate Development Environment
echo "Starting FitMate Development Environment..."

# Start backend server in background
echo "Starting backend server on port 5001..."
cd backend && node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server on port 3000..."
cd .. && npm start &
FRONTEND_PID=$!

echo "Both servers are starting..."
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
