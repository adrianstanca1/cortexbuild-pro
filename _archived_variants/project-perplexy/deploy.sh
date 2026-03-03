#!/bin/bash

# ========================================
# ConstructAI - One-Command Deployment
# ========================================
# This script deploys the entire ConstructAI platform with a single command

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main deployment script
main() {
    print_header "ConstructAI Platform - One-Command Deployment"
    
    echo "This script will deploy the entire ConstructAI platform."
    echo ""
    
    # Ask for deployment type
    echo "Select deployment type:"
    echo "  1) Docker Compose (Recommended - Fast & Easy)"
    echo "  2) Manual Deployment (Advanced)"
    echo "  3) Development Environment"
    echo ""
    read -p "Enter choice (1-3): " choice
    echo ""
    
    case $choice in
        1)
            deploy_docker
            ;;
        2)
            deploy_manual
            ;;
        3)
            deploy_development
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
}

# Docker Compose Deployment
deploy_docker() {
    print_header "Docker Compose Deployment"
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
    
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    # Check .env file
    if [ ! -f .env ]; then
        print_warning ".env file not found"
        print_info "Creating .env from template..."
        
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file"
            print_warning "IMPORTANT: Edit .env and update security credentials!"
            print_warning "  - JWT_SECRET"
            print_warning "  - JWT_REFRESH_SECRET"
            print_warning "  - SESSION_SECRET"
            print_warning "  - MONGO_PASSWORD"
            print_warning "  - REDIS_PASSWORD"
            echo ""
            read -p "Press Enter after updating .env file, or Ctrl+C to exit..."
        else
            print_error ".env.example not found!"
            exit 1
        fi
    else
        print_success ".env file exists"
    fi
    
    # Choose docker-compose file
    echo ""
    echo "Select Docker Compose configuration:"
    echo "  1) Standard (docker-compose.yml) - Development/Testing"
    echo "  2) Production (docker-compose.prod.yml) - Production with Nginx"
    echo ""
    read -p "Enter choice (1-2) [default: 1]: " compose_choice
    compose_choice=${compose_choice:-1}
    
    if [ "$compose_choice" = "2" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
        print_info "Using production configuration"
    else
        COMPOSE_FILE="docker-compose.yml"
        print_info "Using standard configuration"
    fi
    
    # Build and start services
    print_info "Building Docker images..."
    docker compose -f $COMPOSE_FILE build
    print_success "Images built successfully"
    
    print_info "Starting services..."
    docker compose -f $COMPOSE_FILE up -d
    print_success "Services started"
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Run database migrations
    print_info "Running database migrations..."
    docker compose -f $COMPOSE_FILE exec -T backend sh -c "cd /app && npx prisma migrate deploy" || print_warning "Migrations may have failed or already applied"
    
    # Check service health
    print_info "Checking service health..."
    docker compose -f $COMPOSE_FILE ps
    
    # Display access information
    print_header "Deployment Complete!"
    
    print_success "All services are running!"
    echo ""
    echo "Access Points:"
    echo -e "  ${GREEN}Frontend:${NC}  http://localhost:3000"
    echo -e "  ${GREEN}Backend:${NC}   http://localhost:3001"
    echo -e "  ${GREEN}Health:${NC}    http://localhost:3001/health"
    echo ""
    echo "Useful Commands:"
    echo "  View logs:        docker compose -f $COMPOSE_FILE logs -f"
    echo "  Stop services:    docker compose -f $COMPOSE_FILE down"
    echo "  Restart services: docker compose -f $COMPOSE_FILE restart"
    echo "  View status:      docker compose -f $COMPOSE_FILE ps"
    echo ""
    
    # Test health endpoint
    print_info "Testing backend health endpoint..."
    sleep 5
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "Backend is healthy!"
    else
        print_warning "Backend health check failed. Check logs: docker compose -f $COMPOSE_FILE logs backend"
    fi
}

# Manual Deployment
deploy_manual() {
    print_header "Manual Deployment"
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 20+."
        exit 1
    fi
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version must be 20 or higher. Current: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) is installed"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js 20+ which includes npm."
        exit 1
    fi
    print_success "npm $(npm -v) is installed"
    
    # Check MongoDB
    print_info "Checking MongoDB..."
    if ! command_exists mongosh && ! command_exists mongo; then
        print_warning "MongoDB client not found locally"
        print_warning "Make sure MongoDB is running (locally or remotely)"
        print_warning "Update DATABASE_URL in .env with your MongoDB connection string"
    else
        print_success "MongoDB client is available"
    fi
    
    # Check Redis
    print_info "Checking Redis..."
    if ! command_exists redis-cli; then
        print_warning "Redis client not found locally"
        print_warning "Make sure Redis is running (locally or remotely)"
        print_warning "Update REDIS_URL in .env with your Redis connection string"
    else
        print_success "Redis client is available"
    fi
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm install --legacy-peer-deps
    print_success "Dependencies installed"
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    cd packages/backend
    npm run prisma:generate
    cd ../..
    print_success "Prisma client generated"
    
    # Build application
    print_info "Building application..."
    NODE_ENV=production npm run build
    print_success "Build complete"
    
    # Run migrations
    print_info "Running database migrations..."
    cd packages/backend
    npx prisma migrate deploy || print_warning "Migrations may have failed"
    cd ../..
    
    # Create storage directory
    print_info "Creating storage directory..."
    mkdir -p storage
    chmod 755 storage
    print_success "Storage directory created"
    
    # Display instructions for starting
    print_header "Build Complete!"
    
    print_success "Application is ready to run!"
    echo ""
    echo "To start the application:"
    echo ""
    echo "Option 1: Start both services together"
    echo -e "  ${GREEN}npm start${NC}"
    echo ""
    echo "Option 2: Start services separately"
    echo -e "  ${GREEN}npm run start:backend${NC}  # Terminal 1"
    echo -e "  ${GREEN}npm run start:frontend${NC} # Terminal 2"
    echo ""
    echo "Option 3: Use PM2 (recommended for production)"
    echo -e "  ${GREEN}npm install -g pm2${NC}"
    echo -e "  ${GREEN}cd packages/backend && pm2 start dist/index.js --name constructai-backend${NC}"
    echo -e "  ${GREEN}cd packages/frontend && pm2 start 'npx serve -s dist -l 3000' --name constructai-frontend${NC}"
    echo ""
    
    # Ask if user wants to start now
    read -p "Start services now? (y/n) [default: n]: " start_now
    if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
        print_info "Starting services..."
        npm start
    fi
}

# Development Environment
deploy_development() {
    print_header "Development Environment Setup"
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 20+."
        exit 1
    fi
    print_success "Node.js $(node -v) is installed"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js 20+ which includes npm."
        exit 1
    fi
    print_success "npm is installed"
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm install --legacy-peer-deps
    print_success "Dependencies installed"
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    cd packages/backend
    npm run prisma:generate
    cd ../..
    print_success "Prisma client generated"
    
    # Check .env file
    if [ ! -f .env ]; then
        print_info "Creating .env from template..."
        cp .env.example .env
        print_success "Created .env file"
    fi
    
    # Start infrastructure with Docker
    print_info "Starting MongoDB and Redis with Docker..."
    if command_exists docker; then
        docker compose up -d mongodb redis
        print_success "MongoDB and Redis started"
        sleep 5
    else
        print_warning "Docker not found. Please start MongoDB and Redis manually."
    fi
    
    # Run migrations
    print_info "Running database migrations..."
    cd packages/backend
    npx prisma migrate dev --name init || print_warning "Migrations may have already been applied"
    cd ../..
    
    # Display instructions
    print_header "Development Environment Ready!"
    
    print_success "Setup complete!"
    echo ""
    echo "To start development servers:"
    echo -e "  ${GREEN}npm run dev${NC}              # Start all services"
    echo -e "  ${GREEN}npm run dev:frontend${NC}     # Frontend only"
    echo -e "  ${GREEN}npm run dev:backend${NC}      # Backend only"
    echo ""
    echo "Access Points:"
    echo -e "  Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo -e "  Backend:   ${BLUE}http://localhost:3001${NC}"
    echo ""
    echo "Other Commands:"
    echo -e "  ${GREEN}npm run lint${NC}             # Lint code"
    echo -e "  ${GREEN}npm run type-check${NC}       # Type checking"
    echo -e "  ${GREEN}npm run test:unit${NC}        # Run tests"
    echo ""
    
    # Ask if user wants to start now
    read -p "Start development servers now? (y/n) [default: n]: " start_now
    if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
        print_info "Starting development servers..."
        npm run dev
    fi
}

# Run main function
main
