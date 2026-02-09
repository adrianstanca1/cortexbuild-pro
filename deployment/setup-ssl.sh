#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - SSL Setup Script
# ============================================
# Sets up Let's Encrypt SSL certificates using the certbot service
# defined in docker-compose.yml, then switches nginx to SSL mode.
#
# Usage:
#   ./setup-ssl.sh <domain> [email]
#   ./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Usage: ./setup-ssl.sh <domain> [email]${NC}"
    echo "Example: ./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    EMAIL="admin@$DOMAIN"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SSL Setup for: ${DOMAIN}${NC}"
echo -e "${BLUE}========================================${NC}"
echo "  Email: $EMAIL"
echo ""

# Step 1: Ensure nginx is running with HTTP config (for ACME challenge)
echo -e "${BLUE}[1/5]${NC} Ensuring nginx is running for domain verification..."
docker compose up -d nginx
sleep 3

# Verify nginx is serving on port 80
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:80/" | grep -qE "200|301|302"; then
    echo -e "${GREEN}  Nginx is serving on port 80${NC}"
else
    echo -e "${YELLOW}  Warning: nginx may not be fully ready yet, proceeding anyway${NC}"
fi

# Step 2: Request SSL certificate
echo ""
echo -e "${BLUE}[2/5]${NC} Requesting SSL certificate from Let's Encrypt..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.${DOMAIN}"

echo -e "${GREEN}  Certificate obtained${NC}"

# Step 3: Update nginx-ssl.conf with actual domain
echo ""
echo -e "${BLUE}[3/5]${NC} Updating nginx SSL config with domain..."
sed -i "s/cortexbuildpro\.com/${DOMAIN}/g" nginx-ssl.conf
echo -e "${GREEN}  nginx-ssl.conf updated for ${DOMAIN}${NC}"

# Step 4: Update .env with domain
echo ""
echo -e "${BLUE}[4/5]${NC} Updating environment configuration..."
if [ -f .env ]; then
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://www.${DOMAIN}|" .env
    sed -i "s|NEXT_PUBLIC_WEBSOCKET_URL=.*|NEXT_PUBLIC_WEBSOCKET_URL=https://www.${DOMAIN}|" .env
    echo -e "${GREEN}  .env updated${NC}"
else
    echo -e "${YELLOW}  No .env found, skipping env update${NC}"
fi

# Step 5: Switch to SSL mode and restart
echo ""
echo -e "${BLUE}[5/5]${NC} Switching to SSL configuration..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx

# Restart app to pick up updated NEXTAUTH_URL
docker compose restart app
sleep 5

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SSL Setup Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  Your site is now available at:"
echo -e "    ${GREEN}https://${DOMAIN}${NC}"
echo -e "    ${GREEN}https://www.${DOMAIN}${NC}"
echo ""
echo "  SSL certificates auto-renew via the certbot container."
echo "  To manually renew:"
echo "    docker compose run --rm certbot renew"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx"
echo ""
echo "  To check certificate status:"
echo "    docker compose run --rm certbot certificates"
echo ""
