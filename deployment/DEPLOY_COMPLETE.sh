#!/bin/bash
# 🚀 CortexBuild Pro - Complete Production Deployment
# Deploy frontend, backend, database, and all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DOMAIN="${DOMAIN:-cortexbuildpro.com}"
EMAIL="${EMAIL:-admin@cortexbuildpro.com}"
PROJECT_DIR="/opt/cortexbuild-pro"
DEPLOYMENT_DIR="$PROJECT_DIR/deployment"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🚀 CortexBuild Pro - Complete Production Deploy       ║"
echo "║                                                          ║"
echo "║   Full-stack PWA for iOS + Dashboard + Backend          ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root (sudo)$NC"
    exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo "   Project Dir: $PROJECT_DIR"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deployment cancelled${NC}"
    exit 0
fi

# Step 1: Install system dependencies
echo ""
echo -e "${YELLOW}[1/10] Installing system dependencies...${NC}"
apt-get update
apt-get install -y \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl \
    wget \
    build-essential \
    nodejs \
    npm \
    postgresql-client \
    htop \
    net-tools \
    ufw \
    fail2ban
echo -e "${GREEN}✅ System dependencies installed${NC}"

# Step 2: Setup Docker
echo ""
echo -e "${YELLOW}[2/10] Setting up Docker...${NC}"
systemctl enable docker
systemctl start docker
systemctl enable docker-compose
systemctl start docker-compose
usermod -aG docker root
echo -e "${GREEN}✅ Docker ready${NC}"

# Step 3: Security setup (UFW firewall)
echo ""
echo -e "${YELLOW}[3/10] Configuring firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
echo -e "${GREEN}✅ Firewall configured (SSH, HTTP, HTTPS)${NC}"

# Step 4: Clone/Update repository
echo ""
echo -e "${YELLOW}[4/10] Getting latest code...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git pull origin Cortexbuildpro
else
    git clone https://github.com/adrianstanca1/cortexbuild-pro.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi
echo -e "${GREEN}✅ Code ready (branch: Cortexbuildpro)${NC}"

# Step 5: Create environment configuration
echo ""
echo -e "${YELLOW}[5/10] Creating environment configuration...${NC}"
cat > "$DEPLOYMENT_DIR/.env" << EOF
# Database
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$(openssl rand -base64 24)
POSTGRES_DB=cortexbuild

# NextAuth
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Encryption
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Optional APIs
GEMINI_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@$DOMAIN
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EOF

chmod 600 "$DEPLOYMENT_DIR/.env"
echo -e "${GREEN}✅ Environment configured${NC}"

# Step 6: SSL Certificates
echo ""
echo -e "${YELLOW}[6/10] Setting up SSL certificates...${NC}"
mkdir -p "$DEPLOYMENT_DIR/ssl"
mkdir -p "$DEPLOYMENT_DIR/html"

# Try Let's Encrypt
if certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive 2>/dev/null; then
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$DEPLOYMENT_DIR/ssl/"
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$DEPLOYMENT_DIR/ssl/"
    echo -e "${GREEN}✅ SSL certificates obtained from Let's Encrypt${NC}"
else
    echo -e "${YELLOW}⚠️  Let's Encrypt failed. Generating self-signed certificate...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$DEPLOYMENT_DIR/ssl/privkey.pem" \
        -out "$DEPLOYMENT_DIR/ssl/fullchain.pem" \
        -subj "/C=GB/ST=England/L=London/O=CortexBuild/CN=$DOMAIN"
    echo -e "${YELLOW}⚠️  Self-signed certificate created (replace with Let's Encrypt later)${NC}"
fi

# Step 7: Configure Nginx
echo ""
echo -e "${YELLOW}[7/10] Configuring Nginx...${NC}"
cp "$DEPLOYMENT_DIR/nginx-pwa.conf" /etc/nginx/sites-available/cortexbuild
ln -sf /etc/nginx/sites-available/cortexbuild /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 8: Build frontend
echo ""
echo -e "${YELLOW}[8/10] Building frontend with PWA...${NC}"
cd "$PROJECT_DIR"
npm install
npm run build
echo -e "${GREEN}✅ Frontend built (PWA ready)${NC}"

# Step 9: Deploy Docker containers
echo ""
echo -e "${YELLOW}[9/10] Deploying Docker containers...${NC}"
cd "$DEPLOYMENT_DIR"
docker-compose -f docker-compose-pwa.yml build --no-cache
docker-compose -f docker-compose-pwa.yml up -d
echo -e "${GREEN}✅ Containers deployed${NC}"

# Step 10: Health checks
echo ""
echo -e "${YELLOW}[10/10] Running health checks...${NC}"
sleep 15

# Check containers
CONTAINERS_RUNNING=$(docker ps | grep -c cortexbuild || true)
if [ "$CONTAINERS_RUNNING" -ge 3 ]; then
    echo -e "${GREEN}✅ All containers running ($CONTAINERS_RUNNING/3)${NC}"
else
    echo -e "${RED}❌ Some containers failed to start${NC}"
    docker-compose -f docker-compose-pwa.yml logs
    exit 1
fi

# Check HTTPS
HTTPS_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN || echo "000")
if [ "$HTTPS_STATUS" = "200" ] || [ "$HTTPS_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ HTTPS working (Status: $HTTPS_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS returned status $HTTPS_STATUS (may need manual verification)${NC}"
fi

# Check health endpoint
HEALTH_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health endpoint responding${NC}"
else
    echo -e "${YELLOW}⚠️  Health endpoint returned $HEALTH_STATUS${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║   🎉 DEPLOYMENT COMPLETE!                                ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📊 Deployment Summary:${NC}"
echo "   Domain: https://$DOMAIN"
echo "   Alternative: https://www.$DOMAIN"
echo "   Project Dir: $PROJECT_DIR"
echo "   Containers: $CONTAINERS_RUNNING running"
echo ""

echo -e "${CYAN}📱 iOS Installation:${NC}"
echo "   1. Open Safari on iPhone/iPad"
echo "   2. Navigate to https://$DOMAIN"
echo "   3. Tap Share button (square with arrow)"
echo "   4. Select 'Add to Home Screen'"
echo "   5. Tap 'Add' in top-right corner"
echo ""

echo -e "${CYAN}🔧 Management Commands:${NC}"
echo "   View logs:     cd $DEPLOYMENT_DIR && docker-compose logs -f"
echo "   Stop:          docker-compose -f docker-compose-pwa.yml down"
echo "   Restart:       docker-compose -f docker-compose-pwa.yml restart"
echo "   Update:        cd $PROJECT_DIR && git pull && docker-compose up -d --build"
echo "   Backup DB:     docker exec cortexbuild-db pg_dump -U cortexbuild cortexbuild > backup.sql"
echo ""

echo -e "${CYAN}📈 Monitoring:${NC}"
echo "   Health:    curl https://$DOMAIN/health"
echo "   Containers: docker ps"
echo "   Logs:      docker-compose logs -f app"
echo ""

echo -e "${CYAN}📁 Important Files:${NC}"
echo "   Config:    $DEPLOYMENT_DIR/.env"
echo "   SSL:       $DEPLOYMENT_DIR/ssl/"
echo "   Logs:      /var/log/docker/cortexbuild-*.log"
echo ""

echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "   1. Test the application at https://$DOMAIN"
echo "   2. Install on iOS device (see instructions above)"
echo "   3. Configure email/SMS APIs in .env file"
echo "   4. Set up automated backups"
echo "   5. Monitor logs for first 24 hours"
echo ""

echo -e "${GREEN}✅ All done! Your CortexBuild Pro PWA is now live!${NC}"
echo ""
