#!/bin/bash
# Hostinger Deployment Fix Script
# This script prepares the server for Hostinger deployment

echo "🔧 Fixing Hostinger Deployment Issues..."

cd server

# 1. Ensure all TypeScript dependencies are in dependencies (not devDependencies)
echo "📦 Moving TypeScript to dependencies..."
npm install --save typescript ts-node @types/node @types/express

# 2. Create a production-ready package.json script
echo "📝 Updating package.json scripts..."

# 3. Build the project
echo "🏗️  Building TypeScript..."
npm run build

# 4. Test the build
echo "✅ Testing build output..."
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful - dist/index.js exists"
else
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

# 5. Verify node_modules
echo "📦 Verifying dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "⚠️  Running npm install..."
    npm install
fi

echo ""
echo "✅ Server is ready for Hostinger deployment!"
echo ""
echo "📋 Hostinger Configuration:"
echo "   Root directory: ./server"
echo "   Build command: npm install && npm run build"
echo "   Start command: node dist/index.js"
echo "   Node version: 20.x or 22.x"
