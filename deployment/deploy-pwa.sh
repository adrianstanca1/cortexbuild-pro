#!/bin/bash
# 🚀 CortexBuild Pro PWA - One-Click Deploy Script
# Deploy complet cu SSL, Docker, și configurare PWA pentru iOS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-cortexbuildpro.com}"
EMAIL="${EMAIL:-admin@cortexbuildpro.com}"
PROJECT_DIR="/opt/cortexbuild-pro"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CortexBuild Pro PWA - iOS Deploy                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root (sudo)$NC"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}[1/8] Installing dependencies...${NC}"
apt-get update && apt-get install -y \
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
    npm

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 2: Setup Docker
echo -e "${YELLOW}[2/8] Setting up Docker...${NC}"
systemctl enable docker
systemctl start docker
systemctl enable docker-compose
systemctl start docker-compose
echo -e "${GREEN}✅ Docker ready${NC}"

# Step 3: Clone/Update repository
echo -e "${YELLOW}[3/8] Getting latest code...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git pull origin main
else
    git clone https://github.com/adrianstanca1/cortexbuild-pro.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi
echo -e "${GREEN}✅ Code ready${NC}"

# Step 4: Create .env file
echo -e "${YELLOW}[4/8] Creating environment configuration...${NC}"
cat > "$PROJECT_DIR/deployment/.env" << EOF
# Database
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$(openssl rand -base64 24)
POSTGRES_DB=cortexbuild

# NextAuth
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Encryption
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Optional APIs (add your keys)
GEMINI_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@$DOMAIN
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EOF

chmod 600 "$PROJECT_DIR/deployment/.env"
echo -e "${GREEN}✅ Environment configured${NC}"

# Step 5: Generate SSL certificates
echo -e "${YELLOW}[5/8] Setting up SSL certificates...${NC}"
mkdir -p "$PROJECT_DIR/deployment/ssl"
mkdir -p "$PROJECT_DIR/deployment/html"

# Try to get certificates from Let's Encrypt
if certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive 2>/dev/null; then
    # Copy certificates
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$PROJECT_DIR/deployment/ssl/"
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$PROJECT_DIR/deployment/ssl/"
    echo -e "${GREEN}✅ SSL certificates obtained${NC}"
else
    echo -e "${YELLOW}⚠️  Let's Encrypt failed. Generating self-signed certificate...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_DIR/deployment/ssl/privkey.pem" \
        -out "$PROJECT_DIR/deployment/ssl/fullchain.pem" \
        -subj "/C=GB/ST=England/L=London/O=CortexBuild/CN=$DOMAIN"
    echo -e "${YELLOW}⚠️  Self-signed certificate created (replace with Let's Encrypt later)${NC}"
fi

# Step 6: Copy Nginx config
echo -e "${YELLOW}[6/8] Configuring Nginx...${NC}"
cp "$PROJECT_DIR/deployment/nginx-pwa.conf" /etc/nginx/sites-available/cortexbuild
ln -sf /etc/nginx/sites-available/cortexbuild /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 7: Build and deploy
echo -e "${YELLOW}[7/8] Building and deploying application...${NC}"
cd "$PROJECT_DIR/deployment"

# Build Docker images
docker-compose -f docker-compose-pwa.yml build --no-cache

# Start services
docker-compose -f docker-compose-pwa.yml up -d

echo -e "${GREEN}✅ Application deployed${NC}"

# Step 8: Health check
echo -e "${YELLOW}[8/8] Running health checks...${NC}"
sleep 10

# Check containers
if docker ps | grep -q cortexbuild; then
    echo -e "${GREEN}✅ All containers running${NC}"
else
    echo -e "${RED}❌ Some containers failed to start${NC}"
    docker-compose -f docker-compose-pwa.yml logs
    exit 1
fi

# Check HTTPS
if curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|302"; then
    echo -e "${GREEN}✅ HTTPS working${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS might need manual verification${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 DEPLOYMENT COMPLETE!                             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📱 iOS Installation:${NC}"
echo "   1. Open Safari on iPhone/iPad"
echo "   2. Navigate to https://$DOMAIN"
echo "   3. Tap Share button (square with arrow)"
echo "   4. Select 'Add to Home Screen'"
echo "   5. Tap 'Add' in top-right corner"
echo ""
echo -e "${BLUE}🔗 URLs:${NC}"
echo "   Production: https://$DOMAIN"
echo "   Alternative: https://www.$DOMAIN"
echo ""
echo -e "${BLUE}📊 Commands:${NC}"
echo "   View logs:     cd $PROJECT_DIR/deployment && docker-compose -f docker-compose-pwa.yml logs -f"
echo "   Stop:          docker-compose -f docker-compose-pwa.yml down"
echo "   Restart:       docker-compose -f docker-compose-pwa.yml restart"
echo "   Update:        cd $PROJECT_DIR && git pull && docker-compose -f docker-compose-pwa.yml up -d --build"
echo ""
echo -e "${BLUE}📁 Project location: $PROJECT_DIR${NC}"
echo ""
