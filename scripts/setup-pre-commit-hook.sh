#!/bin/bash
# =============================================================================
# CortexBuild Pro - Pre-commit Hook Setup
# =============================================================================
# This script sets up Git pre-commit hooks to validate changes before committing
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
GIT_HOOKS_DIR="${APP_ROOT}/.git/hooks"
HOOK_FILE="${GIT_HOOKS_DIR}/pre-commit"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Setting up pre-commit hooks...${NC}"
echo ""

# Ensure we are in a Git repository with a hooks directory
if [ ! -d "$GIT_HOOKS_DIR" ]; then
    echo -e "${RED}Error: Not in a git repository or .git/hooks directory doesn't exist${NC}"
    exit 1
fi

# Create the pre-commit hook
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash
# Pre-commit hook for CortexBuild Pro

set -e

NEXTJS_DIR="$(git rev-parse --show-toplevel)/nextjs_space"

echo "🔍 Running pre-commit checks..."
echo ""

# Check if there are any staged files
if git diff --cached --name-only | grep -q "."; then
    # Check for TypeScript/JavaScript files
    if git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx)$' > /dev/null; then
        echo "→ Checking TypeScript files..."
        cd "$NEXTJS_DIR"
        
        # Generate Prisma client
        export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@db:5432/test}"
        if ! npx prisma generate > /dev/null 2>&1; then
            echo "⚠ Warning: Prisma client generation failed"
            echo "  TypeScript checks may produce misleading errors"
        fi
        
        # Run type check on staged files only
        npx tsc --noEmit || {
            echo "❌ TypeScript type check failed"
            echo "Fix the errors and try again, or use --no-verify to skip"
            exit 1
        }
        
        echo "✓ TypeScript check passed"
    fi
    
    # Check for Prisma schema changes
    if git diff --cached --name-only | grep -q "prisma/schema.prisma"; then
        echo "→ Validating Prisma schema..."
        cd "$NEXTJS_DIR"
        
        export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@db:5432/test}"
        npx prisma validate || {
            echo "❌ Prisma schema validation failed"
            exit 1
        }
        
        echo "✓ Prisma schema valid"
    fi
    
    # Check for sensitive files
    echo "→ Checking for sensitive files..."
    if git diff --cached --name-only | grep -E '\.env$|\.pem$|\.key$' > /dev/null; then
        echo "❌ Attempting to commit sensitive files!"
        echo "These files should not be committed:"
        git diff --cached --name-only | grep -E '\.env$|\.pem$|\.key$'
        exit 1
    fi
    
    echo "✓ No sensitive files detected"
fi

echo ""
echo "✅ Pre-commit checks passed!"
exit 0
EOF

# Make the hook executable
chmod +x "$HOOK_FILE"

echo -e "${GREEN}✓ Pre-commit hook installed successfully!${NC}"
echo ""
echo "The hook will run automatically before each commit and check:"
echo "  • TypeScript type checking"
echo "  • Prisma schema validation"
echo "  • Sensitive file detection"
echo ""
echo "To bypass the hook (not recommended), use: git commit --no-verify"
echo ""
