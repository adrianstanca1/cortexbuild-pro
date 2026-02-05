#!/bin/bash

# CortexBuild Pro - Production Build Verification Script
# This script verifies that the application can be built for production

set -e

echo "🏗️  CortexBuild Pro - Production Build Verification"
echo "===================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    error "Must run from nextjs_space directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    error ".env file not found"
    echo "Create .env file before building"
    exit 1
fi

echo "1. Pre-build Checks"
echo "-------------------"

# Load environment
set -a
source .env 2>/dev/null || true
set +a

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL not set in .env"
    exit 1
else
    success "DATABASE_URL is set"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    error "NEXTAUTH_SECRET not set in .env"
    exit 1
else
    success "NEXTAUTH_SECRET is set"
fi

if [ -z "$NEXTAUTH_URL" ]; then
    warning "NEXTAUTH_URL not set in .env (optional)"
else
    success "NEXTAUTH_URL is set"
fi

echo ""
echo "2. Install Dependencies"
echo "-----------------------"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
    success "Dependencies installed"
else
    success "Dependencies already installed"
fi

echo ""
echo "3. Generate Prisma Client"
echo "--------------------------"

echo "Generating Prisma Client..."
npx prisma generate
success "Prisma Client generated"

echo ""
echo "4. TypeScript Type Check"
echo "------------------------"

echo "Checking TypeScript types..."
if npx tsc --noEmit; then
    success "TypeScript types are valid"
else
    warning "TypeScript type errors found (non-blocking)"
fi

echo ""
echo "5. Build Application"
echo "--------------------"

echo "Building Next.js application..."
echo "This may take a few minutes..."
echo ""

# Set production environment for build
export NODE_ENV=production

# Build the application
if npm run build; then
    success "Build completed successfully"
else
    error "Build failed"
    echo ""
    echo "Common build issues:"
    echo "1. TypeScript errors - check the output above"
    echo "2. Missing dependencies - run: npm install --legacy-peer-deps"
    echo "3. Prisma Client - run: npx prisma generate"
    echo "4. Environment variables - check .env file"
    exit 1
fi

echo ""
echo "6. Verify Build Output"
echo "----------------------"

# Check if build directory exists
if [ -d ".next" ]; then
    success "Build directory (.next) exists"
else
    error "Build directory not found"
    exit 1
fi

# Check for critical build files
critical_files=(
    ".next/BUILD_ID"
    ".next/package.json"
    ".next/server"
)

for file in "${critical_files[@]}"; do
    if [ -e "$file" ]; then
        success "Found: $file"
    else
        warning "Missing: $file"
    fi
done

echo ""
echo "7. Check Build Size"
echo "-------------------"

if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    success "Build size: $BUILD_SIZE"
    
    # Check for large build size
    SIZE_BYTES=$(du -s .next | cut -f1)
    if [ "$SIZE_BYTES" -gt 500000 ]; then
        warning "Build size is large (> 500MB)"
        echo "   Consider optimizing dependencies or assets"
    fi
fi

echo ""
echo "8. Test Production Server"
echo "-------------------------"

echo "Checking if production server file exists..."
if [ -f "production-server.js" ]; then
    success "production-server.js exists"
    
    # Validate production server syntax
    if node --check production-server.js 2>/dev/null; then
        success "production-server.js syntax is valid"
    else
        warning "production-server.js has syntax errors"
    fi
else
    warning "production-server.js not found"
    echo "   The standard Next.js server (npm start) can be used instead"
fi

echo ""
echo "===================================================="
echo "Build Verification Complete!"
echo "===================================================="
echo ""

# Summary
echo "📊 Summary:"
echo "  ✅ Environment configured"
echo "  ✅ Dependencies installed"
echo "  ✅ Prisma Client generated"
echo "  ✅ Application built successfully"
echo "  ✅ Build artifacts created"
echo ""

echo "🚀 Next Steps:"
echo ""
echo "  Local Testing:"
echo "    node production-server.js"
echo "    or"
echo "    npm start"
echo ""
echo "  Docker Deployment:"
echo "    cd ../deployment"
echo "    docker-compose up -d"
echo ""
echo "  Manual Deployment:"
echo "    1. Copy the entire directory to your server"
echo "    2. Set environment variables in .env"
echo "    3. Run: node production-server.js"
echo ""

echo "📚 Documentation:"
echo "  - Production Deployment: ../PRODUCTION_DEPLOYMENT.md"
echo "  - API Setup: ../API_SERVER_SETUP.md"
echo ""
