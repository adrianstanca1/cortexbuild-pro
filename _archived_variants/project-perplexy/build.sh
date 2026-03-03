#!/bin/bash

# Build script for Code Interpreter Web Application

set -e

echo "🚀 Building Code Interpreter Application"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+."
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma Client
echo "🔧 Generating Prisma client..."
cd packages/backend
npm run prisma:generate
cd ../..

# Build all packages
echo "🔨 Building packages..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Or start services individually:"
echo "  npm run dev:frontend  # Frontend only"
echo "  npm run dev:backend   # Backend only"
echo ""
