#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Complete VPS Deployment
# ============================================
# This script handles the complete deployment to VPS
# including setup, configuration, and deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_HOST="72.62.132.43"
VPS_USER="root"
VPS_PASSWORD="Cumparavinde1@"
DEPLOY_PATH="/var/www/cortexbuild-pro"
DOMAIN="cortexbuildpro.com"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          CortexBuild Pro - VPS Deployment                ║
║                                                           ║
║     Complete Construction Management Platform            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}Target VPS: ${VPS_HOST}${NC}"
echo -e "${CYAN}Deploy Path: ${DEPLOY_PATH}${NC}"
echo ""

# Function to run commands on VPS
run_remote() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "$@"
}

# Function to transfer files to VPS
transfer_files() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -r "$1" "${VPS_USER}@${VPS_HOST}:$2"
}

echo -e "${CYAN}[1/8] Testing VPS Connection...${NC}"
if run_remote "echo 'Connection successful'"; then
    echo -e "${GREEN}✓ VPS connection successful${NC}"
else
    echo -e "${RED}✗ Failed to connect to VPS${NC}"
    exit 1
fi
echo ""

echo -e "${CYAN}[2/8] Installing Dependencies on VPS...${NC}"
run_remote "
    set -e
    apt-get update
    apt-get install -y docker.io docker-compose git ufw sshpass openssl
    systemctl enable docker
    systemctl start docker
    echo 'Dependencies installed'
"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${CYAN}[3/8] Configuring Firewall...${NC}"
run_remote "
    set -e
    ufw --force enable
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw status
"
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${CYAN}[4/8] Creating Deployment Directory...${NC}"
run_remote "
    set -e
    mkdir -p ${DEPLOY_PATH}
    cd ${DEPLOY_PATH}
    # Clean up any previous deployment
    if [ -d nextjs_space ]; then
        echo 'Backing up previous deployment...'
        tar -czf backup_\$(date +%Y%m%d_%H%M%S).tar.gz nextjs_space deployment || true
    fi
"
echo -e "${GREEN}✓ Deployment directory ready${NC}"
echo ""

echo -e "${CYAN}[5/8] Transferring Application Files...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Create a temporary directory for transfer
TEMP_TRANSFER="/tmp/cortexbuild-transfer-$$"
mkdir -p "$TEMP_TRANSFER"

# Copy necessary files
echo "Preparing files for transfer..."
cp -r "$PROJECT_ROOT/nextjs_space" "$TEMP_TRANSFER/"
cp -r "$PROJECT_ROOT/deployment" "$TEMP_TRANSFER/"
cp "$PROJECT_ROOT/README.md" "$TEMP_TRANSFER/" 2>/dev/null || true
cp "$PROJECT_ROOT/DEPLOYMENT_GUIDE.md" "$TEMP_TRANSFER/" 2>/dev/null || true

# Remove unnecessary files
rm -rf "$TEMP_TRANSFER/nextjs_space/node_modules"
rm -rf "$TEMP_TRANSFER/nextjs_space/.next"
rm -f "$TEMP_TRANSFER/nextjs_space/.env"

echo "Transferring files to VPS..."
transfer_files "$TEMP_TRANSFER/*" "${DEPLOY_PATH}/"

# Clean up
rm -rf "$TEMP_TRANSFER"

echo -e "${GREEN}✓ Files transferred${NC}"
echo ""

echo -e "${CYAN}[6/8] Configuring Environment...${NC}"
run_remote "
    set -e
    cd ${DEPLOY_PATH}/deployment
    
    # Generate secure passwords and secrets
    POSTGRES_PASSWORD=\$(openssl rand -base64 32)
    NEXTAUTH_SECRET=\$(openssl rand -base64 32)
    
    # Create .env file
    cat > .env << 'ENVEOF'
# Database Configuration
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=REPLACE_POSTGRES_PASSWORD
POSTGRES_DB=cortexbuild
DATABASE_URL=postgresql://cortexbuild:REPLACE_POSTGRES_PASSWORD@postgres:5432/cortexbuild?schema=public

# NextAuth Configuration
NEXTAUTH_SECRET=REPLACE_NEXTAUTH_SECRET
NEXTAUTH_URL=http://${VPS_HOST}:3000

# Domain Configuration
DOMAIN=${DOMAIN}
SSL_EMAIL=admin@${DOMAIN}

# Real-time Communication
NEXT_PUBLIC_WEBSOCKET_URL=http://${VPS_HOST}:3000
WEBSOCKET_PORT=3000

# AWS S3 (Optional - can be configured later)
AWS_PROFILE=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
AWS_FOLDER_PREFIX=

# AbacusAI API (Optional - can be configured later)
ABACUSAI_API_KEY=
WEB_APP_ID=

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SendGrid (Optional)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@${DOMAIN}
SENDGRID_FROM_NAME=CortexBuild Pro
ENVEOF

    # Replace placeholders with actual values
    sed -i \"s/REPLACE_POSTGRES_PASSWORD/\$POSTGRES_PASSWORD/g\" .env
    sed -i \"s/REPLACE_NEXTAUTH_SECRET/\$NEXTAUTH_SECRET/g\" .env
    
    echo 'Environment configured'
    echo ''
    echo 'Generated credentials:'
    echo '  Database Password: '\$POSTGRES_PASSWORD
    echo '  NextAuth Secret: '\$NEXTAUTH_SECRET
    echo ''
    echo 'IMPORTANT: Save these credentials securely!'
    echo ''
"
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

echo -e "${CYAN}[7/8] Building and Starting Services...${NC}"
run_remote "
    set -e
    cd ${DEPLOY_PATH}/deployment
    
    echo 'Building Docker images...'
    docker-compose -f docker-compose.yml build
    
    echo 'Starting services...'
    docker-compose -f docker-compose.yml up -d
    
    echo 'Waiting for database to be ready...'
    sleep 15
    
    echo 'Running database migrations...'
    docker-compose -f docker-compose.yml exec -T app sh -c 'cd /app && npx prisma migrate deploy' || echo 'Migration will run on first startup'
    
    echo 'Services started successfully'
"
echo -e "${GREEN}✓ Services started${NC}"
echo ""

echo -e "${CYAN}[8/8] Verifying Deployment...${NC}"
sleep 10

# Test if application is accessible
if curl -f -s "http://${VPS_HOST}:3000/api/auth/providers" > /dev/null; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${YELLOW}⚠ Application may still be starting up${NC}"
fi
echo ""

# Get service status
run_remote "cd ${DEPLOY_PATH}/deployment && docker-compose -f docker-compose.yml ps"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Deployment Complete! 🎉${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Application URLs:"
echo "  → http://${VPS_HOST}:3000"
echo "  → http://${VPS_HOST} (via Nginx)"
echo ""
echo "Useful Commands:"
echo "  View logs:"
echo "    ssh root@${VPS_HOST} 'cd ${DEPLOY_PATH}/deployment && docker-compose logs -f'"
echo ""
echo "  Restart services:"
echo "    ssh root@${VPS_HOST} 'cd ${DEPLOY_PATH}/deployment && docker-compose restart'"
echo ""
echo "  Access database:"
echo "    ssh root@${VPS_HOST} 'cd ${DEPLOY_PATH}/deployment && docker-compose exec postgres psql -U cortexbuild -d cortexbuild'"
echo ""
echo "  Stop services:"
echo "    ssh root@${VPS_HOST} 'cd ${DEPLOY_PATH}/deployment && docker-compose down'"
echo ""
echo "Next Steps:"
echo "  1. Configure domain DNS to point to ${VPS_HOST}"
echo "  2. Run SSL setup: ssh root@${VPS_HOST} 'cd ${DEPLOY_PATH}/deployment && ./setup-ssl.sh ${DOMAIN} admin@${DOMAIN}'"
echo "  3. Update NEXTAUTH_URL and NEXT_PUBLIC_WEBSOCKET_URL to use domain"
echo "  4. Configure AWS S3, AbacusAI API, and other optional services in .env"
echo "  5. Create initial admin user via application signup"
echo ""
