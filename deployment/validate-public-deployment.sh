#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Public Deployment Validator
# This script validates that the public deployment is ready
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     CortexBuild Pro - Public Deployment Validator        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

REGISTRY="ghcr.io"
IMAGE_NAME="adrianstanca1/cortexbuild-pro"
IMAGE_TAG="${1:-latest}"
FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

ERRORS=0
WARNINGS=0

echo -e "${CYAN}[1/4] Checking Prerequisites...${NC}"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ docker is not installed${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ docker is installed ($(docker --version | cut -d ' ' -f3))${NC}"
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ docker compose is not installed${NC}"
    ERRORS=$((ERRORS + 1))
else
    COMPOSE_VERSION=$(docker compose version 2>/dev/null | head -1)
    echo -e "${GREEN}✓ docker compose is installed (${COMPOSE_VERSION})${NC}"
fi

echo ""

echo -e "${CYAN}[2/4] Checking Docker Image Availability...${NC}"
echo ""

# Check if image exists in GHCR
echo "Checking if image exists: $FULL_IMAGE"
if docker manifest inspect "$FULL_IMAGE" &> /dev/null; then
    echo -e "${GREEN}✓ Docker image is available in GitHub Container Registry${NC}"
    
    # Get image details
    IMAGE_DIGEST=$(docker manifest inspect "$FULL_IMAGE" 2>/dev/null | grep -A 2 "schemaVersion" | grep "digest" | cut -d '"' -f 4 | head -1)
    if [ -n "$IMAGE_DIGEST" ]; then
        echo "  Digest: ${IMAGE_DIGEST:0:20}..."
    fi
else
    echo -e "${RED}✗ Docker image NOT found in GitHub Container Registry${NC}"
    echo ""
    echo "  The Docker image needs to be published first."
    echo "  This happens automatically when code is pushed to 'cortexbuildpro' or 'main' branches."
    echo ""
    echo "  Alternative: Build the image locally instead"
    echo "  → cd deployment"
    echo "  → docker compose build"
    echo "  → docker compose up -d"
    echo ""
    ERRORS=$((ERRORS + 1))
fi

echo ""

echo -e "${CYAN}[3/4] Checking Deployment Scripts...${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check required scripts
SCRIPTS=(
    "deploy-from-published-image.sh"
    "setup-ssl.sh"
    "backup.sh"
    "restore.sh"
    "scripts/verify-deployment.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}✓ $script (executable)${NC}"
        else
            echo -e "${YELLOW}⚠ $script (not executable)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}✗ $script (missing)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

echo -e "${CYAN}[4/4] Checking Configuration Files...${NC}"
echo ""

# Check .env.example
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ .env.example exists${NC}"
else
    echo -e "${RED}✗ .env.example is missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.yml exists${NC}"
else
    echo -e "${RED}✗ docker-compose.yml is missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check nginx.conf
if [ -f "nginx.conf" ]; then
    echo -e "${GREEN}✓ nginx.conf exists${NC}"
else
    echo -e "${RED}✗ nginx.conf is missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✓ Dockerfile exists${NC}"
else
    echo -e "${RED}✗ Dockerfile is missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                   Validation Summary                      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed! Public deployment is ready.${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. cd deployment"
        echo "  2. cp .env.example .env"
        echo "  3. Edit .env and configure settings"
        echo "  4. ./deploy-from-published-image.sh"
        exit 0
    else
        echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found, but deployment should work.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ ${ERRORS} error(s) found. Please fix before deploying.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}   ${WARNINGS} warning(s) also found.${NC}"
    fi
    exit 1
fi
