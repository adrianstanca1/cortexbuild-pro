#!/bin/bash

# ============================================
# CortexBuild Pro - Pre-Deployment Validation
# ============================================
# Validates that all requirements are met
# before deploying to production
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     CortexBuild Pro - Pre-Deployment Validation         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${CYAN}Validating deployment prerequisites...${NC}"
echo ""

# Function to check and report
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
}

# ============================================
# 1. Local Environment Checks
# ============================================
echo -e "${CYAN}[1/5] Checking Local Environment${NC}"
echo ""

# Check Git
if command -v git &> /dev/null; then
    check_pass "Git is installed ($(git --version | cut -d' ' -f3))"
else
    check_fail "Git is not installed"
fi

# Check Docker
if command -v docker &> /dev/null; then
    check_pass "Docker is installed ($(docker --version | cut -d' ' -f3 | tr -d ','))"
else
    check_warn "Docker is not installed (needed for local testing)"
fi

# Check GitHub CLI
if command -v gh &> /dev/null; then
    check_pass "GitHub CLI is installed ($(gh --version | head -1 | cut -d' ' -f3))"
    
    # Check authentication
    if gh auth status &> /dev/null; then
        check_pass "GitHub CLI is authenticated"
    else
        check_fail "GitHub CLI is not authenticated (run: gh auth login)"
    fi
else
    check_fail "GitHub CLI is not installed (required for deployment trigger)"
fi

echo ""

# ============================================
# 2. Repository Status
# ============================================
echo -e "${CYAN}[2/5] Checking Repository Status${NC}"
echo ""

# Check if in git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_pass "Inside git repository"
    
    # Check current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "   ${BLUE}Current branch: $CURRENT_BRANCH${NC}"
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        check_pass "No uncommitted changes"
    else
        check_warn "Uncommitted changes detected"
        git status --short | head -5
    fi
    
    # Check if branch is up to date
    git fetch origin > /dev/null 2>&1
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    
    if [ -z "$REMOTE" ]; then
        check_warn "No remote tracking branch"
    elif [ "$LOCAL" = "$REMOTE" ]; then
        check_pass "Branch is up to date with remote"
    elif [ "$LOCAL" != "$REMOTE" ]; then
        check_warn "Branch is not up to date with remote"
    fi
else
    check_fail "Not inside a git repository"
fi

echo ""

# ============================================
# 3. Required Files
# ============================================
echo -e "${CYAN}[3/5] Checking Required Files${NC}"
echo ""

REQUIRED_FILES=(
    ".github/workflows/deploy-vps.yml"
    "deployment/docker-compose.yml"
    "deployment/Dockerfile"
    "deployment/.env.example"
    "nextjs_space/package.json"
    "nextjs_space/prisma/schema.prisma"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Found: $file"
    else
        check_fail "Missing: $file"
    fi
done

echo ""

# ============================================
# 4. Configuration Files
# ============================================
echo -e "${CYAN}[4/5] Checking Configuration${NC}"
echo ""

# Check docker-compose.yml
if [ -f "deployment/docker-compose.yml" ]; then
    if docker compose -f deployment/docker-compose.yml config > /dev/null 2>&1; then
        check_pass "docker-compose.yml is valid"
    else
        check_fail "docker-compose.yml has syntax errors"
    fi
fi

# Check .env.example
if [ -f "deployment/.env.example" ]; then
    # Check for required variables
    REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "POSTGRES_PASSWORD")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" deployment/.env.example; then
            check_pass "Found variable: $var"
        else
            check_warn "Variable not found in .env.example: $var"
        fi
    done
fi

echo ""

# ============================================
# 5. GitHub Workflow Validation
# ============================================
echo -e "${CYAN}[5/5] Checking GitHub Workflow${NC}"
echo ""

if [ -f ".github/workflows/deploy-vps.yml" ]; then
    check_pass "Deployment workflow file exists"
    
    # Check required secrets are documented
    REQUIRED_SECRETS=("VPS_HOST" "VPS_USER" "VPS_SSH_KEY")
    
    echo -e "   ${BLUE}Required GitHub Secrets:${NC}"
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if grep -q "$secret" .github/workflows/deploy-vps.yml; then
            echo -e "   ${GREEN}✓${NC} $secret (referenced in workflow)"
        else
            echo -e "   ${RED}✗${NC} $secret (not found in workflow)"
        fi
    done
else
    check_fail "Deployment workflow file not found"
fi

echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Passed:  $CHECKS_PASSED${NC}"
echo -e "${YELLOW}Warnings: $CHECKS_WARNING${NC}"
echo -e "${RED}Failed:  $CHECKS_FAILED${NC}"
echo ""

# Overall status
if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
        echo ""
        echo -e "${CYAN}Next steps:${NC}"
        echo "  1. Review: DEPLOY_PRODUCTION_TESTING.md"
        echo "  2. Ensure GitHub secrets are configured"
        echo "  3. Trigger deployment: ./trigger-production-deploy.sh"
        EXIT_CODE=0
    else
        echo -e "${YELLOW}⚠ Checks passed with warnings. Review warnings before deploying.${NC}"
        echo ""
        echo -e "${CYAN}You can proceed, but address warnings if possible.${NC}"
        EXIT_CODE=0
    fi
else
    echo -e "${RED}✗ Some checks failed. Fix issues before deploying.${NC}"
    echo ""
    echo -e "${CYAN}Fix the failed checks and run validation again.${NC}"
    EXIT_CODE=1
fi

echo ""

# ============================================
# Additional Information
# ============================================
if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${CYAN}Important Pre-Deployment Steps:${NC}"
    echo ""
    echo "1. Ensure GitHub Secrets are configured:"
    echo "   Go to: Settings → Secrets and variables → Actions"
    echo "   Required: VPS_HOST, VPS_USER, VPS_SSH_KEY"
    echo ""
    echo "2. Verify VPS server is ready:"
    echo "   - Docker and Docker Compose installed"
    echo "   - Sufficient resources (2GB+ RAM, 20GB+ disk)"
    echo "   - Ports 80, 443, 22 accessible"
    echo ""
    echo "3. Review deployment checklist:"
    echo "   cat PRODUCTION_DEPLOYMENT_CHECKLIST.md"
    echo ""
    echo "4. Trigger deployment:"
    echo "   ./trigger-production-deploy.sh"
    echo ""
    echo "For detailed instructions: DEPLOY_PRODUCTION_TESTING.md"
    echo ""
fi

exit $EXIT_CODE
