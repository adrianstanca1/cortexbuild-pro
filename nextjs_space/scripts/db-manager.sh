#!/bin/bash

# ============================================
# CortexBuild Pro - Database Management Script
# ============================================
# Safe database operations: migrate, seed, reset

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"

# Load environment
load_env() {
    if [ -f ".env" ]; then
        source .env
    else
        print_error "No .env file found"
        exit 1
    fi
}

# Detect environment
detect_environment() {
    NODE_ENV=${NODE_ENV:-development}
    
    if [ "$NODE_ENV" = "production" ]; then
        IS_PRODUCTION=true
        print_warning "Production environment detected"
    else
        IS_PRODUCTION=false
        print_info "Non-production environment: $NODE_ENV"
    fi
}

# Check prerequisites
check_prerequisites() {
    if ! command -v npx &> /dev/null; then
        print_error "npx not found. Please install Node.js and npm"
        exit 1
    fi
    
    if [ ! -f "prisma/schema.prisma" ]; then
        print_error "Prisma schema not found. Are you in the correct directory?"
        exit 1
    fi
}

# Run migrations
migrate() {
    print_info "Running database migrations..."
    
    # Generate Prisma client first
    npx prisma generate
    
    # Run migrations
    if [ "$IS_PRODUCTION" = true ]; then
        # Production: Use migrate deploy (no prompts)
        npx prisma migrate deploy
    else
        # Development: Use db push for faster iteration
        npx prisma db push
    fi
    
    print_success "Migrations completed"
}

# Seed database
seed() {
    print_info "Seeding database..."
    
    if [ "$IS_PRODUCTION" = true ]; then
        print_warning "Production seed requires explicit confirmation"
        read -p "Type 'yes' to seed production database: " CONFIRM
        
        if [ "$CONFIRM" != "yes" ]; then
            print_info "Seed cancelled"
            return 0
        fi
        
        # Production seed
        CONFIRM_PROD_SEED=yes npx tsx scripts/seed-production.ts
    else
        # Development/staging seed
        npx tsx scripts/seed.ts
    fi
    
    print_success "Database seeded"
}

# Reset database (NON-PRODUCTION ONLY)
reset() {
    if [ "$IS_PRODUCTION" = true ]; then
        print_error "Database reset is NOT allowed in production!"
        print_error "Use backup/restore scripts instead"
        exit 1
    fi
    
    print_warning "This will DELETE all data and reset the database"
    read -p "Type 'RESET' to confirm: " CONFIRM
    
    if [ "$CONFIRM" != "RESET" ]; then
        print_info "Reset cancelled"
        return 0
    fi
    
    print_info "Resetting database..."
    
    # Push schema (will drop and recreate)
    npx prisma db push --force-reset --skip-generate
    
    # Generate client
    npx prisma generate
    
    print_success "Database reset completed"
    
    # Offer to seed
    read -p "Seed database with demo data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        seed
    fi
}

# Check database status
status() {
    print_info "Checking database status..."
    
    npx prisma migrate status
}

# Create new migration
create_migration() {
    if [ "$IS_PRODUCTION" = true ]; then
        print_error "Cannot create migrations in production"
        print_info "Create migrations in development environment"
        exit 1
    fi
    
    local migration_name=$1
    
    if [ -z "$migration_name" ]; then
        print_error "Migration name required"
        print_info "Usage: $0 create-migration <name>"
        exit 1
    fi
    
    print_info "Creating migration: $migration_name"
    
    npx prisma migrate dev --name "$migration_name"
    
    print_success "Migration created"
}

# Database backup
backup() {
    print_info "Creating database backup..."
    
    if [ -f "$SCRIPT_DIR/../../deployment/enterprise-backup.sh" ]; then
        "$SCRIPT_DIR/../../deployment/enterprise-backup.sh"
    elif [ -f "$SCRIPT_DIR/../../../deployment/enterprise-backup.sh" ]; then
        "$SCRIPT_DIR/../../../deployment/enterprise-backup.sh"
    else
        print_warning "Enterprise backup script not found"
        print_info "Using TypeScript backup utility..."
        npx tsx scripts/backup-database.ts
    fi
}

# Show help
show_help() {
    echo ""
    echo "CortexBuild Pro - Database Management"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  migrate             Run database migrations"
    echo "  seed                Seed database with data (environment-aware)"
    echo "  reset               Reset database (NON-PRODUCTION only)"
    echo "  status              Check migration status"
    echo "  create-migration    Create new migration (development only)"
    echo "  backup              Create database backup"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 migrate"
    echo "  $0 seed"
    echo "  $0 reset"
    echo "  $0 create-migration add_user_preferences"
    echo ""
}

# Main
main() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║   CortexBuild Pro - Database Manager   ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    load_env
    detect_environment
    
    local command=${1:-help}
    
    case $command in
        migrate)
            migrate
            ;;
        seed)
            seed
            ;;
        reset)
            reset
            ;;
        status)
            status
            ;;
        create-migration)
            create_migration "$2"
            ;;
        backup)
            backup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
}

# Run main
main "$@"
