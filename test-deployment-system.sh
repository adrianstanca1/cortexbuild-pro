#!/bin/bash
# ============================================
# CortexBuild Pro - Deployment Test Script
# ============================================
# This script validates the deployment package and scripts

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     CortexBuild Pro - Deployment Test Suite             ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Test function - pass result as parameter
test_check() {
    local result=$1
    local message=$2
    TEST_COUNT=$((TEST_COUNT + 1))
    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} - $message"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - $message"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

echo -e "${CYAN}[1/5] Testing Script Files...${NC}"
echo ""

# Test 1: Check if all deployment scripts exist
echo "Testing deployment scripts existence..."
[ -f "create-deployment-package.sh" ]; test_check $? "create-deployment-package.sh exists"
[ -x "create-deployment-package.sh" ]; test_check $? "create-deployment-package.sh is executable"
[ -f "deploy-to-vps-exact.sh" ]; test_check $? "deploy-to-vps-exact.sh exists"
[ -x "deploy-to-vps-exact.sh" ]; test_check $? "deploy-to-vps-exact.sh is executable"
[ -f "one-command-deploy.sh" ]; test_check $? "one-command-deploy.sh exists"
[ -x "one-command-deploy.sh" ]; test_check $? "one-command-deploy.sh is executable"
[ -f "vps-deploy.sh" ]; test_check $? "vps-deploy.sh exists"
[ -x "vps-deploy.sh" ]; test_check $? "vps-deploy.sh is executable"

echo ""
echo -e "${CYAN}[2/5] Testing Documentation...${NC}"
echo ""

# Test 2: Check if documentation exists
[ -f "VPS_DEPLOYMENT_PACKAGE_GUIDE.md" ]; test_check $? "VPS_DEPLOYMENT_PACKAGE_GUIDE.md exists"
[ -f "VPS_QUICK_DEPLOY.md" ]; test_check $? "VPS_QUICK_DEPLOY.md exists"
[ -f "VPS_DEPLOYMENT_IMPLEMENTATION_SUMMARY.md" ]; test_check $? "VPS_DEPLOYMENT_IMPLEMENTATION_SUMMARY.md exists"

echo ""
echo -e "${CYAN}[3/5] Testing Package Creation...${NC}"
echo ""

# Test 3: Create deployment package
echo "Creating deployment package..."
if ./create-deployment-package.sh > /dev/null 2>&1; then
    test_check 0 "Package creation successful"
else
    test_check 1 "Package creation successful"
fi

[ -f "cortexbuild_vps_deploy.tar.gz" ]; test_check $? "Tarball was created"

# Check tarball size (should be around 900KB)
TARBALL_SIZE=$(stat -c%s "cortexbuild_vps_deploy.tar.gz" 2>/dev/null || stat -f%z "cortexbuild_vps_deploy.tar.gz" 2>/dev/null)
if [ "$TARBALL_SIZE" -gt 500000 ] && [ "$TARBALL_SIZE" -lt 5000000 ]; then
    if command -v numfmt >/dev/null 2>&1; then
        HUMAN_SIZE=$(numfmt --to=iec-i --suffix=B "$TARBALL_SIZE" 2>/dev/null || echo "${TARBALL_SIZE} bytes")
    else
        HUMAN_SIZE="${TARBALL_SIZE} bytes"
    fi
    test_check 0 "Tarball size is reasonable (${HUMAN_SIZE})"
else
    test_check 1 "Tarball size is reasonable"
fi

echo ""
echo -e "${CYAN}[4/5] Testing Package Contents...${NC}"
echo ""

# Test 4: Check tarball contents
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
tar -xzf "$SCRIPT_DIR/cortexbuild_vps_deploy.tar.gz" 2>/dev/null
if [ $? -eq 0 ]; then
    test_check 0 "Tarball extracts successfully"
else
    test_check 1 "Tarball extracts successfully"
fi

# Check for critical files
[ -d "cortexbuild/deployment" ]; test_check $? "deployment/ directory exists in tarball"
[ -f "cortexbuild/deployment/docker-compose.yml" ]; test_check $? "docker-compose.yml exists in tarball"
[ -f "cortexbuild/deployment/Dockerfile" ]; test_check $? "Dockerfile exists in tarball"
[ -f "cortexbuild/deployment/.env.example" ]; test_check $? ".env.example exists in tarball"
[ -d "cortexbuild/nextjs_space" ]; test_check $? "nextjs_space/ directory exists in tarball"

# Check that excluded files are not present
if [ -d "cortexbuild/node_modules" ]; then
    test_check 1 "node_modules is excluded from tarball"
else
    test_check 0 "node_modules is excluded from tarball"
fi

if [ -d "cortexbuild/.git" ]; then
    test_check 1 ".git is excluded from tarball"
else
    test_check 0 ".git is excluded from tarball"
fi

cd "$SCRIPT_DIR"
rm -rf "$TEST_DIR"

echo ""
echo -e "${CYAN}[5/5] Testing Script Syntax...${NC}"
echo ""

# Test 5: Check script syntax
bash -n create-deployment-package.sh 2>/dev/null; test_check $? "create-deployment-package.sh syntax valid"
bash -n deploy-to-vps-exact.sh 2>/dev/null; test_check $? "deploy-to-vps-exact.sh syntax valid"
bash -n one-command-deploy.sh 2>/dev/null; test_check $? "one-command-deploy.sh syntax valid"
bash -n vps-deploy.sh 2>/dev/null; test_check $? "vps-deploy.sh syntax valid"

# Test exact command implementation
if grep -q "nohup docker compose -f cortexbuild/deployment/docker-compose.yml build --no-cache app > /root/docker_build.log 2>&1 &" deploy-to-vps-exact.sh; then
    test_check 0 "Exact deployment command is implemented correctly"
else
    test_check 1 "Exact deployment command is implemented correctly"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}Test Results Summary${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Total Tests: $TEST_COUNT"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}Failed: $FAIL_COUNT${NC}"
else
    echo -e "${GREEN}Failed: $FAIL_COUNT${NC}"
fi
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║          All Tests Passed! ✓                             ║${NC}"
    echo -e "${GREEN}║          Deployment System Ready                         ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "You can now deploy to VPS using:"
    echo "  ./deploy-to-vps-exact.sh"
    echo "  or"
    echo "  ./one-command-deploy.sh 'password'"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}║          Some Tests Failed!                              ║${NC}"
    echo -e "${RED}║          Please review the errors above                  ║${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
