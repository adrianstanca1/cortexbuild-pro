#!/bin/bash

# BuildPro Backend - Quick Start Script
# This script sets up and runs the BuildPro application with backend

set -e

echo "🏗️  BuildPro Backend Setup"
echo "========================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server && npm install && cd ..

# Start database
echo "🗄️  Starting PostgreSQL database..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Setup database
echo "🔧 Setting up database..."
cd server
npm run db:generate
npm run db:push
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting application..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""

# Start both frontend and backend
npm run dev:all
