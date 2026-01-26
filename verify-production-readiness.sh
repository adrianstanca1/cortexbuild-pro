#!/bin/bash

# ==================================================================
# CortexBuild Pro - Production Readiness Verification Script
# ==================================================================
# This script verifies that the application is ready for production
# deployment by checking all critical components and configurations.
# ==================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CortexBuild Pro - Production Readiness Verification    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Helper functions
print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ERRORS=$((ERRORS + 1))
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# ==================================================================
# 1. Check Repository Structure
# ==================================================================
echo ""
print_check "Checking repository structure..."

if [ -d "nextjs_space" ]; then
    print_success "Application directory exists"
else
    print_error "Application directory 'nextjs_space' not found"
fi

if [ -d "deployment" ]; then
    print_success "Deployment directory exists"
else
    print_error "Deployment directory not found"
fi

if [ -f "deployment/Dockerfile" ]; then
    print_success "Dockerfile exists"
else
    print_error "Dockerfile not found"
fi

if [ -f "deployment/docker-compose.yml" ]; then
    print_success "Docker Compose configuration exists"
else
    print_error "Docker Compose configuration not found"
fi

# ==================================================================
# 2. Check Required Files
# ==================================================================
echo ""
print_check "Checking required application files..."

REQUIRED_FILES=(
    "nextjs_space/package.json"
    "nextjs_space/prisma/schema.prisma"
    "nextjs_space/production-server.js"
    "nextjs_space/entrypoint.sh"
    "deployment/.env.example"
    "deployment/nginx.conf"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
    fi
done

# ==================================================================
# 3. Check Node.js Dependencies
# ==================================================================
echo ""
print_check "Checking Node.js dependencies..."

cd nextjs_space

if [ -f "package.json" ]; then
    print_success "package.json found"
    
    if [ -d "node_modules" ]; then
        print_success "node_modules directory exists"
    else
        print_warning "node_modules not found - run 'npm install --legacy-peer-deps'"
    fi
else
    print_error "package.json not found"
fi

# ==================================================================
# 4. Check Build Artifacts
# ==================================================================
echo ""
print_check "Checking build status..."

if [ -d ".next" ]; then
    print_success "Build artifacts found (.next directory exists)"
    
    if [ -d ".next/static" ]; then
        print_success "Static assets generated"
    fi
    
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        if [ -n "$BUILD_ID" ] && [[ "$BUILD_ID" =~ ^[a-zA-Z0-9_-]+$ ]]; then
            print_success "Build ID: $BUILD_ID"
        else
            print_warning "Build ID exists but appears invalid"
        fi
    fi
else
    print_warning "Build artifacts not found - run 'npm run build'"
fi

# ==================================================================
# 5. Check Prisma Configuration
# ==================================================================
echo ""
print_check "Checking Prisma ORM configuration..."

if [ -f "prisma/schema.prisma" ]; then
    print_success "Prisma schema found"
    
    # Check if Prisma client is generated
    if [ -d "node_modules/@prisma/client" ]; then
        print_success "Prisma Client generated"
    else
        print_warning "Prisma Client not generated - run 'npx prisma generate'"
    fi
else
    print_error "Prisma schema not found"
fi

# ==================================================================
# 6. Check Environment Configuration
# ==================================================================
echo ""
print_check "Checking environment configuration..."

cd ../deployment

if [ -f ".env.example" ]; then
    print_success "Environment template exists (.env.example)"
    
    # Check for critical environment variables in example
    CRITICAL_VARS=("POSTGRES_PASSWORD" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "DATABASE_URL")
    
    for var in "${CRITICAL_VARS[@]}"; do
        if grep -q "$var" .env.example; then
            print_success "Template includes: $var"
        else
            print_error "Template missing: $var"
        fi
    done
else
    print_error ".env.example not found"
fi

if [ -f ".env" ]; then
    print_warning ".env file exists (should not be committed to git)"
else
    print_success "No .env file found (good - not committed)"
fi

# ==================================================================
# 7. Check Docker Configuration
# ==================================================================
echo ""
print_check "Checking Docker configuration..."

if command -v docker &> /dev/null; then
    print_success "Docker is installed"
    docker --version
else
    print_error "Docker is not installed"
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    print_success "Docker Compose is available"
    if docker compose version &> /dev/null; then
        docker compose version
    else
        docker-compose --version
    fi
else
    print_error "Docker Compose is not installed"
fi

# ==================================================================
# 8. Check Security Configuration
# ==================================================================
echo ""
print_check "Checking security configuration..."

cd ..

# Check .gitignore
if [ -f ".gitignore" ]; then
    print_success ".gitignore exists"
    
    IGNORED_ITEMS=(".env" "node_modules" ".next")
    for item in "${IGNORED_ITEMS[@]}"; do
        if grep -q "$item" .gitignore; then
            print_success ".gitignore includes: $item"
        else
            print_warning ".gitignore missing: $item"
        fi
    done
else
    print_error ".gitignore not found"
fi

# Check for secrets in code
echo ""
print_check "Scanning for potential secrets..."

if command -v grep &> /dev/null; then
    # Look for common secret patterns (basic check)
    SECRET_PATTERNS=("password.*=.*['\"]" "secret.*=.*['\"]" "api.*key.*=.*['\"]")
    
    for pattern in "${SECRET_PATTERNS[@]}"; do
        if grep -r -i "$pattern" deployment/.env.example > /dev/null 2>&1; then
            print_success "Template has placeholder for: $pattern"
        fi
    done
    
    # Check if actual secrets exist in committed files (excluding .env files)
    if grep -r -i "password.*=.*['\"][^_placeholder]" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.env" . > /dev/null 2>&1; then
        print_warning "Potential hardcoded passwords found - manual review recommended"
    else
        print_success "No obvious hardcoded passwords detected"
    fi
fi

# ==================================================================
# 9. Check Documentation
# ==================================================================
echo ""
print_check "Checking documentation..."

DOCS=(
    "README.md"
    "PRODUCTION_DEPLOYMENT.md"
    "deployment/README.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_success "Documentation exists: $doc"
    else
        print_warning "Documentation missing: $doc"
    fi
done

# ==================================================================
# 10. Check Deployment Scripts
# ==================================================================
echo ""
print_check "Checking deployment scripts..."

cd deployment

SCRIPTS=(
    "deploy-production.sh"
    "deploy-from-github.sh"
    "backup.sh"
    "restore.sh"
    "verify-deployment.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            print_success "Script executable: $script"
        else
            print_warning "Script exists but not executable: $script"
        fi
    else
        print_warning "Script missing: $script"
    fi
done

# ==================================================================
# 11. Test Scripts Syntax
# ==================================================================
echo ""
print_check "Testing shell script syntax..."

for script in *.sh; do
    if [ -f "$script" ]; then
        if bash -n "$script" 2>/dev/null; then
            print_success "Syntax OK: $script"
        else
            print_error "Syntax error in: $script"
        fi
    fi
done

# ==================================================================
# Summary
# ==================================================================
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Verification Summary                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Application is production ready.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}! ${WARNINGS} warning(s) found. Review recommended but deployment can proceed.${NC}"
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} error(s) and ${WARNINGS} warning(s) found.${NC}"
    echo -e "${RED}  Please address critical errors before deploying to production.${NC}"
    exit 1
fi
