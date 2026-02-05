#!/bin/bash
# ============================================
# CortexBuild Pro - One-Command VPS Deployment
# ============================================
# This script automates the entire deployment process to VPS
# Usage: ./one-command-deploy.sh [password]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

VPS_HOST="72.62.132.43"
VPS_USER="root"
DEPLOYMENT_DIR="/root/cortexbuild"
TARBALL="cortexbuild_vps_deploy.tar.gz"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     CortexBuild Pro - One-Command Deployment             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if password provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Password required${NC}"
    echo ""
    echo "Usage: $0 <vps-password>"
    echo ""
    echo "Example:"
    echo "  $0 'YourPassword123'"
    exit 1
fi

VPS_PASSWORD="$1"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}sshpass not installed. Installing...${NC}"
    echo ""
    
    # Detect OS and install
    if [ -f /etc/debian_version ]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif [ -f /etc/redhat-release ]; then
        sudo yum install -y sshpass
    elif [ "$(uname)" == "Darwin" ]; then
        if ! command -v brew &> /dev/null; then
            echo -e "${RED}Homebrew not found. Please install sshpass manually.${NC}"
            exit 1
        fi
        brew install hudochenkov/sshpass/sshpass
    else
        echo -e "${RED}Could not install sshpass automatically.${NC}"
        echo "Please install sshpass manually and run this script again."
        exit 1
    fi
    
    echo -e "${GREEN}✓ sshpass installed${NC}"
    echo ""
fi

echo -e "${CYAN}[1/5] Creating deployment package...${NC}"
echo ""

# Create package
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
echo -e "${CYAN}[2/5] Uploading package to VPS...${NC}"
echo ""

# Create directory on VPS
echo "Creating deployment directory on VPS..."
sshpass -p "$VPS_PASSWORD" ssh "$VPS_USER@$VPS_HOST" "mkdir -p $DEPLOYMENT_DIR" || {
    echo -e "${RED}Error: Failed to create directory on VPS${NC}"
    exit 1
}

# Upload tarball
echo "Uploading $TARBALL to VPS..."
sshpass -p "$VPS_PASSWORD" scp "$TARBALL" "$VPS_USER@$VPS_HOST:$DEPLOYMENT_DIR/" || {
    echo -e "${RED}Error: Failed to upload package${NC}"
    exit 1
}

echo -e "${GREEN}✓ Package uploaded successfully${NC}"
echo ""

echo -e "${CYAN}[3/5] Uploading deployment script...${NC}"
echo ""

# Upload vps-deploy.sh
if [ -f ./vps-deploy.sh ]; then
    sshpass -p "$VPS_PASSWORD" scp ./vps-deploy.sh "$VPS_USER@$VPS_HOST:$DEPLOYMENT_DIR/" || {
        echo -e "${YELLOW}Warning: Could not upload vps-deploy.sh${NC}"
    }
else
    echo -e "${YELLOW}Warning: vps-deploy.sh not found${NC}"
fi

echo ""
echo -e "${CYAN}[4/5] Extracting and building on VPS...${NC}"
echo ""

# Execute deployment on VPS
echo "Running deployment on VPS..."
sshpass -p "$VPS_PASSWORD" ssh "$VPS_USER@$VPS_HOST" "
cd $DEPLOYMENT_DIR
tar -xzf $TARBALL
cd cortexbuild/deployment
nohup docker compose build --no-cache app > /root/docker_build.log 2>&1 &
echo \"Build started. PID: \$!\"
"

echo -e "${GREEN}✓ Build started on VPS${NC}"
echo ""

echo -e "${CYAN}[5/5] Deployment Status${NC}"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║     Deployment Initiated Successfully! 🚀               ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "The Docker build is running in the background on the VPS."
echo ""
echo "To monitor progress, SSH into the VPS:"
echo "  → ssh $VPS_USER@$VPS_HOST"
echo ""
echo "Then run:"
echo "  → tail -f /root/docker_build.log"
echo ""
echo "After build completes, start services:"
echo "  → cd $DEPLOYMENT_DIR/cortexbuild/deployment"
echo "  → docker compose up -d"
echo "  → docker compose exec app sh -c 'cd /app && npx prisma migrate deploy'"
echo ""
echo "Access application:"
echo "  → http://$VPS_HOST:3000"
echo ""
