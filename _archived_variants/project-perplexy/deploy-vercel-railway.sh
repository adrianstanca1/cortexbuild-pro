#!/bin/bash

# ========================================
# Vercel + Railway Deployment Script
# ========================================
# Quick cloud deployment for ConstructAI Platform
# Frontend: Vercel (Global CDN)
# Backend + DB: Railway (Managed services)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="constructai"

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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js $(node -v) is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm -v) is installed"
}

# Install CLIs
install_clis() {
    print_header "Installing CLI Tools"
    
    # Install Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_info "Installing Vercel CLI..."
        npm install -g vercel
        print_success "Vercel CLI installed"
    else
        print_success "Vercel CLI already installed"
    fi
    
    # Install Railway CLI
    if ! command -v railway &> /dev/null; then
        print_info "Installing Railway CLI..."
        npm install -g @railway/cli
        print_success "Railway CLI installed"
    else
        print_success "Railway CLI already installed"
    fi
}

# Deploy backend to Railway
deploy_backend_railway() {
    print_header "Deploying Backend to Railway"
    
    print_info "Opening Railway for authentication..."
    print_warning "You'll need to:"
    echo "  1. Sign up/login at https://railway.app"
    echo "  2. Create a new project"
    echo "  3. Add MongoDB and Redis services"
    echo ""
    
    read -p "Have you created a Railway project? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Please create a Railway project first:"
        echo "  1. Go to https://railway.app"
        echo "  2. Click 'Start a New Project'"
        echo "  3. Add MongoDB from marketplace"
        echo "  4. Add Redis from marketplace"
        echo "  5. Run this script again"
        exit 0
    fi
    
    print_info "To deploy backend to Railway:"
    echo ""
    echo "Via Railway Dashboard:"
    echo "  1. Go to your Railway project"
    echo "  2. Click 'New Service' → 'GitHub Repo'"
    echo "  3. Connect this repository"
    echo "  4. Set Root Directory: packages/backend"
    echo "  5. Set Build Command: npm install --legacy-peer-deps && npm run build"
    echo "  6. Set Start Command: node dist/index.js"
    echo "  7. Add environment variables:"
    echo "     - NODE_ENV=production"
    echo "     - PORT=3001"
    echo "     - DATABASE_URL=\${{MongoDB.DATABASE_URL}}"
    echo "     - REDIS_URL=\${{Redis.REDIS_URL}}"
    echo "     - JWT_SECRET=$(openssl rand -hex 32)"
    echo "     - JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
    echo "     - SESSION_SECRET=$(openssl rand -hex 32)"
    echo "     - FRONTEND_URL=https://your-app.vercel.app"
    echo "  8. Click 'Deploy'"
    echo ""
    
    read -p "Press Enter when backend is deployed..."
    read -p "Enter your Railway backend URL: " RAILWAY_BACKEND_URL
    
    if [ -z "$RAILWAY_BACKEND_URL" ]; then
        print_error "Backend URL is required"
        exit 1
    fi
    
    print_success "Backend URL: $RAILWAY_BACKEND_URL"
}

# Deploy frontend to Vercel
deploy_frontend_vercel() {
    print_header "Deploying Frontend to Vercel"
    
    # Create vercel.json if not exists
    if [ ! -f "vercel.json" ]; then
        print_info "Creating vercel.json configuration..."
        cat > vercel.json << 'EOF'
{
  "version": 2,
  "buildCommand": "cd packages/frontend && npm install --legacy-peer-deps && npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": "packages/frontend/dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ],
  "env": {
    "NODE_VERSION": "20"
  }
}
EOF
        print_success "vercel.json created"
    fi
    
    # Login to Vercel
    print_info "Logging in to Vercel..."
    vercel login
    
    # Set environment variable
    print_info "Setting environment variables..."
    vercel env add VITE_API_URL production <<< "$RAILWAY_BACKEND_URL"
    
    # Deploy to production
    print_info "Deploying to Vercel..."
    VERCEL_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ -z "$VERCEL_URL" ]; then
        print_warning "Could not extract Vercel URL automatically"
        read -p "Enter your Vercel URL: " VERCEL_URL
    fi
    
    print_success "Frontend deployed: $VERCEL_URL"
}

# Update Railway backend with frontend URL
update_backend_url() {
    print_header "Updating Backend Configuration"
    
    print_info "Update FRONTEND_URL in Railway:"
    echo "  1. Go to Railway project → Backend service"
    echo "  2. Click 'Variables'"
    echo "  3. Update FRONTEND_URL to: $VERCEL_URL"
    echo "  4. Click 'Deploy' to redeploy"
    echo ""
    
    read -p "Press Enter when updated..."
    print_success "Backend configuration updated"
}

# Test deployment
test_deployment() {
    print_header "Testing Deployment"
    
    print_info "Testing backend health..."
    if curl -f -s "$RAILWAY_BACKEND_URL/health" > /dev/null; then
        print_success "Backend is healthy!"
    else
        print_warning "Backend health check failed"
    fi
    
    print_info "Testing frontend..."
    if curl -f -s -o /dev/null "$VERCEL_URL"; then
        print_success "Frontend is accessible!"
    else
        print_warning "Frontend check failed"
    fi
}

# Save configuration
save_config() {
    print_header "Saving Configuration"
    
    cat > cloud-deployment-config.sh << EOF
#!/bin/bash
# Cloud Deployment Configuration
# Generated on $(date)

export BACKEND_URL="$RAILWAY_BACKEND_URL"
export FRONTEND_URL="$VERCEL_URL"
export DEPLOYMENT_TYPE="vercel-railway"
EOF
    
    chmod +x cloud-deployment-config.sh
    print_success "Configuration saved to cloud-deployment-config.sh"
}

# Main deployment
main() {
    print_header "Vercel + Railway Deployment"
    
    print_info "This script will deploy:"
    echo "  - Frontend → Vercel (Global CDN)"
    echo "  - Backend → Railway (with MongoDB + Redis)"
    echo ""
    
    check_prerequisites
    install_clis
    deploy_backend_railway
    deploy_frontend_vercel
    update_backend_url
    test_deployment
    save_config
    
    print_header "Deployment Complete! 🎉"
    
    echo ""
    echo -e "${GREEN}✓ Your application is live!${NC}"
    echo ""
    echo "Frontend URL: $VERCEL_URL"
    echo "Backend URL:  $RAILWAY_BACKEND_URL"
    echo ""
    echo "Next steps:"
    echo "  1. Test your application at: $VERCEL_URL"
    echo "  2. Configure custom domain (optional)"
    echo "  3. Setup monitoring and alerts"
    echo "  4. Enable auto-deploy on git push"
    echo ""
    echo "Estimated cost: $5-15/month"
    echo ""
}

# Run main
main
