#!/bin/bash
# ============================================================
# CortexBuild Pro - Windmill Integration Script
# ============================================================
# This script sets up Windmill workflow automation
# for CortexBuild Pro deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}CortexBuild Pro - Windmill Setup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Warning: Running without root privileges${NC}"
fi

# Configuration
PROJECT_DIR="/root/cortexbuild_pro"
DEPLOYMENT_DIR="$PROJECT_DIR/deployment"
WINDMILL_DIR="/root/windmill"

# Step 1: Check Docker
echo -e "${YELLOW}Step 1: Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"
echo ""

# Step 2: Check if Windmill is already installed
echo -e "${YELLOW}Step 2: Checking Windmill installation...${NC}"
if docker ps | grep -q windmill; then
    echo -e "${GREEN}✓ Windmill is already running${NC}"
    WINDMILL_INSTALLED=true
else
    echo -e "${YELLOW}Windmill is not installed${NC}"
    WINDMILL_INSTALLED=false
fi
echo ""

# Step 3: Install Windmill if needed
if [ "$WINDMILL_INSTALLED" = false ]; then
    read -p "Would you like to install Windmill now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Installing Windmill...${NC}"
        
        # Create windmill directory
        mkdir -p "$WINDMILL_DIR"
        cd "$WINDMILL_DIR"
        
        # Download docker-compose file
        curl -o docker-compose.yml https://raw.githubusercontent.com/windmill-labs/windmill/main/docker-compose.yml
        
        # Start Windmill
        docker compose up -d
        
        echo -e "${GREEN}✓ Windmill installed and running${NC}"
        echo -e "${BLUE}Access Windmill at: http://$(hostname -I | awk '{print $1}'):8000${NC}"
        echo ""
        
        # Wait for Windmill to be ready
        echo -e "${YELLOW}Waiting for Windmill to be ready...${NC}"
        sleep 30
        
        echo -e "${GREEN}✓ Windmill should be ready now${NC}"
        echo ""
    fi
fi

# Step 4: Display workflow setup instructions
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Windmill Workflow Setup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

echo -e "${YELLOW}Follow these steps to set up the deployment workflow:${NC}"
echo ""
echo "1. Access Windmill UI:"
echo "   http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "2. Create an account or log in"
echo ""
echo "3. Create a new Flow:"
echo "   - Click 'Flows' in the sidebar"
echo "   - Click 'New Flow'"
echo "   - Name: 'CortexBuild Pro Deployment'"
echo ""
echo "4. Add the workflow steps:"
echo "   The workflow file is located at:"
echo "   $DEPLOYMENT_DIR/windmill-deploy-flow.yaml"
echo ""
echo "5. Configure the workflow:"
echo "   - Set up schedule (optional): Daily at 2 AM"
echo "   - Enable webhook (optional): For CI/CD integration"
echo "   - Configure notifications"
echo ""
echo "6. Test the workflow:"
echo "   - Click 'Test' or 'Run' in the Windmill UI"
echo "   - Monitor execution and logs"
echo ""

# Step 5: Create a simple deployment script for Windmill to call
echo -e "${YELLOW}Step 5: Creating Windmill-callable deployment script...${NC}"

cat > "$DEPLOYMENT_DIR/windmill-deploy-app.sh" << 'EOF'
#!/bin/bash
# Simple deployment script for Windmill to call
set -e

PROJECT_DIR="/root/cortexbuild_pro"
cd "$PROJECT_DIR"

# Pull latest code
echo "Pulling latest code..."
git pull origin main || git pull origin master

# Build and deploy
cd deployment
echo "Building Docker image..."
docker build -t cortexbuild-app:latest -f Dockerfile ..

# Tag with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker tag cortexbuild-app:latest cortexbuild-app:$TIMESTAMP

echo "Deploying application..."
docker compose up -d --no-deps app

# Wait for health
echo "Waiting for application to be healthy..."
sleep 30

# Run migrations
echo "Running migrations..."
docker compose exec -T app npx prisma migrate deploy

echo "Deployment complete!"
EOF

chmod +x "$DEPLOYMENT_DIR/windmill-deploy-app.sh"
echo -e "${GREEN}✓ Deployment script created at: $DEPLOYMENT_DIR/windmill-deploy-app.sh${NC}"
echo ""

# Step 6: Webhook setup
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Webhook Integration (Optional)${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

echo "To integrate with CI/CD (GitHub Actions, GitLab CI, etc.):"
echo ""
echo "1. In Windmill, enable webhook for your flow"
echo "2. Copy the webhook URL"
echo "3. Add to your CI/CD pipeline:"
echo ""
echo "   GitHub Actions example:"
echo "   - name: Deploy to VPS"
echo "     run: |"
echo "       curl -X POST \${{ secrets.WINDMILL_WEBHOOK_URL }}"
echo ""
echo "4. Set webhook URL as secret in your repository"
echo ""

# Step 7: Manual test
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Testing Deployment Script${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

read -p "Would you like to test the deployment script now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Running deployment script...${NC}"
    cd "$DEPLOYMENT_DIR"
    ./windmill-deploy-app.sh
    
    echo ""
    echo -e "${GREEN}✓ Deployment script executed${NC}"
    echo ""
    echo "Check the application:"
    echo "  curl http://localhost:3000"
    echo "  docker ps"
    echo ""
fi

# Summary
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Windmill Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Access Windmill UI:"
echo "   http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "2. Import the workflow from:"
echo "   $DEPLOYMENT_DIR/windmill-deploy-flow.yaml"
echo ""
echo "3. Configure and test the workflow"
echo ""
echo "4. (Optional) Set up webhook for CI/CD"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View Windmill logs: docker compose -f $WINDMILL_DIR/docker-compose.yml logs -f"
echo "  Restart Windmill: docker compose -f $WINDMILL_DIR/docker-compose.yml restart"
echo "  Stop Windmill: docker compose -f $WINDMILL_DIR/docker-compose.yml down"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
