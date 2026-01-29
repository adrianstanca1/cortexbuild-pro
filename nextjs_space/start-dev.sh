#!/bin/bash

# CortexBuild Pro - Development Server Startup Script
# This script starts the full backend including:
# - Next.js development server
# - WebSocket server for real-time features
# - Database connection check

set -e

echo "🚀 Starting CortexBuild Pro Development Server..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from nextjs_space directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
    exit 1
fi

# Load environment variables
set -a
if ! source .env 2>/dev/null; then
    error "Failed to load .env file - check for syntax errors"
    exit 1
fi
set +a

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo "🔧 Checking Prisma Client..."
# Check if Prisma Client needs to be generated
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔧 Generating Prisma Client..."
    npx prisma generate
fi

echo "🗄️  Checking database connection..."
# Test database connection
if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection failed"
    echo "💡 Make sure PostgreSQL is running and DATABASE_URL is correct"
    echo ""
    echo "To start a local PostgreSQL with Docker:"
    echo "docker run --name cortexbuild-postgres -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=cortexbuild -p 5432:5432 -d postgres:15-alpine"
    echo ""
    read -p "Continue without database? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📊 Checking database schema..."
# Push schema to database (creates tables if they don't exist)
if npx prisma db push --skip-generate 2>/dev/null; then
    echo "✅ Database schema is up to date"
else
    echo "⚠️  Could not update database schema"
fi

echo ""
echo "✨ Starting development server..."
echo "📍 Application will be available at: http://localhost:3000"
echo "🔌 WebSocket server will run on: ws://localhost:3000/api/socketio"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Next.js development server
# The production-server.js will be used in production with WebSocket support
# For development, we use the standard Next.js dev server
npm run dev
