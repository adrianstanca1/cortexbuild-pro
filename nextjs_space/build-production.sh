#!/bin/bash
# Production Build Script for CortexBuild Pro
# This script prepares and builds the Next.js application for production deployment

set -e  # Exit on error

echo "=========================================="
echo "CortexBuild Pro - Production Build"
echo "=========================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the nextjs_space directory."
    exit 1
fi

echo "Step 1: Cleaning previous build artifacts..."
rm -rf .next node_modules || true
echo "✓ Cleaned"
echo ""

echo "Step 2: Installing dependencies..."
npm install --legacy-peer-deps
echo "✓ Dependencies installed"
echo ""

echo "Step 3: Generating Prisma Client..."
npx prisma generate
echo "✓ Prisma Client generated"
echo ""

echo "Step 4: Building Next.js application..."
npm run build
echo "✓ Build completed"
echo ""

echo "=========================================="
echo "Production build completed successfully!"
echo "=========================================="
echo ""
echo "Build output located in: .next/"
echo "To start the production server: npm start"
echo ""
echo "Note: Ensure environment variables are properly configured"
echo "in .env before starting the production server."
