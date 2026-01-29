#!/bin/bash

# CortexBuild Pro - Database Setup Script
# This script initializes the database schema and optionally seeds data

set -e

echo "🗄️  CortexBuild Pro - Database Setup"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from nextjs_space directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with DATABASE_URL"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env"
    exit 1
fi

echo "Database URL: ${DATABASE_URL:0:50}..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo ""

# Test database connection
echo "🔌 Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo ""
    echo "Please check:"
    echo "  - DATABASE_URL is correct in .env"
    echo "  - PostgreSQL server is running"
    echo "  - Network connectivity to database"
    exit 1
fi
echo ""

# Push schema to database
echo "📊 Pushing database schema..."
echo "This will create/update tables to match prisma/schema.prisma"
npx prisma db push --skip-generate
echo ""

echo "✅ Database schema synchronized"
echo ""

# Ask about seeding
read -p "🌱 Do you want to seed the database with initial data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo ""
    echo "✅ Database seeded successfully"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "You can now start the application with:"
echo "  ./start-dev.sh    (development)"
echo "  npm run build && node production-server.js    (production)"
echo ""
echo "To view data in the database:"
echo "  npx prisma studio"
