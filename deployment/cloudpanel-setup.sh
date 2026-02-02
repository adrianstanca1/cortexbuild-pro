#!/bin/bash
# ===========================================
# CortexBuild Pro - CloudPanel Setup Script
# ===========================================

set -e

echo "========================================="
echo "CortexBuild Pro - CloudPanel Deployment"
echo "========================================="

# Configuration
APP_DIR="/home/cortexbuild/htdocs/cortexbuild.yourdomain.com"
DB_NAME="cortexbuild"
DB_USER="cortexbuild"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js 20+ required. Current: $(node -v)${NC}"
    echo "Run: nvm install 20 && nvm use 20"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check yarn
if ! command -v yarn &> /dev/null; then
    echo "Installing yarn..."
    npm install -g yarn
fi
echo -e "${GREEN}✓ Yarn $(yarn -v)${NC}"

echo -e "${YELLOW}Step 2: Setting up application...${NC}"

cd $APP_DIR

# Install dependencies
echo "Installing dependencies..."
yarn install

# Generate Prisma client
echo "Generating Prisma client..."
yarn prisma generate

echo -e "${YELLOW}Step 3: Creating .env file...${NC}"

if [ ! -f .env ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:YOUR_DB_PASSWORD@localhost:5432/${DB_NAME}?schema=public"

# NextAuth
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://cortexbuild.yourdomain.com"

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_BUCKET_NAME=""
AWS_REGION=""
AWS_FOLDER_PREFIX=""
EOF
    echo -e "${YELLOW}⚠ Created .env file - EDIT IT with your database password and domain!${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo -e "${YELLOW}Step 4: Running database migrations...${NC}"
yarn prisma migrate deploy

echo -e "${YELLOW}Step 5: Seeding database...${NC}"
yarn prisma db seed || echo "Seeding skipped or already done"

echo -e "${YELLOW}Step 6: Building application...${NC}"
yarn build

echo -e "${GREEN}========================================="
echo "✓ Setup Complete!"
echo "=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your actual values"
echo "2. In CloudPanel, set startup command: yarn start"
echo "3. Set Node.js version to 20 in CloudPanel"
echo "4. Enable SSL in CloudPanel"
echo ""
echo "Login credentials (from seed):"
echo "  Super Admin: adrian.stanca1@gmail.com"
echo "  Company Owner: adrian@ascladdingltd.co.uk"
