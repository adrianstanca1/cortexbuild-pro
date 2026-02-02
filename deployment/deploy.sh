#!/bin/bash
set -e

echo "=== CortexBuild Pro Deployment ==="
cd /root/cortexbuild

# Create .env file if not exists
if [ ! -f .env ]; then
    cat > .env << 'EOF'
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=CortexSecure2026
POSTGRES_DB=cortexbuild
DATABASE_URL=postgresql://cortexbuild:CortexSecure2026@db:5432/cortexbuild?schema=public
NEXTAUTH_URL=https://cortexbuildpro.com
NEXTAUTH_SECRET=MlKVwMSzZh25ydHp6rFPiaxTQ2WT88nK
NODE_ENV=production
PORT=3000
ENCRYPTION_KEY=cortexbuild_encryption_key_2026_secure
ABACUSAI_API_KEY=aab7e27d61c14a81a2bcf4d395478e4c
EOF
    echo "Created .env file"
fi

# Stop existing containers
echo "Stopping existing containers..."
docker compose -f deployment/docker-compose.yml down 2>/dev/null || true

# Build and start containers
echo "Building and starting containers..."
docker compose -f deployment/docker-compose.yml build --no-cache
docker compose -f deployment/docker-compose.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 15

# Check container status
echo "Container status:"
docker ps -a

echo ""
echo "=== Deployment Complete ==="
echo "App should be available at http://localhost:3000"
echo "Configure CloudPanel to proxy to port 3000"
