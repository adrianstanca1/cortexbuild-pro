#!/bin/bash
# CortexBuild Pro - VPS Deployment Script
# Run this on the VPS server: bash vps-deploy.sh

set -e

echo "=== CortexBuild Pro VPS Deployment ==="
echo "Domain: cortexbuildpro.com"
echo ""

# Navigate to deployment directory
cd /root/cortexbuild_pro/deployment

# Copy environment file
cp .env.production .env

# Stop existing containers
echo "Stopping existing containers..."
docker compose down 2>/dev/null || true

# Build the app
echo "Building application..."
docker compose build app

# Start services
echo "Starting services..."
docker compose up -d

# Wait for database
echo "Waiting for database to be ready..."
sleep 15

# Run database migrations
echo "Running database migrations..."
docker exec cortexbuild-app sh -c "npx prisma migrate deploy"

# Seed database
echo "Seeding database..."
docker exec cortexbuild-app sh -c "npx prisma db seed" || echo "Seed may already exist"

# Install SSL certificate
echo ""
echo "=== SSL Setup ==="
echo "Run these commands to setup SSL:"
echo ""
echo "apt install certbot -y"
echo "certbot certonly --standalone -d cortexbuildpro.com -d www.cortexbuildpro.com"
echo ""
echo "Then update nginx to use SSL config and restart:"
echo "docker compose down"
echo "mv nginx.conf nginx-http.conf"
echo "mv nginx-ssl.conf nginx.conf"
echo "docker compose up -d"
echo ""

# Show status
echo "=== Container Status ==="
docker compose ps

echo ""
echo "=== Deployment Complete ==="
echo "HTTP Access: http://72.62.132.43"
echo "After SSL: https://cortexbuildpro.com"
