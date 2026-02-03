#!/bin/bash
# ============================================================
# CortexBuild Pro - One-Command Deployment
# ============================================================
# This script provides a guided deployment experience
# Run: curl -fsSL https://your-repo/quick-deploy.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗  ║
║        ██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝  ║
║        ██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝   ║
║        ██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗   ║
║        ╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗  ║
║         ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝  ║
║                                                              ║
║                    Quick Deployment Script                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BLUE}Welcome to CortexBuild Pro Deployment!${NC}"
echo ""
echo -e "This script will help you deploy CortexBuild Pro using:"
echo ""
echo -e "${GREEN}1. Docker Manager (Portainer)${NC} - Visual management"
echo -e "${GREEN}2. Windmill Automation${NC}      - Automated workflows"
echo -e "${GREEN}3. Docker Compose${NC}           - Traditional CLI"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Note: Some operations may require root/sudo privileges${NC}"
  echo ""
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VERSION=$VERSION_ID
else
    OS=$(uname -s)
fi

echo -e "${CYAN}Detected System:${NC} $OS $VERSION"
echo ""

# Check Docker
echo -e "${YELLOW}Checking Docker installation...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}✗ Docker not found${NC}"
    read -p "Would you like to install Docker now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Installing Docker...${NC}"
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
        echo -e "${GREEN}✓ Docker installed successfully${NC}"
    else
        echo -e "${RED}Docker is required. Please install Docker and try again.${NC}"
        exit 1
    fi
fi

# Check Docker Compose
if docker compose version &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose available${NC}"
else
    echo -e "${YELLOW}Installing Docker Compose plugin...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}     Choose Deployment Method${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}1)${NC} Docker Manager (Portainer)"
echo -e "   ${CYAN}→${NC} Best for teams and visual management"
echo -e "   ${CYAN}→${NC} Web UI on port 9000"
echo ""
echo -e "${GREEN}2)${NC} Windmill Automation"
echo -e "   ${CYAN}→${NC} Best for automated deployments"
echo -e "   ${CYAN}→${NC} Workflow automation with scheduling"
echo ""
echo -e "${GREEN}3)${NC} Docker Compose (Traditional)"
echo -e "   ${CYAN}→${NC} Simple and quick"
echo -e "   ${CYAN}→${NC} Command-line based"
echo ""
echo -e "${GREEN}4)${NC} Install Both (Recommended)"
echo -e "   ${CYAN}→${NC} Portainer for management + Windmill for automation"
echo ""
echo -e "${GREEN}5)${NC} View Documentation & Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Setting up Docker Manager (Portainer)...${NC}"
        echo ""
        
        # Check if Portainer already exists
        if docker ps -a | grep -q portainer; then
            echo -e "${GREEN}✓ Portainer is already installed${NC}"
        else
            echo -e "${YELLOW}Installing Portainer...${NC}"
            docker volume create portainer_data
            docker run -d \
              -p 9000:9000 \
              -p 9443:9443 \
              --name portainer \
              --restart=always \
              -v /var/run/docker.sock:/var/run/docker.sock \
              -v portainer_data:/data \
              portainer/portainer-ce:latest
            
            echo -e "${GREEN}✓ Portainer installed successfully${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}   Portainer Setup Complete!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo ""
        echo -e "${BLUE}Access Portainer:${NC}"
        echo -e "  http://$(hostname -I | awk '{print $1}'):9000"
        echo ""
        echo -e "${YELLOW}Next Steps:${NC}"
        echo "  1. Open Portainer in your browser"
        echo "  2. Create admin account"
        echo "  3. Go to Stacks → Add Stack"
        echo "  4. Use docker-stack.yml or docker-compose.yml"
        echo "  5. Set environment variables"
        echo "  6. Deploy!"
        echo ""
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}Setting up Windmill...${NC}"
        echo ""
        
        WINDMILL_DIR="/root/windmill"
        
        if docker ps | grep -q windmill; then
            echo -e "${GREEN}✓ Windmill is already running${NC}"
        else
            echo -e "${YELLOW}Installing Windmill...${NC}"
            mkdir -p "$WINDMILL_DIR"
            cd "$WINDMILL_DIR"
            curl -o docker-compose.yml https://raw.githubusercontent.com/windmill-labs/windmill/main/docker-compose.yml
            docker compose up -d
            
            echo -e "${GREEN}✓ Windmill installed successfully${NC}"
            echo -e "${YELLOW}Waiting for Windmill to be ready...${NC}"
            sleep 30
        fi
        
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}   Windmill Setup Complete!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo ""
        echo -e "${BLUE}Access Windmill:${NC}"
        echo -e "  http://$(hostname -I | awk '{print $1}'):8000"
        echo ""
        echo -e "${YELLOW}Next Steps:${NC}"
        echo "  1. Open Windmill in your browser"
        echo "  2. Create admin account"
        echo "  3. Create new Flow"
        echo "  4. Import workflow from windmill-deploy-flow.yaml"
        echo "  5. Configure and run!"
        echo ""
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}Deploying with Docker Compose...${NC}"
        echo ""
        
        PROJECT_DIR="/root/cortexbuild_pro"
        
        if [ ! -d "$PROJECT_DIR" ]; then
            echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
            echo "Please upload the project files first"
            exit 1
        fi
        
        cd "$PROJECT_DIR/deployment"
        
        # Check for .env file
        if [ ! -f ".env" ]; then
            if [ -f ".env.production" ]; then
                cp .env.production .env
                echo -e "${GREEN}✓ Copied .env.production to .env${NC}"
            elif [ -f ".env.docker-manager" ]; then
                cp .env.docker-manager .env
                echo -e "${GREEN}✓ Copied .env.docker-manager to .env${NC}"
            else
                echo -e "${YELLOW}Warning: No .env file found${NC}"
                echo "Please create .env file with required configuration"
            fi
        fi
        
        # Build and deploy
        echo -e "${YELLOW}Building Docker image...${NC}"
        docker compose build
        
        echo -e "${YELLOW}Starting services...${NC}"
        docker compose up -d
        
        echo -e "${YELLOW}Waiting for services to be ready...${NC}"
        sleep 20
        
        echo -e "${YELLOW}Running database migrations...${NC}"
        docker compose exec -T app npx prisma migrate deploy || echo "Migrations may need manual run"
        
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}   Deployment Complete!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo ""
        echo -e "${BLUE}Access Application:${NC}"
        echo -e "  http://$(hostname -I | awk '{print $1}'):3000"
        echo ""
        docker compose ps
        echo ""
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}Installing Both Portainer and Windmill...${NC}"
        echo ""
        
        # Install Portainer
        if ! docker ps -a | grep -q portainer; then
            echo -e "${YELLOW}Installing Portainer...${NC}"
            docker volume create portainer_data
            docker run -d \
              -p 9000:9000 \
              -p 9443:9443 \
              --name portainer \
              --restart=always \
              -v /var/run/docker.sock:/var/run/docker.sock \
              -v portainer_data:/data \
              portainer/portainer-ce:latest
            echo -e "${GREEN}✓ Portainer installed${NC}"
        else
            echo -e "${GREEN}✓ Portainer already installed${NC}"
        fi
        
        # Install Windmill
        if ! docker ps | grep -q windmill; then
            echo -e "${YELLOW}Installing Windmill...${NC}"
            WINDMILL_DIR="/root/windmill"
            mkdir -p "$WINDMILL_DIR"
            cd "$WINDMILL_DIR"
            curl -o docker-compose.yml https://raw.githubusercontent.com/windmill-labs/windmill/main/docker-compose.yml
            docker compose up -d
            echo -e "${GREEN}✓ Windmill installed${NC}"
            sleep 30
        else
            echo -e "${GREEN}✓ Windmill already installed${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}   Complete Setup Installed!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo ""
        echo -e "${BLUE}Access Points:${NC}"
        echo -e "  Portainer: http://$(hostname -I | awk '{print $1}'):9000"
        echo -e "  Windmill:  http://$(hostname -I | awk '{print $1}'):8000"
        echo ""
        echo -e "${YELLOW}Recommended Workflow:${NC}"
        echo "  1. Deploy app via Portainer (visual management)"
        echo "  2. Set up automated updates via Windmill"
        echo "  3. Use Portainer for daily monitoring"
        echo ""
        ;;
        
    5)
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${BLUE}   Documentation Links${NC}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}"
        echo ""
        echo "Quick Start Guide:"
        echo "  deployment/QUICKSTART-DOCKER-MANAGER.md"
        echo ""
        echo "Full Documentation:"
        echo "  deployment/README-DOCKER-MANAGER.md"
        echo ""
        echo "Comparison Guide:"
        echo "  deployment/DEPLOYMENT-COMPARISON.md"
        echo ""
        echo "Traditional Deployment:"
        echo "  deployment/README.md"
        echo ""
        exit 0
        ;;
        
    *)
        echo ""
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}   Useful Commands${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "  docker logs -f cortexbuild-app"
echo "  docker compose logs -f"
echo ""
echo -e "${YELLOW}Check status:${NC}"
echo "  docker ps"
echo "  docker compose ps"
echo ""
echo -e "${YELLOW}Restart:${NC}"
echo "  docker restart cortexbuild-app"
echo "  docker compose restart"
echo ""
echo -e "${YELLOW}Update application:${NC}"
echo "  cd /root/cortexbuild_pro"
echo "  git pull"
echo "  cd deployment"
echo "  docker compose up -d --build"
echo ""
echo -e "${GREEN}Setup complete! 🚀${NC}"
echo ""
