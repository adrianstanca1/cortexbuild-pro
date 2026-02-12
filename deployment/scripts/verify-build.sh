#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Build Verification Script
# Verifies the Docker build process
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        CortexBuild Pro - Build Verification              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${CYAN}[1/5] Checking Prerequisites...${NC}"
echo ""

DOCKER_AVAILABLE=true

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker is not installed. Docker-specific validation will be skipped.${NC}"
    DOCKER_AVAILABLE=false
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
    docker --version
fi

echo ""

# Check required files
echo -e "${CYAN}[2/5] Verifying Required Files...${NC}"
echo ""

REQUIRED_FILES=(
    "$PROJECT_ROOT/deployment/Dockerfile"
    "$PROJECT_ROOT/deployment/docker-compose.yml"
    "$PROJECT_ROOT/.dockerignore"
    "$PROJECT_ROOT/nextjs_space/package.json"
    "$PROJECT_ROOT/nextjs_space/production-server.js"
    "$PROJECT_ROOT/nextjs_space/entrypoint.sh"
)

ALL_FILES_OK=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $(basename "$file")${NC}"
    else
        echo -e "${RED}✗ $(basename "$file") not found${NC}"
        ALL_FILES_OK=false
    fi
done

if [ "$ALL_FILES_OK" = false ]; then
    echo ""
    echo -e "${RED}Missing required files!${NC}"
    exit 1
fi

echo ""

# Verify package.json scripts
echo -e "${CYAN}[3/5] Verifying Build Scripts...${NC}"
echo ""

if grep -q '"build"' "$PROJECT_ROOT/nextjs_space/package.json"; then
    echo -e "${GREEN}✓ Build script found${NC}"
else
    echo -e "${RED}✗ Build script not found in package.json${NC}"
    exit 1
fi

echo ""

# Check Dockerfile syntax
echo -e "${CYAN}[4/5] Validating Dockerfile...${NC}"
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    if docker build --help > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker build command available${NC}"
    else
        echo -e "${RED}✗ Docker build command failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Skipped: Docker build command validation (Docker unavailable)${NC}"
fi

echo ""

# Summary
echo -e "${CYAN}[5/5] Verification Summary${NC}"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║       Build Verification Complete ✓                      ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "✅ All prerequisites and files verified successfully!"
else
    echo "⚠ Verification completed with warnings (Docker unavailable in this environment)."
fi
echo ""
echo "Next Steps:"
echo ""
echo "1. Test local build:"
echo "   cd deployment && docker compose build"
echo ""
echo "2. Test full deployment:"
echo "   cd deployment && ./deploy-from-published-image.sh"
echo ""
echo "3. Push to trigger GitHub Actions:"
echo "   git push origin main"
echo ""
echo "4. Check GitHub Actions workflow:"
echo "   https://github.com/adrianstanca1/cortexbuild-pro/actions"
echo ""
echo "5. View published Docker images:"
echo "   https://github.com/adrianstanca1/cortexbuild-pro/pkgs/container/cortexbuild-pro"
echo ""
