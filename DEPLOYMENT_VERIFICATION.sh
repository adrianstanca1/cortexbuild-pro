#!/bin/bash

# ============================================
# CortexBuild Pro - Deployment Verification
# ============================================
# Run this script to verify deployment readiness

# Note: Intentionally not using set -e to allow error counting across all checks

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║     CortexBuild Pro - Deployment Verification            ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Check Git Status
echo -e "${YELLOW}[1/8] Checking Git Status...${NC}"
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✓ Working tree is clean${NC}"
else
    echo -e "${RED}✗ Uncommitted changes detected${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Branch
echo -e "${YELLOW}[2/8] Checking Branch...${NC}"
BRANCH=$(git branch --show-current)
echo -e "${GREEN}✓ Current branch: $BRANCH${NC}"
echo ""

# Check Deployment Package
echo -e "${YELLOW}[3/8] Checking Deployment Package...${NC}"
if [ -f "cortexbuild_vps_deploy.tar.gz" ]; then
    SIZE=$(du -h cortexbuild_vps_deploy.tar.gz | cut -f1)
    echo -e "${GREEN}✓ Deployment package exists: cortexbuild_vps_deploy.tar.gz ($SIZE)${NC}"
else
    echo -e "${YELLOW}⚠ Deployment package not found (run ./create-deployment-package.sh)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check Docker Compose Configuration
echo -e "${YELLOW}[4/8] Checking Docker Compose Configuration...${NC}"
if docker compose -f deployment/docker-compose.yml config > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose configuration is valid${NC}"
else
    echo -e "${RED}✗ Docker Compose configuration has errors${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Dockerfile
echo -e "${YELLOW}[5/8] Checking Dockerfile...${NC}"
if [ -f "deployment/Dockerfile" ]; then
    echo -e "${GREEN}✓ Dockerfile exists${NC}"
    
    # Check for multi-stage build
    if grep -q "FROM.*AS" deployment/Dockerfile; then
        echo -e "${GREEN}✓ Multi-stage build configured${NC}"
    else
        echo -e "${YELLOW}⚠ Multi-stage build not detected${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ Dockerfile not found${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Environment Template
echo -e "${YELLOW}[6/8] Checking Environment Template...${NC}"
if [ -f "deployment/.env.example" ]; then
    echo -e "${GREEN}✓ Environment template exists${NC}"
    
    # Check for required variables
    REQUIRED_VARS=("POSTGRES_PASSWORD" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "DATABASE_URL")
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${VAR}=" deployment/.env.example; then
            echo -e "${GREEN}  ✓ $VAR documented${NC}"
        else
            echo -e "${YELLOW}  ⚠ $VAR not found in template${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${RED}✗ Environment template not found${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Deployment Scripts
echo -e "${YELLOW}[7/8] Checking Deployment Scripts...${NC}"
SCRIPTS=("deploy-to-vps.sh" "create-deployment-package.sh" "verify-deployment.sh")
for SCRIPT in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT" ]; then
        if [ -x "$SCRIPT" ]; then
            echo -e "${GREEN}  ✓ $SCRIPT (executable)${NC}"
        else
            echo -e "${YELLOW}  ⚠ $SCRIPT (not executable)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}  ✗ $SCRIPT (missing)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check Documentation
echo -e "${YELLOW}[8/8] Checking Documentation...${NC}"
DOCS=("DEPLOYMENT_READY.md" "DEPLOY_TO_VPS_COMPLETE.md" "VPS_QUICK_DEPLOY.md" "FINAL_DEPLOYMENT_STATUS.md")
for DOC in "${DOCS[@]}"; do
    if [ -f "$DOC" ]; then
        echo -e "${GREEN}  ✓ $DOC${NC}"
    else
        echo -e "${YELLOW}  ⚠ $DOC (missing)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# Summary
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    VERIFICATION SUMMARY                       ${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL CHECKS PASSED ✓✓✓${NC}"
    echo -e "${GREEN}The repository is ready for VPS deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review DEPLOYMENT_READY.md for deployment options"
    echo "  2. Choose your deployment method (automated, package, or clone)"
    echo "  3. Follow the deployment guide"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) detected${NC}"
    echo -e "${YELLOW}The repository is ready but review warnings above${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) detected${NC}"
    echo -e "${RED}Please fix the errors above before deploying${NC}"
    exit 1
fi
