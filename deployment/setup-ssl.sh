#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - SSL Setup Script
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

echo -e "${GREEN}Setting up SSL for: $DOMAIN${NC}"
echo "Email: $EMAIL"
echo ""

# Create temporary nginx config for initial cert
cat > nginx-temp.conf << 'EOF'
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        server_name _;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            return 200 'OK';
        }
    }
}
EOF

echo "[1/4] Starting temporary nginx for domain verification..."
docker compose stop nginx 2>/dev/null || true
docker run -d --name temp-nginx \
    -p 80:80 \
    -v $(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
    -v cortexbuild_certbot-webroot:/var/www/certbot \
    nginx:alpine

sleep 3

echo "[2/4] Requesting SSL certificate from Let's Encrypt..."
docker run --rm \
    -v cortexbuild_certbot-etc:/etc/letsencrypt \
    -v cortexbuild_certbot-webroot:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

echo "[3/4] Stopping temporary nginx..."
docker stop temp-nginx && docker rm temp-nginx
rm nginx-temp.conf

echo "[4/4] Updating nginx config with domain..."
sed -i "s/\${DOMAIN}/$DOMAIN/g" nginx.conf

# Update .env with domain
sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|" .env

echo ""
echo -e "${GREEN}SSL setup complete!${NC}"
echo ""
echo "Starting services with SSL..."
docker compose up -d nginx

echo ""
echo "Your site is now available at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "SSL certificates will auto-renew. To manually renew:"
echo "  docker compose run --rm certbot renew"
