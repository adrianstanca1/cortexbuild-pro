#!/bin/bash
# CortexBuild Pro - One-Command VPS Deployment
# This script handles everything from your local machine

set -e

VPS_HOST="72.62.132.43"
VPS_USER="root"
VPS_PASSWORD="Cumparavinde1@"
PROJECT_ROOT="/home/runner/work/cortexbuild-pro/cortexbuild-pro"

echo "================================================"
echo "CortexBuild Pro - One-Command Deployment"
echo "================================================"
echo ""
echo "Target VPS: $VPS_HOST"
echo ""

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo "Error: sshpass is not installed"
    echo ""
    echo "Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo ""
    echo "Or use manual deployment (see DEPLOYMENT_TO_VPS.md)"
    exit 1
fi

# Test connection
echo "Testing VPS connection..."
if ! timeout 10 sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo 'Connection successful'" 2>/dev/null; then
    echo ""
    echo "❌ Cannot connect to VPS at $VPS_HOST"
    echo ""
    echo "Please check:"
    echo "  1. VPS is running and accessible"
    echo "  2. SSH service is enabled (port 22)"
    echo "  3. Firewall allows SSH connections"
    echo "  4. Password is correct"
    echo ""
    echo "You can use manual deployment instead:"
    echo "  See: deployment/DEPLOYMENT_TO_VPS.md"
    exit 1
fi

echo "✓ VPS connection successful"
echo ""

# Create deployment package
echo "Creating deployment package..."
cd "$PROJECT_ROOT"
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env' \
    --exclude='.git' \
    --exclude='*.tar.gz' \
    -czf /tmp/cortexbuild-deploy.tar.gz \
    nextjs_space/ \
    deployment/ \
    README.md \
    DEPLOYMENT_GUIDE.md \
    BUILD_STATUS.md

echo "✓ Package created ($(du -h /tmp/cortexbuild-deploy.tar.gz | cut -f1))"
echo ""

# Transfer package
echo "Transferring to VPS..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no \
    /tmp/cortexbuild-deploy.tar.gz \
    "$VPS_USER@$VPS_HOST:/tmp/"
echo "✓ Transfer complete"
echo ""

# Deploy on VPS
echo "Deploying on VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'ENDSSH'
set -e

echo "Starting deployment on VPS..."

# Extract package
mkdir -p /var/www/cortexbuild-pro
cd /var/www/cortexbuild-pro
tar -xzf /tmp/cortexbuild-deploy.tar.gz
rm /tmp/cortexbuild-deploy.tar.gz

# Run deployment script
cd deployment
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
ENDSSH

echo ""
echo "================================================"
echo "✓ Deployment Complete!"
echo "================================================"
echo ""
echo "Your application is now running at:"
echo "  → http://$VPS_HOST:3000"
echo ""
echo "To view logs:"
echo "  ssh root@$VPS_HOST 'cd /var/www/cortexbuild-pro/deployment && docker-compose logs -f'"
echo ""
echo "To access the VPS:"
echo "  ssh root@$VPS_HOST"
echo ""

# Clean up local package
rm -f /tmp/cortexbuild-deploy.tar.gz
