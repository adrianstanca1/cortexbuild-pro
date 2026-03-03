#!/bin/bash

# ==========================================
# CortexBuild Render Deployment Script
# ==========================================

set -e  # Exit on error

echo "🚀 Starting CortexBuild Render deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo -e "${YELLOW}Render CLI not found. Installing...${NC}"
    curl -fsSL https://render.com/api/provision/install_render_cli.sh | bash
fi

# Check if user is logged in
if ! render whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Render. Please login...${NC}"
    render login
fi

# Deploy to Render
echo -e "${GREEN}Deploying to Render...${NC}"
render deploy

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}Your backend is now live on Render!${NC}"

