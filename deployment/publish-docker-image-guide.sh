#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Publish Docker Image Guide
# ============================================
# This script provides guidance on publishing the Docker image to GHCR

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
║     CortexBuild Pro - Docker Image Publishing Guide      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "This guide explains how to publish the Docker image to GitHub Container Registry."
echo ""

echo -e "${CYAN}📋 Publishing Methods:${NC}"
echo ""

echo "1. ${GREEN}Automatic Publishing (Recommended)${NC}"
echo "   Docker images are automatically built and published via GitHub Actions."
echo ""
echo "   Triggers:"
echo "   • Push to 'cortexbuildpro' branch → tagged as 'cortexbuildpro' and 'latest'"
echo "   • Push to 'main' branch → tagged as 'main' and 'latest'"
echo "   • Push version tags (e.g., v1.0.0) → published with the same tag"
echo ""
echo "   Workflow file: .github/workflows/docker-publish.yml"
echo ""
echo "   ${YELLOW}Current Status:${NC}"
REGISTRY="ghcr.io"
IMAGE_NAME="adrianstanca1/cortexbuild-pro"
FULL_IMAGE="$REGISTRY/$IMAGE_NAME:latest"

echo "   Checking if image exists in GHCR..."
if docker manifest inspect "$FULL_IMAGE" &> /dev/null; then
    echo -e "   ${GREEN}✓ Image is published and available${NC}"
    echo ""
    echo "   You can now use Option 1 in PUBLIC_DEPLOYMENT.md"
else
    echo -e "   ${RED}✗ Image not yet published${NC}"
    echo ""
    echo "   ${YELLOW}To publish automatically:${NC}"
    echo "   1. Ensure all changes are committed"
    echo "   2. Push to cortexbuildpro or main branch:"
    echo "      git push origin HEAD:cortexbuildpro"
    echo "   3. Wait for GitHub Actions workflow to complete (~10-15 minutes)"
    echo "   4. Check workflow status at:"
    echo "      https://github.com/adrianstanca1/cortexbuild-pro/actions"
    echo ""
fi

echo ""
echo "2. ${GREEN}Manual Publishing${NC}"
echo "   Build and push the image manually (requires GHCR access)."
echo ""
echo "   Steps:"
echo "   a. Login to GitHub Container Registry:"
echo "      echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
echo ""
echo "   b. Build the image:"
echo "      cd /path/to/cortexbuild-pro"
echo "      docker build -t $FULL_IMAGE -f deployment/Dockerfile ."
echo ""
echo "   c. Push the image:"
echo "      docker push $FULL_IMAGE"
echo ""

echo ""
echo "3. ${GREEN}Alternative: Deploy Without Published Image${NC}"
echo "   Use Option 2 in PUBLIC_DEPLOYMENT.md to build locally:"
echo ""
echo "   cd deployment"
echo "   docker compose build"
echo "   docker compose up -d"
echo ""

echo ""
echo -e "${CYAN}🔍 Verification:${NC}"
echo ""
echo "After publishing, verify the image is available:"
echo "  docker pull $FULL_IMAGE"
echo "  ./deployment/validate-public-deployment.sh"
echo ""

echo ""
echo -e "${CYAN}📚 Resources:${NC}"
echo ""
echo "• GitHub Actions Dashboard:"
echo "  https://github.com/adrianstanca1/cortexbuild-pro/actions"
echo ""
echo "• GitHub Container Registry:"
echo "  https://github.com/adrianstanca1/cortexbuild-pro/pkgs/container/cortexbuild-pro"
echo ""
echo "• Workflow Configuration:"
echo "  .github/workflows/docker-publish.yml"
echo ""
echo "• Deployment Guide:"
echo "  PUBLIC_DEPLOYMENT.md"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
