#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Create VPS Deployment Package
# ============================================
# This script creates a deployment tarball for VPS deployment

# Colors for output
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
║     CortexBuild Pro - Create Deployment Package          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Output file
OUTPUT_FILE="cortexbuild_vps_deploy.tar.gz"
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="$TEMP_DIR/cortexbuild"

echo -e "${CYAN}[1/4] Preparing package directory...${NC}"
echo ""

# Create package directory structure
mkdir -p "$PACKAGE_DIR"

# Copy deployment directory
echo "Copying deployment files..."
cp -r deployment "$PACKAGE_DIR/"

# Copy nextjs_space directory
echo "Copying Next.js application..."
cp -r nextjs_space "$PACKAGE_DIR/"

# Copy configuration files
echo "Copying configuration files..."
cp .dockerignore "$PACKAGE_DIR/" 2>/dev/null || true
cp .env.template "$PACKAGE_DIR/" 2>/dev/null || true

# Copy documentation
echo "Copying documentation..."
cp README.md "$PACKAGE_DIR/" 2>/dev/null || true
cp deployment/PRODUCTION-DEPLOY-GUIDE.md "$PACKAGE_DIR/" 2>/dev/null || true
cp TROUBLESHOOTING.md "$PACKAGE_DIR/" 2>/dev/null || true
cp API_SETUP_GUIDE.md "$PACKAGE_DIR/" 2>/dev/null || true

# Copy deployment scripts
echo "Copying deployment scripts..."
cp vps-deploy.sh "$PACKAGE_DIR/" 2>/dev/null || true
cp verify-config.sh "$PACKAGE_DIR/" 2>/dev/null || true

echo -e "${GREEN}✓ Files copied successfully${NC}"
echo ""

echo -e "${CYAN}[2/4] Cleaning up unnecessary files...${NC}"
echo ""

# Remove node_modules, build artifacts, and other unnecessary files
find "$PACKAGE_DIR" -type d -name "node_modules" -prune -exec rm -rf {} \; || true
find "$PACKAGE_DIR" -type d -name ".next" -prune -exec rm -rf {} \; || true
find "$PACKAGE_DIR" -type d -name ".git" -prune -exec rm -rf {} \; || true
find "$PACKAGE_DIR" -type d -name ".github" -prune -exec rm -rf {} \; || true
find "$PACKAGE_DIR" -type d -name "dist" -prune -exec rm -rf {} \; || true
find "$PACKAGE_DIR" -type d -name "coverage" -prune -exec rm -rf {} \; || true
find "$PACKAGE_DIR" -type f -name "*.log" -delete 2>/dev/null || true
find "$PACKAGE_DIR" -type f -name ".DS_Store" -delete 2>/dev/null || true
find "$PACKAGE_DIR" -type f -name ".env" -delete 2>/dev/null || true
find "$PACKAGE_DIR" -type f -name ".env.local" -delete 2>/dev/null || true

echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

echo -e "${CYAN}[3/4] Creating tarball...${NC}"
echo ""

# Create tarball
cd "$TEMP_DIR"
tar -czf "$SCRIPT_DIR/$OUTPUT_FILE" cortexbuild/

# Get file size
FILE_SIZE=$(du -h "$SCRIPT_DIR/$OUTPUT_FILE" | cut -f1)

echo -e "${GREEN}✓ Tarball created: $OUTPUT_FILE ($FILE_SIZE)${NC}"
echo ""

echo -e "${CYAN}[4/4] Cleaning up temporary files...${NC}"
echo ""

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Display package contents summary
echo -e "${CYAN}Package Contents Summary:${NC}"
echo ""
tar -tzf "$SCRIPT_DIR/$OUTPUT_FILE" | head -20
echo "..."
echo ""
echo "Total files: $(tar -tzf "$SCRIPT_DIR/$OUTPUT_FILE" | wc -l)"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║          Package Created Successfully! 🎉                ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Deployment Package: $OUTPUT_FILE"
echo "File Size: $FILE_SIZE"
echo ""
echo "Next Steps:"
echo ""
echo "1. Upload to VPS:"
echo "   → scp $OUTPUT_FILE root@72.62.132.43:/root/"
echo ""
echo "2. Or use the automated deployment command:"
echo "   → sshpass -p 'PASSWORD' scp $OUTPUT_FILE root@72.62.132.43:/root/cortexbuild/"
echo ""
echo "3. SSH into VPS and extract:"
echo "   → ssh root@72.62.132.43"
echo "   → cd /root/cortexbuild"
echo "   → tar -xzf $OUTPUT_FILE"
echo ""
echo "4. Run deployment:"
echo "   → cd cortexbuild/deployment"
echo "   → docker compose build --no-cache app"
echo "   → docker compose up -d"
echo ""
echo "For complete instructions, see VPS_DEPLOYMENT_INSTRUCTIONS.md"
echo ""
