#!/bin/bash
# Deployment Validation Script
# This script validates that the application is ready for deployment

set -e

echo "🔍 ConstructAI Deployment Validation"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

# 1. Check Prerequisites
echo "1. Checking Prerequisites..."
check_command node || exit 1
check_command npm || exit 1
check_command docker || echo -e "${YELLOW}⚠${NC} docker not found - needed for containerized deployment"
echo ""

# 2. Check Node Version
echo "2. Checking Node.js Version..."
NODE_VERSION=$(node --version)
echo "   Node version: $NODE_VERSION"
echo ""

# 3. Check Dependencies
echo "3. Checking Dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Run: npm install --legacy-peer-deps"
fi
echo ""

# 4. Check Prisma Client
echo "4. Checking Prisma Client..."
if [ -d "node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✓${NC} Prisma client exists"
else
    echo -e "${YELLOW}⚠${NC} Prisma client not generated. Run: cd packages/backend && npm run prisma:generate"
fi
echo ""

# 5. Check Build Artifacts
echo "5. Checking Build Artifacts..."
if [ -d "packages/backend/dist" ]; then
    echo -e "${GREEN}✓${NC} Backend built"
else
    echo -e "${YELLOW}⚠${NC} Backend not built"
fi

if [ -d "packages/frontend/dist" ]; then
    echo -e "${GREEN}✓${NC} Frontend built"
else
    echo -e "${YELLOW}⚠${NC} Frontend not built"
fi
echo ""

# 6. Check Environment Configuration
echo "6. Checking Environment Configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
else
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠${NC} .env not found. Copy from .env.example: cp .env.example .env"
    else
        echo -e "${RED}✗${NC} .env.example not found"
    fi
fi
echo ""

# 7. Check Docker Files
echo "7. Checking Docker Configuration..."
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓${NC} docker-compose.yml exists"
else
    echo -e "${RED}✗${NC} docker-compose.yml not found"
fi

if [ -f "packages/backend/Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Backend Dockerfile exists"
else
    echo -e "${RED}✗${NC} Backend Dockerfile not found"
fi

if [ -f "packages/frontend/Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Frontend Dockerfile exists"
else
    echo -e "${RED}✗${NC} Frontend Dockerfile not found"
fi
echo ""

# Summary
echo "===================================="
echo "Validation Complete!"
echo ""
echo "Next Steps:"
echo "  1. If dependencies missing: npm install --legacy-peer-deps"
echo "  2. If Prisma not generated: cd packages/backend && npm run prisma:generate"
echo "  3. To build: npm run build"
echo "  4. To deploy with Docker: docker compose up -d"
echo "  5. To deploy manually: npm start"
echo ""
echo "For full deployment instructions, see DEPLOYMENT_GUIDE.md"
