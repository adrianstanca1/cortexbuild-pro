#!/bin/bash

# ==========================================
# CortexBuild Vercel Deployment Script
# ==========================================

set -e  # Exit on error

echo "🚀 Starting CortexBuild Vercel deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Vercel. Please login...${NC}"
    vercel login
fi

# Build the project
echo -e "${GREEN}Building project...${NC}"
npm run build

# Deploy to Vercel
echo -e "${GREEN}Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}Your app is now live on Vercel!${NC}"

