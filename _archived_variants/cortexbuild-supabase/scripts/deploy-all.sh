#!/bin/bash

# ==========================================
# CortexBuild Multi-Platform Deployment Script
# ==========================================

set -e  # Exit on error

echo "🚀 Starting CortexBuild multi-platform deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check for environment variables
check_env() {
    if [ ! -f .env.local ]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        echo "Creating from .env.example..."
        cp .env.example .env.local
        echo -e "${YELLOW}Please edit .env.local with your configuration before deploying${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Environment file found${NC}"
}

# Build project
build_project() {
    print_header "Building Project"
    npm run build
    echo -e "${GREEN}✓ Build complete${NC}"
}

# Deploy to Vercel
deploy_vercel() {
    print_header "Deploying to Vercel (Frontend)"
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    if ! vercel whoami &> /dev/null; then
        echo -e "${YELLOW}Logging in to Vercel...${NC}"
        vercel login
    fi
    
    vercel --prod --yes
    echo -e "${GREEN}✓ Vercel deployment complete${NC}"
}

# Deploy to Render
deploy_render() {
    print_header "Deploying to Render (Backend)"
    
    if ! command -v render &> /dev/null; then
        echo -e "${YELLOW}Installing Render CLI...${NC}"
        curl -fsSL https://render.com/api/provision/install_render_cli.sh | bash
    fi
    
    if ! render whoami &> /dev/null; then
        echo -e "${YELLOW}Logging in to Render...${NC}"
        render login
    fi
    
    render deploy
    echo -e "${GREEN}✓ Render deployment complete${NC}"
}

# Deploy to IONOS (optional)
deploy_ionos() {
    print_header "Deploying to IONOS (Optional)"
    
    read -p "Do you want to deploy to IONOS? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node deploy-ionos.cjs
        echo -e "${GREEN}✓ IONOS deployment complete${NC}"
    else
        echo -e "${YELLOW}Skipping IONOS deployment${NC}"
    fi
}

# Main deployment flow
main() {
    check_env
    build_project
    
    echo ""
    read -p "Deploy to Vercel? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_vercel
    fi
    
    echo ""
    read -p "Deploy to Render? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_render
    fi
    
    deploy_ionos
    
    print_header "Deployment Summary"
    echo -e "${GREEN}✓ All deployments complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify your deployments are working"
    echo "2. Update CORS settings if needed"
    echo "3. Test all functionality"
    echo "4. Monitor logs for any issues"
}

# Run main function
main

