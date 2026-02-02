#!/bin/bash
# ===========================================
# CortexBuild Pro - VPS Docker Setup Script
# ===========================================

set -e

echo "========================================="
echo "CortexBuild Pro - VPS Docker Deployment"
echo "========================================="

# Configuration - EDIT THESE
DOMAIN="cortexbuild.yourdomain.com"
DB_PASSWORD="CortexBuild2026Secure!"
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Checking Docker...${NC}"

if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
echo -e "${GREEN}✓ Docker $(docker -v)${NC}"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    apt-get update && apt-get install -y docker-compose-plugin
fi
echo -e "${GREEN}✓ Docker Compose available${NC}"

echo -e "${YELLOW}Step 2: Creating .env file...${NC}"

cd /root/cortexbuild_pro/deployment

cat > .env << EOF
# PostgreSQL
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=cortexbuild

# NextAuth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=http://${DOMAIN}

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=
AWS_FOLDER_PREFIX=
EOF

echo -e "${GREEN}✓ .env file created${NC}"

echo -e "${YELLOW}Step 3: Building Docker images...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}Step 4: Starting services...${NC}"
docker compose up -d

echo -e "${YELLOW}Step 5: Waiting for database...${NC}"
sleep 15

echo -e "${YELLOW}Step 6: Running migrations...${NC}"
docker compose exec -T app npx prisma migrate deploy || echo "Migrations may need retry"

echo -e "${YELLOW}Step 7: Seeding database...${NC}"
docker compose exec -T app npx prisma db seed || echo "Seeding skipped"

echo -e "${GREEN}========================================="
echo "✓ Deployment Complete!"
echo "=========================================${NC}"
echo ""
echo "Access your app at: http://${DOMAIN}"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f app    # View app logs"
echo "  docker compose ps             # Check status"
echo "  docker compose restart app    # Restart app"
echo ""
echo "Login credentials:"
echo "  Super Admin: adrian.stanca1@gmail.com"
echo "  Company Owner: adrian@ascladdingltd.co.uk"
