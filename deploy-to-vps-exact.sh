#!/bin/bash
# ============================================
# CortexBuild Pro - Exact VPS Deployment
# ============================================
# This script matches the exact deployment command from requirements

set -e

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
║          CortexBuild Pro - VPS Deployment                ║
║          Exact Command Implementation                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration from problem statement
VPS_HOST="72.62.132.43"
VPS_USER="root"
VPS_PASSWORD="Cumparavinde1@"
DEPLOYMENT_DIR="/root/cortexbuild"
TARBALL="cortexbuild_vps_deploy.tar.gz"

echo -e "${CYAN}Step 1: Creating deployment package...${NC}"
echo ""

# Create the deployment package
if [ ! -f ./create-deployment-package.sh ]; then
    echo -e "${RED}Error: create-deployment-package.sh not found${NC}"
    exit 1
fi

./create-deployment-package.sh

if [ ! -f "$TARBALL" ]; then
    echo -e "${RED}Error: Package creation failed${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}Step 2: Uploading and deploying to VPS...${NC}"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}sshpass not found. Installing...${NC}"
    if [ -f /etc/debian_version ]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    else
        echo -e "${RED}Please install sshpass manually${NC}"
        exit 1
    fi
fi

# Create directory structure on VPS
echo "Creating deployment directory structure..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "
    mkdir -p $DEPLOYMENT_DIR
    echo 'Directory created: $DEPLOYMENT_DIR'
"

# Upload the tarball
echo "Uploading deployment package..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$TARBALL" "$VPS_USER@$VPS_HOST:$DEPLOYMENT_DIR/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Package uploaded successfully${NC}"
else
    echo -e "${RED}✗ Upload failed${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}Step 3: Executing deployment on VPS...${NC}"
echo ""

# Execute the exact commands from the problem statement
echo "Running deployment commands on VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "
cd $DEPLOYMENT_DIR
tar -xzf $TARBALL
nohup docker compose -f deployment/docker-compose.yml build --no-cache app > /root/docker_build.log 2>&1 &
BUILD_PID=\$!
echo \"Docker build started with PID: \$BUILD_PID\"
echo \"Build log location: /root/docker_build.log\"
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment initiated successfully${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║     Deployment Commands Executed Successfully! 🚀        ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Deployment Status:"
echo "  ✅ Package created and uploaded"
echo "  ✅ Files extracted on VPS"
echo "  ✅ Docker build started in background"
echo ""
echo "Build Details:"
echo "  VPS: $VPS_HOST"
echo "  Location: $DEPLOYMENT_DIR"
echo "  Log file: /root/docker_build.log"
echo ""
echo "Monitor build progress:"
echo "  → sshpass -p '$VPS_PASSWORD' ssh $VPS_USER@$VPS_HOST 'tail -f /root/docker_build.log'"
echo ""
echo "Or SSH in directly:"
echo "  → sshpass -p '$VPS_PASSWORD' ssh $VPS_USER@$VPS_HOST"
echo "  → tail -f /root/docker_build.log"
echo ""
echo "After build completes (wait ~5-10 minutes), start services:"
echo "  → cd $DEPLOYMENT_DIR/cortexbuild/deployment"
echo "  → docker compose up -d"
echo "  → docker compose exec app sh -c 'cd /app && npx prisma migrate deploy'"
echo ""
echo "Access application:"
echo "  → http://$VPS_HOST:3000"
echo ""
