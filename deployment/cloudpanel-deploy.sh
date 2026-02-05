#!/bin/bash

# ============================================
# CortexBuild Pro - CloudPanel Deployment Script
# ============================================
# This script deploys CortexBuild Pro on a CloudPanel-managed VPS
# with proper environment isolation for production and staging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if running as site user
check_user() {
    print_header "Checking User Permissions"
    
    CURRENT_USER=$(whoami)
    print_info "Current user: $CURRENT_USER"
    
    if [ "$CURRENT_USER" = "root" ]; then
        print_error "Do not run this script as root!"
        print_info "Switch to your CloudPanel site user first:"
        print_info "  su - cortexbuild-prod"
        exit 1
    fi
    
    print_success "Running as non-root user: $CURRENT_USER"
}

# Determine environment (production or staging)
determine_environment() {
    print_header "Determining Environment"
    
    if [[ "$CURRENT_USER" == *"staging"* ]] || [[ "$PWD" == *"staging"* ]]; then
        ENVIRONMENT="staging"
        APP_NAME="cortexbuild-staging"
        DEFAULT_PORT=3001
    else
        ENVIRONMENT="production"
        APP_NAME="cortexbuild-prod"
        DEFAULT_PORT=3000
    fi
    
    print_success "Environment: $ENVIRONMENT"
    print_success "App Name: $APP_NAME"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    NPM_VERSION=$(npm --version)
    print_success "npm: $NPM_VERSION"
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 is not installed. Installing..."
        npm install -g pm2
    fi
    PM2_VERSION=$(pm2 --version)
    print_success "PM2: $PM2_VERSION"
    
    # Check PostgreSQL client
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found in PATH (this is OK if DB is configured)"
    else
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL client: $PSQL_VERSION"
    fi
}

# Navigate to application directory
navigate_to_app() {
    print_header "Navigating to Application"
    
    # Try to find nextjs_space directory
    if [ -d "$PWD/nextjs_space" ]; then
        cd "$PWD/nextjs_space"
    elif [ -d "$PWD/cortexbuild-pro/nextjs_space" ]; then
        cd "$PWD/cortexbuild-pro/nextjs_space"
    elif [ -d "$HOME/htdocs/cortexbuild-pro/nextjs_space" ]; then
        cd "$HOME/htdocs/cortexbuild-pro/nextjs_space"
    else
        print_error "Cannot find nextjs_space directory"
        print_info "Please run this script from the repository root or site home directory"
        exit 1
    fi
    
    APP_DIR="$PWD"
    print_success "Application directory: $APP_DIR"
}

# Check environment file
check_env_file() {
    print_header "Checking Environment Configuration"
    
    if [ ! -f ".env" ]; then
        print_warning "No .env file found"
        
        if [ -f ".env.example" ]; then
            print_info "Creating .env from .env.example"
            cp .env.example .env
            print_warning "Please edit .env file with your configuration:"
            print_info "  nano .env"
            print_info "Then run this script again"
            exit 0
        else
            print_error "No .env.example file found"
            exit 1
        fi
    fi
    
    # Check critical environment variables
    source .env 2>/dev/null || true
    
    MISSING_VARS=()
    
    [ -z "$DATABASE_URL" ] && MISSING_VARS+=("DATABASE_URL")
    [ -z "$NEXTAUTH_SECRET" ] && MISSING_VARS+=("NEXTAUTH_SECRET")
    [ -z "$NEXTAUTH_URL" ] && MISSING_VARS+=("NEXTAUTH_URL")
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        print_info "Please configure these in .env file"
        exit 1
    fi
    
    print_success "Environment file configured"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    print_info "Running npm install (this may take a few minutes)..."
    npm install --legacy-peer-deps --production
    
    print_success "Dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    print_header "Generating Prisma Client"
    
    if [ ! -f "prisma/schema.prisma" ]; then
        print_error "Prisma schema not found"
        exit 1
    fi
    
    npx prisma generate
    
    print_success "Prisma client generated"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    print_info "Checking database connection..."
    
    # Test database connection
    if ! npx prisma db pull --force 2>/dev/null; then
        print_warning "Cannot connect to database or database is empty"
        print_info "Initializing database schema..."
        npx prisma db push --skip-generate
    else
        print_info "Database connected, running migrations..."
        npx prisma migrate deploy || {
            print_warning "Migration failed, trying db push..."
            npx prisma db push --skip-generate
        }
    fi
    
    print_success "Database migrations complete"
}

# Seed database (optional)
seed_database() {
    print_header "Database Seeding"
    
    read -p "Do you want to seed the database with demo data? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Seeding database..."
        
        # Set admin password if not set
        if [ -z "$ADMIN_PASSWORD" ]; then
            export ADMIN_PASSWORD="ChangeMe123!"
            print_warning "Using default admin password: ChangeMe123!"
            print_warning "Please change this after first login!"
        fi
        
        npm run prisma:seed || npx tsx scripts/seed.ts
        
        print_success "Database seeded"
        print_info "Default login credentials:"
        print_info "  Email: adrian.stanca1@gmail.com"
        print_info "  Password: $ADMIN_PASSWORD"
    else
        print_info "Skipping database seeding"
    fi
}

# Build application
build_application() {
    print_header "Building Application"
    
    print_info "Building Next.js application (this may take 5-10 minutes)..."
    
    # Set NODE_ENV
    export NODE_ENV=production
    
    # Build
    npm run build
    
    if [ ! -d ".next" ]; then
        print_error "Build failed - .next directory not created"
        exit 1
    fi
    
    print_success "Application built successfully"
}

# Create PM2 ecosystem file
create_pm2_config() {
    print_header "Creating PM2 Configuration"
    
    # Determine port
    PORT=${PORT:-$DEFAULT_PORT}
    
    # Create logs directory
    mkdir -p logs
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
}
EOF
    
    print_success "PM2 configuration created: ecosystem.config.js"
}

# Start/Restart application with PM2
start_application() {
    print_header "Starting Application"
    
    # Check if app is already running
    if pm2 list | grep -q "$APP_NAME"; then
        print_info "Application is already running, reloading..."
        pm2 reload ecosystem.config.js
    else
        print_info "Starting application for the first time..."
        pm2 start ecosystem.config.js
    fi
    
    # Save PM2 process list
    pm2 save
    
    print_success "Application started"
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    print_info "Waiting for application to start..."
    sleep 5
    
    # Check PM2 status
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        print_error "Application is not running!"
        print_info "Check logs with: pm2 logs $APP_NAME"
        exit 1
    fi
    
    print_success "PM2 process is online"
    
    # Check HTTP endpoint
    PORT=${PORT:-$DEFAULT_PORT}
    print_info "Testing API endpoint on port $PORT..."
    
    if curl -f -s http://localhost:$PORT/api/auth/providers > /dev/null; then
        print_success "API endpoint responding"
    else
        print_warning "API endpoint not responding yet (may need more time to start)"
        print_info "Check logs with: pm2 logs $APP_NAME"
    fi
}

# Display post-deployment information
display_info() {
    print_header "Deployment Complete"
    
    PORT=${PORT:-$DEFAULT_PORT}
    
    echo ""
    echo -e "${GREEN}🎉 CortexBuild Pro deployed successfully!${NC}"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Application: $APP_NAME"
    echo "Directory: $APP_DIR"
    echo "Port: $PORT"
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "🌐 Production URL: https://www.cortexbuildpro.com"
        echo "   (Configure your domain in CloudPanel)"
    else
        echo "🌐 Staging URL: https://staging.cortexbuildpro.com"
        echo "   (Configure your domain in CloudPanel)"
    fi
    
    echo ""
    echo "📋 Useful Commands:"
    echo ""
    echo "  View logs:        pm2 logs $APP_NAME"
    echo "  Monitor:          pm2 monit"
    echo "  Restart:          pm2 restart $APP_NAME"
    echo "  Stop:             pm2 stop $APP_NAME"
    echo "  App info:         pm2 info $APP_NAME"
    echo ""
    echo "🔄 To deploy updates:"
    echo "  1. git pull origin main"
    echo "  2. npm install --legacy-peer-deps --production"
    echo "  3. npx prisma generate"
    echo "  4. npx prisma migrate deploy"
    echo "  5. npm run build"
    echo "  6. pm2 reload $APP_NAME"
    echo ""
    
    print_warning "Next Steps:"
    echo "  1. Configure your domain in CloudPanel"
    echo "  2. Set up SSL certificate (Let's Encrypt)"
    echo "  3. Configure Nginx reverse proxy to port $PORT"
    echo "  4. Set up automated backups (cron job)"
    echo "  5. Configure monitoring and alerts"
    echo ""
    
    print_info "For detailed instructions, see:"
    print_info "  CLOUDPANEL_DEPLOYMENT_GUIDE.md"
}

# Main deployment flow
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║   CortexBuild Pro - CloudPanel Deployment    ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    
    check_user
    determine_environment
    check_prerequisites
    navigate_to_app
    check_env_file
    install_dependencies
    generate_prisma
    run_migrations
    seed_database
    build_application
    create_pm2_config
    start_application
    verify_deployment
    display_info
    
    echo ""
    echo -e "${GREEN}✨ All done!${NC}"
    echo ""
}

# Run main function
main "$@"
