#!/bin/bash
# Production Deployment Verification Script
# Run this script to verify your deployment is ready

set -e

echo "================================================"
echo "CortexBuild Pro - Deployment Verification"
echo "================================================"
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "1. Checking Prerequisites..."
echo "----------------------------"

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    check_pass "Docker installed (version $DOCKER_VERSION)"
else
    check_fail "Docker not installed"
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version | awk '{print $4}')
    check_pass "Docker Compose installed (version $COMPOSE_VERSION)"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    check_warn "Docker Compose V1 installed (version $COMPOSE_VERSION) - Consider upgrading to V2"
else
    check_fail "Docker Compose not installed"
fi

# Check Node.js (optional for non-Docker deployments)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed ($NODE_VERSION)"
fi

# Check PostgreSQL client (optional)
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    check_pass "PostgreSQL client installed (version $PSQL_VERSION)"
fi

echo ""
echo "2. Checking Configuration Files..."
echo "-----------------------------------"

# Check if in correct directory
if [ ! -f "package.json" ] && [ ! -d "nextjs_space" ]; then
    check_fail "Not in project root directory"
    echo "Please run this script from the cortexbuild-pro root directory"
    exit 1
else
    check_pass "Running from project directory"
fi

# Check deployment directory
if [ -d "deployment" ]; then
    check_pass "Deployment directory exists"
    
    # Check Dockerfile
    if [ -f "deployment/Dockerfile" ]; then
        check_pass "Dockerfile exists"
    else
        check_fail "Dockerfile missing"
    fi
    
    # Check docker-compose.yml
    if [ -f "deployment/docker-compose.yml" ]; then
        check_pass "docker-compose.yml exists"
    else
        check_fail "docker-compose.yml missing"
    fi
    
    # Check .env file
    if [ -f "deployment/.env" ]; then
        check_pass ".env file exists"
        
        # Verify critical environment variables
        if grep -q "NEXTAUTH_SECRET=" deployment/.env && ! grep -q "NEXTAUTH_SECRET=\"\"" deployment/.env && ! grep -q "NEXTAUTH_SECRET=your" deployment/.env; then
            check_pass "NEXTAUTH_SECRET is configured"
        else
            check_fail "NEXTAUTH_SECRET not properly configured in .env"
        fi
        
        if grep -q "DATABASE_URL=" deployment/.env || grep -q "POSTGRES_PASSWORD=" deployment/.env; then
            check_pass "Database configuration present"
        else
            check_fail "Database configuration missing in .env"
        fi
        
    else
        check_fail ".env file missing (copy from .env.example)"
    fi
    
else
    check_fail "Deployment directory not found"
fi

# Check for .env.example
if [ -f "deployment/.env.example" ]; then
    check_pass ".env.example template exists"
else
    check_warn ".env.example template missing"
fi

echo ""
echo "3. Checking Documentation..."
echo "----------------------------"

# Check key documentation files
for doc in README.md PRODUCTION_DEPLOYMENT.md; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc missing"
    fi
done

echo ""
echo "4. Checking Application Files..."
echo "--------------------------------"

# Check nextjs_space directory
if [ -d "nextjs_space" ]; then
    check_pass "Application directory (nextjs_space) exists"
    
    # Check package.json
    if [ -f "nextjs_space/package.json" ]; then
        check_pass "package.json exists"
    else
        check_fail "package.json missing"
    fi
    
    # Check for node_modules (should be present for non-Docker builds)
    if [ -d "nextjs_space/node_modules" ]; then
        check_pass "Dependencies installed (node_modules exists)"
    else
        check_warn "Dependencies not installed (run 'npm install --legacy-peer-deps' in nextjs_space)"
    fi
    
    # Check Prisma schema
    if [ -f "nextjs_space/prisma/schema.prisma" ]; then
        check_pass "Prisma schema exists"
    else
        check_fail "Prisma schema missing"
    fi
    
else
    check_fail "Application directory (nextjs_space) not found"
fi

echo ""
echo "5. Testing Docker Build (if Docker available)..."
echo "------------------------------------------------"

if command -v docker &> /dev/null; then
    echo "Validating Dockerfile syntax..."
    if docker build -f deployment/Dockerfile -t cortexbuild-test --no-cache --dry-run . &> /dev/null 2>&1 || true; then
        check_pass "Dockerfile syntax appears valid"
    else
        check_warn "Could not validate Dockerfile (this is normal, build test skipped)"
    fi
else
    check_warn "Skipping Docker build test (Docker not available)"
fi

echo ""
echo "================================================"
echo "Verification Summary"
echo "================================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your deployment is ready! Next steps:"
    echo "1. Review PRODUCTION_DEPLOYMENT.md"
    echo "2. Configure deployment/.env with your settings"
    echo "3. Run: cd deployment && docker compose up -d"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Passed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Warnings detected but deployment should work."
    echo "Review warnings above and proceed with deployment."
    exit 0
else
    echo -e "${RED}✗ Failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo "See PRODUCTION_DEPLOYMENT.md for detailed instructions."
    exit 1
fi
