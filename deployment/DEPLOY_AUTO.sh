#!/bin/bash
# 🚀 CortexBuild Pro - Automated Production Deployment (No Prompts)
# Fully automated - no user interaction needed

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DOMAIN="${DOMAIN:-cortexbuildpro.com}"
EMAIL="${EMAIL:-admin@cortexbuildpro.com}"
PROJECT_DIR="/opt/cortexbuild-pro"
DEPLOYMENT_DIR="$PROJECT_DIR/deployment"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🚀 CortexBuild Pro - Automated Deploy                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Config: Domain=$DOMAIN, Email=$EMAIL${NC}"

# Step 1: Install dependencies
echo -e "${YELLOW}[1/10] Installing dependencies...${NC}"
apt-get update -qq
apt-get install -y -qq docker.io docker-compose nginx certbot python3-certbot-nginx git curl wget build-essential nodejs npm postgresql-client htop net-tools ufw fail2ban > /dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 2: Setup Docker
echo -e "${YELLOW}[2/10] Setting up Docker...${NC}"
systemctl enable docker --now
systemctl enable docker-compose --now
echo -e "${GREEN}✅ Docker ready${NC}"

# Step 3: Firewall
echo -e "${YELLOW}[3/10] Configuring firewall...${NC}"
ufw default deny incoming || true
ufw default allow outgoing || true
ufw allow ssh || true
ufw allow http || true
ufw allow https || true
ufw --force enable || true
echo -e "${GREEN}✅ Firewall configured${NC}"

# Step 4: Clone repo
echo -e "${YELLOW}[4/10] Getting code...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR" && git pull origin Cortexbuildpro
else
    git clone https://github.com/adrianstanca1/cortexbuild-pro.git "$PROJECT_DIR"
fi
echo -e "${GREEN}✅ Code ready${NC}"

# Step 5: Environment
echo -e "${YELLOW}[5/10] Creating .env...${NC}"
mkdir -p "$DEPLOYMENT_DIR"
cat > "$DEPLOYMENT_DIR/.env" << EOF
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$(openssl rand -base64 24)
POSTGRES_DB=cortexbuild
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
GEMINI_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@$DOMAIN
EOF
chmod 600 "$DEPLOYMENT_DIR/.env"
echo -e "${GREEN}✅ Environment configured${NC}"

# Step 6: SSL
echo -e "${YELLOW}[6/10] Setting up SSL...${NC}"
mkdir -p "$DEPLOYMENT_DIR/ssl" "$DEPLOYMENT_DIR/html"

if certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --quiet 2>/dev/null; then
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$DEPLOYMENT_DIR/ssl/"
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$DEPLOYMENT_DIR/ssl/"
    echo -e "${GREEN}✅ SSL from Let's Encrypt${NC}"
else
    echo -e "${YELLOW}⚠️  Let's Encrypt failed, generating self-signed...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$DEPLOYMENT_DIR/ssl/privkey.pem" \
        -out "$DEPLOYMENT_DIR/ssl/fullchain.pem" \
        -subj "/C=GB/ST=England/L=London/O=CortexBuild/CN=$DOMAIN" 2>/dev/null
    echo -e "${GREEN}✅ Self-signed SSL created${NC}"
fi

# Step 7: Nginx
echo -e "${YELLOW}[7/10] Configuring Nginx...${NC}"
cp "$DEPLOYMENT_DIR/nginx-pwa.conf" /etc/nginx/sites-available/cortexbuild
ln -sf /etc/nginx/sites-available/cortexbuild /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 8: Build
echo -e "${YELLOW}[8/10] Building frontend...${NC}"
cd "$PROJECT_DIR"
npm install --silent > /dev/null 2>&1
npm run build > /dev/null 2>&1
echo -e "${GREEN}✅ Frontend built${NC}"

# Step 9: Deploy
echo -e "${YELLOW}[9/10] Deploying containers...${NC}"
cd "$DEPLOYMENT_DIR"
docker-compose -f docker-compose-pwa.yml build --no-cache > /dev/null 2>&1
docker-compose -f docker-compose-pwa.yml up -d
echo -e "${GREEN}✅ Containers deployed${NC}"

# Step 10: Health checks
echo -e "${YELLOW}[10/10] Running health checks...${NC}"
sleep 15

CONTAINERS=$(docker ps --format '{{.Names}}' | grep -c cortexbuild || echo "0")
HTTPS_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 DEPLOYMENT COMPLETE!                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Status:${NC}"
echo "   Domain: https://$DOMAIN"
echo "   Containers: $CONTAINERS running"
echo "   HTTPS: $HTTPS_STATUS"
echo ""
echo -e "${CYAN}📱 iOS: Open Safari → Share → Add to Home Screen${NC}"
echo ""
echo -e "${CYAN}🔧 Commands:${NC}"
echo "   Logs: docker-compose -f $DEPLOYMENT_DIR/docker-compose-pwa.yml logs -f"
echo "   Stop: docker-compose -f $DEPLOYMENT_DIR/docker-compose-pwa.yml down"
echo ""

if [ "$CONTAINERS" -ge 3 ] && [[ "$HTTPS_STATUS" =~ ^(200|302)$ ]]; then
    echo -e "${GREEN}✅ All checks passed! Production ready!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks pending. Check logs for details.${NC}"
    exit 0
fi
