#!/bin/bash

# Run both Main Service and Chatbot Service
echo "🚀 Starting Bach Hoa Xanh Services..."

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Please run this script from the BE directory"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill 0
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Start Main Service in background
echo "📡 Starting Main Service on port 8000..."
python app/run.py &
MAIN_PID=$!

# Wait a bit for main service to start
sleep 3

# Start Chatbot Service in background
echo "🤖 Starting Chatbot Service on port 8001..."
cd chatbot_service
./start.sh &
CHATBOT_PID=$!

# Wait for services to start
sleep 5

echo ""
echo "✅ Services started successfully!"
echo "🌐 Main Service: http://localhost:8000"
echo "🤖 Chatbot Service: http://localhost:8001"
echo "📊 Main Health: http://localhost:8000/health"
echo "📊 Chatbot Health: http://localhost:8001/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
