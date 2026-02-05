#!/bin/bash

# ============================================
# CortexBuild Pro - Production Deployment Trigger
# ============================================
# This script triggers the GitHub Actions workflow
# to deploy CortexBuild Pro to production
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    CortexBuild Pro - Production Deployment Trigger      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${CYAN}This script will trigger automated deployment to production${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo "Please install it from: https://cli.github.com/"
    echo ""
    echo "Installation:"
    echo "  macOS:   brew install gh"
    echo "  Ubuntu:  sudo apt install gh"
    echo "  Windows: Download from https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You are not authenticated with GitHub${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${CYAN}Current branch:${NC} $CURRENT_BRANCH"
echo ""

# Ask for environment
echo -e "${CYAN}Select deployment environment:${NC}"
echo "  1) production"
echo "  2) staging"
echo ""
read -p "Enter choice (1 or 2, default: 1): " env_choice

case $env_choice in
    2)
        ENVIRONMENT="staging"
        ;;
    *)
        ENVIRONMENT="production"
        ;;
esac

echo -e "${GREEN}✓ Environment: $ENVIRONMENT${NC}"
echo ""

# Ask about tests
read -p "Skip tests before deployment? (y/N): " skip_tests
if [[ $skip_tests =~ ^[Yy]$ ]]; then
    SKIP_TESTS="true"
else
    SKIP_TESTS="false"
fi

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Deployment Summary:${NC}"
echo -e "${YELLOW}  Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}  Skip Tests:  $SKIP_TESTS${NC}"
echo -e "${YELLOW}  Branch:      $CURRENT_BRANCH${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

read -p "Proceed with deployment? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}Triggering deployment workflow...${NC}"
echo ""

# Trigger the workflow
if gh workflow run deploy-vps.yml \
    --field environment=$ENVIRONMENT \
    --field skip_tests=$SKIP_TESTS; then
    
    echo -e "${GREEN}✓ Deployment workflow triggered successfully!${NC}"
    echo ""
    echo -e "${CYAN}Waiting for workflow to start...${NC}"
    sleep 5
    
    echo ""
    echo -e "${CYAN}You can monitor the deployment in several ways:${NC}"
    echo ""
    echo "1. Watch in terminal (live updates):"
    echo -e "   ${BLUE}gh run watch${NC}"
    echo ""
    echo "2. View on GitHub:"
    echo -e "   ${BLUE}https://github.com/adrianstanca1/cortexbuild-pro/actions${NC}"
    echo ""
    echo "3. View latest run details:"
    echo -e "   ${BLUE}gh run view --log${NC}"
    echo ""
    echo "4. List recent runs:"
    echo -e "   ${BLUE}gh run list --workflow=deploy-vps.yml --limit=5${NC}"
    echo ""
    
    read -p "Watch deployment progress now? (Y/n): " watch_now
    if [[ ! $watch_now =~ ^[Nn]$ ]]; then
        echo ""
        echo -e "${CYAN}Watching deployment...${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop watching (deployment will continue)${NC}"
        echo ""
        sleep 2
        gh run watch
    fi
else
    echo -e "${RED}✗ Failed to trigger deployment workflow${NC}"
    echo ""
    echo "Possible issues:"
    echo "  - Check if you have write access to the repository"
    echo "  - Verify the workflow file exists: .github/workflows/deploy-vps.yml"
    echo "  - Ensure you are authenticated with gh CLI"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment trigger complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "After deployment completes, verify at:"
echo "  • https://www.cortexbuildpro.com/api/health"
echo "  • https://your-domain.com"
echo ""
echo "For manual verification, see: DEPLOY_PRODUCTION_TESTING.md"
echo ""
