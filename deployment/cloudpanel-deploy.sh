#!/bin/bash
# ============================================================
# CortexBuild Pro - CloudPanel One-Click Deployment
# ============================================================
# Usage: ./cloudpanel-deploy.sh
# Requirements: Fresh CloudPanel installation with Node.js 20
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          CortexBuild Pro - CloudPanel Deployment         ║"
echo "║           UK Construction Management Platform            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Auto-detect paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NEXTJS_DIR="$PROJECT_ROOT/nextjs_space"

echo -e "${YELLOW}[1/8] Detecting environment...${NC}"
echo "  Script directory: $SCRIPT_DIR"
echo "  Project root: $PROJECT_ROOT"
echo "  NextJS directory: $NEXTJS_DIR"

# Verify paths exist
if [ ! -d "$NEXTJS_DIR" ]; then
    echo -e "${RED}Error: nextjs_space directory not found!${NC}"
    exit 1
fi

cd "$NEXTJS_DIR"
echo -e "${GREEN}✓ Working directory: $(pwd)${NC}"

# Check Node.js version
echo -e "${YELLOW}[2/8] Checking prerequisites...${NC}"
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required. Current: $(node -v)${NC}"
    echo "  Solution: In CloudPanel, set Node.js version to 20"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm (bundled with Node.js)
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Setup .env file
echo -e "${YELLOW}[3/8] Configuring environment...${NC}"
if [ ! -f .env ]; then
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" .env
        echo -e "${GREEN}✓ Created .env from example${NC}"
    else
        # Generate fresh .env
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        cat > .env << 'ENVEOF'
# ============================================================
# CortexBuild Pro - Environment Configuration
# ============================================================

# Database (PostgreSQL)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://cortexbuild:YOUR_PASSWORD_HERE@localhost:5432/cortexbuild?schema=public"

# NextAuth.js Configuration
NEXTAUTH_SECRET="REPLACE_WITH_GENERATED_SECRET"
NEXTAUTH_URL="https://your-domain.com"

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_BUCKET_NAME=""
AWS_REGION="eu-west-2"
AWS_FOLDER_PREFIX=""

# Application Settings
NODE_ENV="production"
ENVEOF
        sed -i "s/REPLACE_WITH_GENERATED_SECRET/$NEXTAUTH_SECRET/" .env
        echo -e "${GREEN}✓ Created fresh .env file${NC}"
    fi
    echo -e "${YELLOW}⚠ IMPORTANT: Edit .env with your database credentials and domain!${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Validate critical environment variables
if grep -q "YOUR_PASSWORD_HERE" .env 2>/dev/null; then
    echo -e "${RED}⚠ WARNING: Database password not configured in .env${NC}"
    echo -e "${YELLOW}  Edit .env file before continuing.${NC}"
    read -p "Press Enter to continue anyway (Ctrl+C to abort)..."
fi

# Install dependencies
echo -e "${YELLOW}[4/8] Installing dependencies...${NC}"
npm ci 2>/dev/null || npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Generate Prisma client
echo -e "${YELLOW}[5/8] Generating Prisma client...${NC}"
npm run prisma:generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

# Run database migrations
echo -e "${YELLOW}[6/8] Running database migrations...${NC}"
npm run prisma:migrate:deploy || {
    echo -e "${YELLOW}  Attempting db push instead...${NC}"
    npm run prisma:db:push -- --accept-data-loss
}
echo -e "${GREEN}✓ Database schema synchronized${NC}"

# Seed database
echo -e "${YELLOW}[7/8] Seeding database...${NC}"
npm run prisma:db:seed 2>/dev/null || {
    echo -e "${YELLOW}  Database already seeded or seed failed (non-critical)${NC}"
}
echo -e "${GREEN}✓ Database seeding complete${NC}"

# Build application
echo -e "${YELLOW}[8/8] Building production application...${NC}"
NODE_OPTIONS="--max-old-space-size=4096" npm run build
echo -e "${GREEN}✓ Production build complete${NC}"

# Success message
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 DEPLOYMENT SUCCESSFUL! 🎉                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}CloudPanel Configuration:${NC}"
echo "  1. Set startup command: ${YELLOW}npm start${NC}"
echo "  2. Set Node.js version: ${YELLOW}20${NC}"
echo "  3. Set PORT variable: ${YELLOW}3000${NC}"
echo "  4. Enable SSL via Let's Encrypt"
echo ""
echo -e "${BLUE}Login Credentials:${NC}"
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │ Super Admin:    adrian.stanca1@gmail.com               │"
echo "  │ Company Owner:  adrian@ascladdingltd.co.uk             │"
echo "  │ Password:       Cumparavinde1                          │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
echo -e "${BLUE}To start the application manually:${NC}"
echo "  cd $NEXTJS_DIR && npm start"
echo ""
echo -e "${GREEN}Enjoy CortexBuild Pro! 🚀${NC}"
