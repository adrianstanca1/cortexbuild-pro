#!/usr/bin/env bash
# Startup Validation Script
# Validates that the CortexBuild Pro platform is properly configured and ready to run

set -e

echo "🔍 CortexBuild Pro - Startup Validation"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check if a directory exists
dir_exists() {
    [ -d "$1" ]
}

echo "📦 Checking Dependencies..."
echo "----------------------------"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
    
    # Check if version is 18+ (simple numeric comparison)
    NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v//' | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ] 2>/dev/null; then
        : # Version OK
    else
        echo -e "${YELLOW}⚠${NC} Node.js version 18+ recommended (current: $NODE_VERSION)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} Node.js not found"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm installed: v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    ERRORS=$((ERRORS + 1))
fi

# Check tsx
if command_exists tsx || [ -f "node_modules/.bin/tsx" ]; then
    echo -e "${GREEN}✓${NC} tsx available"
else
    echo -e "${YELLOW}⚠${NC} tsx not found - will be installed with dependencies"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "📁 Checking Project Structure..."
echo "--------------------------------"

# Check critical directories
DIRS=("src" "server" "server/routes" "server/controllers" "server/services" "public" "scripts" "docs")
for dir in "${DIRS[@]}"; do
    if dir_exists "$dir"; then
        echo -e "${GREEN}✓${NC} Directory exists: $dir"
    else
        echo -e "${RED}✗${NC} Directory missing: $dir"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "📄 Checking Critical Files..."
echo "-----------------------------"

# Check critical files
FILES=(
    "package.json"
    "tsconfig.json"
    "vite.config.ts"
    "server/index.ts"
    "server/database.ts"
    "server/socket.ts"
    "src/App.tsx"
    "src/contexts/AuthContext.tsx"
    "src/contexts/ProjectContext.tsx"
    "src/contexts/WebSocketContext.tsx"
    "src/services/db.ts"
)

for file in "${FILES[@]}"; do
    if file_exists "$file"; then
        echo -e "${GREEN}✓${NC} File exists: $file"
    else
        echo -e "${RED}✗${NC} File missing: $file"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "🔧 Checking Configuration..."
echo "----------------------------"

# Check if node_modules exists
if dir_exists "node_modules"; then
    echo -e "${GREEN}✓${NC} Dependencies installed (node_modules exists)"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed - run 'npm install'"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for .env file
if file_exists ".env"; then
    echo -e "${GREEN}✓${NC} Environment file (.env) exists"
else
    if file_exists ".env.example"; then
        echo -e "${YELLOW}⚠${NC} No .env file - copy from .env.example"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} No .env.example file found"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "📚 Checking Documentation..."
echo "---------------------------"

# Check documentation files
DOC_FILES=(
    "README.md"
    "docs/INTEGRATION_GUIDE.md"
    "docs/WORKSPACE_INTEGRATION_STATUS.md"
    "API_DOCUMENTATION.md"
)

for doc in "${DOC_FILES[@]}"; do
    if file_exists "$doc"; then
        echo -e "${GREEN}✓${NC} Documentation exists: $doc"
    else
        echo -e "${YELLOW}⚠${NC} Documentation missing: $doc"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""
echo "🔗 Checking Integration Files..."
echo "--------------------------------"

# Check integration-related files
if file_exists "scripts/verify-integration.ts"; then
    echo -e "${GREEN}✓${NC} Integration verification script exists"
else
    echo -e "${YELLOW}⚠${NC} Integration verification script missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Check route files (configurable threshold)
MIN_ROUTES=${MIN_ROUTE_FILES:-30}
ROUTE_COUNT=$(find server/routes -name "*.ts" 2>/dev/null | wc -l)
if [ "$ROUTE_COUNT" -ge "$MIN_ROUTES" ]; then
    echo -e "${GREEN}✓${NC} Backend routes present ($ROUTE_COUNT files, min: $MIN_ROUTES)"
else
    echo -e "${YELLOW}⚠${NC} Limited route files ($ROUTE_COUNT found, expected $MIN_ROUTES+)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check view files (configurable threshold)
MIN_VIEWS=${MIN_VIEW_FILES:-50}
VIEW_COUNT=$(find src/views -name "*.tsx" 2>/dev/null | wc -l)
if [ "$VIEW_COUNT" -ge "$MIN_VIEWS" ]; then
    echo -e "${GREEN}✓${NC} Frontend views present ($VIEW_COUNT files, min: $MIN_VIEWS)"
else
    echo -e "${YELLOW}⚠${NC} Limited view files ($VIEW_COUNT found, expected $MIN_VIEWS+)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "🧪 TypeScript Check..."
echo "---------------------"

if command_exists tsc || [ -f "node_modules/.bin/tsc" ]; then
    echo "Running TypeScript compiler check..."
    if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
        echo -e "${RED}✗${NC} TypeScript compilation errors found"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓${NC} TypeScript compilation successful"
    fi
else
    echo -e "${YELLOW}⚠${NC} TypeScript not available for check"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "========================================"
echo "📊 Validation Summary"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Ready to start the platform:"
    echo "   - Backend: npm run server"
    echo "   - Frontend: npm run dev"
    echo "   - Both: npm run dev:all"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    echo ""
    echo "Platform is functional but may need configuration adjustments."
    echo ""
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    fi
    echo ""
    echo "Please fix the errors above before starting the platform."
    echo ""
    exit 1
fi
