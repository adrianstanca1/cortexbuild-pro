#!/bin/bash

# CortexBuild Pro - Setup Validation Script
# This script validates that all components are properly configured

set -e

echo "🔍 CortexBuild Pro - Setup Validation"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

echo "1. Checking Environment Configuration"
echo "--------------------------------------"

# Check .env file exists
if [ -f ".env" ]; then
    success ".env file exists"
else
    error ".env file not found"
    echo "   Run: cp .env.example .env"
    exit 1
fi

# Load environment variables
set -a
source .env 2>/dev/null || true
set +a

# Check critical environment variables
if [ -n "$DATABASE_URL" ]; then
    success "DATABASE_URL is set"
else
    error "DATABASE_URL not set in .env"
fi

if [ -n "$NEXTAUTH_SECRET" ]; then
    success "NEXTAUTH_SECRET is set"
else
    error "NEXTAUTH_SECRET not set in .env"
fi

if [ -n "$NEXTAUTH_URL" ]; then
    success "NEXTAUTH_URL is set: $NEXTAUTH_URL"
else
    warning "NEXTAUTH_URL not set in .env"
fi

echo ""
echo "2. Checking Dependencies"
echo "------------------------"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js installed: $NODE_VERSION"
    
    # Check if version is 20+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 20 ]; then
        success "Node.js version is compatible (>= 20)"
    else
        warning "Node.js version should be 20 or higher"
    fi
else
    error "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    success "npm installed: $NPM_VERSION"
else
    error "npm not found"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    success "Dependencies installed (node_modules exists)"
else
    warning "Dependencies not installed"
    echo "   Run: npm install --legacy-peer-deps"
fi

echo ""
echo "3. Checking Project Structure"
echo "-----------------------------"

# Check critical directories
dirs=("app" "app/api" "components" "lib" "prisma" "server")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        success "Directory exists: $dir"
    else
        error "Directory missing: $dir"
    fi
done

# Check critical files
files=("prisma/schema.prisma" "lib/db.ts" "lib/auth-options.ts" "production-server.js" "next.config.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        success "File exists: $file"
    else
        error "File missing: $file"
    fi
done

echo ""
echo "4. Checking Scripts"
echo "-------------------"

if [ -f "start-dev.sh" ] && [ -x "start-dev.sh" ]; then
    success "start-dev.sh exists and is executable"
else
    warning "start-dev.sh not found or not executable"
fi

if [ -f "setup-database.sh" ] && [ -x "setup-database.sh" ]; then
    success "setup-database.sh exists and is executable"
else
    warning "setup-database.sh not found or not executable"
fi

echo ""
echo "5. Checking Prisma Setup"
echo "------------------------"

if [ -d "node_modules/.prisma" ]; then
    success "Prisma Client generated"
elif [ -d "node_modules" ]; then
    warning "Prisma Client not generated"
    echo "   Run: npx prisma generate"
else
    warning "Dependencies not installed yet"
fi

echo ""
echo "6. Checking Database Connectivity (Optional)"
echo "---------------------------------------------"

if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
        success "Database connection successful"
    else
        warning "Database connection failed (this is OK if DB not set up yet)"
        echo "   To setup: ./setup-database.sh"
    fi
elif [ -z "$DATABASE_URL" ]; then
    warning "DATABASE_URL not set - cannot test database"
else
    warning "psql not installed - skipping database test"
fi

echo ""
echo "7. Checking Optional Services"
echo "-----------------------------"

if [ -n "$AWS_BUCKET_NAME" ]; then
    success "AWS S3 configured"
else
    warning "AWS S3 not configured (optional for file uploads)"
fi

if [ -n "$GOOGLE_CLIENT_ID" ]; then
    success "Google OAuth configured"
else
    warning "Google OAuth not configured (optional for social login)"
fi

if [ -n "$SENDGRID_API_KEY" ]; then
    success "SendGrid configured"
else
    warning "SendGrid not configured (optional for emails)"
fi

if [ -n "$ABACUSAI_API_KEY" ] || [ -n "$GEMINI_API_KEY" ]; then
    success "AI provider configured"
else
    warning "AI provider not configured (optional for AI features)"
fi

echo ""
echo "======================================"
echo "Validation Complete!"
echo "======================================"
echo ""
echo "📚 Next Steps:"
echo ""

if [ ! -d "node_modules" ]; then
    echo "1. Install dependencies:"
    echo "   npm install --legacy-peer-deps"
    echo ""
fi

if [ ! -d "node_modules/.prisma" ]; then
    echo "2. Generate Prisma Client:"
    echo "   npx prisma generate"
    echo ""
fi

echo "3. Setup database:"
echo "   ./setup-database.sh"
echo ""
echo "4. Start development server:"
echo "   ./start-dev.sh"
echo ""
echo "5. Access the application:"
echo "   http://localhost:3000"
echo ""
echo "📖 Documentation:"
echo "   - API Server Setup: ../API_SERVER_SETUP.md"
echo "   - API Endpoints: ../API_ENDPOINTS.md"
echo "   - Backend Connectivity: ../BACKEND_FRONTEND_CONNECTIVITY.md"
echo ""
