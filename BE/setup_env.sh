#!/bin/bash

# Setup environment files for both services
echo "🚀 Setting up environment files for Nông sản xanh Services..."

# Setup main service .env
if [ ! -f ".env" ]; then
    echo "📋 Creating main service .env..."
    cp env.template .env
    echo "✅ Main service .env created from env.template"
    echo "📝 Please edit .env with your database and payment settings"
else
    echo "✅ Main service .env already exists"
fi

# Setup chatbot service .env
if [ ! -f "chatbot_service/.env" ]; then
    echo "🤖 Creating chatbot service .env..."
    cp chatbot_service/env.template chatbot_service/.env
    echo "✅ Chatbot service .env created from env.template"
    echo "📝 Please edit chatbot_service/.env with your Gemini API key"
else
    echo "✅ Chatbot service .env already exists"
fi

echo ""
echo "📋 Environment files setup complete!"
echo "📝 Next steps:"
echo "   1. Edit .env (main service database/payment settings)"
echo "   2. Edit chatbot_service/.env (Gemini API key)"
echo "   3. Run: ./run_both.sh (to start both services)"
