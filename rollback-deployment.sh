#!/bin/bash
# ============================================
# CortexBuild Pro - Rollback Script
# ============================================
# This script helps rollback to a previous working state

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo -e "${RED}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           CortexBuild Pro - Rollback Utility                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}⚠️  WARNING: This will rollback your deployment${NC}"
echo ""

# Navigate to deployment directory
DEPLOYMENT_DIR="/var/www/cortexbuild-pro/deployment"
if [ -d "$DEPLOYMENT_DIR" ]; then
    cd "$DEPLOYMENT_DIR"
elif [ -d "deployment" ]; then
    cd deployment
else
    echo -e "${RED}Error: Cannot find deployment directory${NC}"
    exit 1
fi

# ============================================
# Rollback Options
# ============================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}ROLLBACK OPTIONS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Restart services (quick fix for most issues)"
echo "2. Restore from database backup"
echo "3. Rollback to previous Git commit"
echo "4. Complete redeployment (rebuild everything)"
echo "5. Stop all services"
echo "6. Cancel"
echo ""

read -p "Select option (1-6): " CHOICE

case $CHOICE in
    1)
        # ============================================
        # Option 1: Restart Services
        # ============================================
        echo ""
        echo -e "${CYAN}Restarting all services...${NC}"
        echo ""
        
        docker compose restart
        
        echo ""
        echo -e "${GREEN}✓ Services restarted${NC}"
        echo ""
        echo "Waiting for services to stabilize..."
        sleep 10
        
        echo ""
        echo "Service status:"
        docker compose ps
        
        echo ""
        echo -e "${BLUE}Check if application is responding:${NC}"
        echo "  curl http://localhost:3000/api/auth/providers"
        echo ""
        ;;
        
    2)
        # ============================================
        # Option 2: Restore Database
        # ============================================
        echo ""
        echo -e "${CYAN}Available database backups:${NC}"
        echo ""
        
        if [ -d "backups" ]; then
            ls -lht backups/*.sql 2>/dev/null | head -10
            echo ""
            
            read -p "Enter backup filename (or 'cancel'): " BACKUP_FILE
            
            if [ "$BACKUP_FILE" = "cancel" ]; then
                echo "Cancelled"
                exit 0
            fi
            
            if [ ! -f "backups/$BACKUP_FILE" ]; then
                echo -e "${RED}Error: Backup file not found${NC}"
                exit 1
            fi
            
            echo ""
            echo -e "${RED}⚠️  This will replace the current database!${NC}"
            read -p "Are you sure? (yes/no): " CONFIRM
            
            if [ "$CONFIRM" != "yes" ]; then
                echo "Cancelled"
                exit 0
            fi
            
            echo ""
            echo -e "${CYAN}Restoring database from backup...${NC}"
            
            # Stop application to prevent writes
            docker compose stop app
            
            # Restore database
            cat "backups/$BACKUP_FILE" | docker compose exec -T postgres psql -U cortexbuild -d cortexbuild
            
            # Start application
            docker compose start app
            
            echo ""
            echo -e "${GREEN}✓ Database restored${NC}"
            echo ""
        else
            echo -e "${RED}No backups directory found${NC}"
            echo "Run './backup.sh' to create a backup first"
            exit 1
        fi
        ;;
        
    3)
        # ============================================
        # Option 3: Git Rollback
        # ============================================
        echo ""
        echo -e "${CYAN}Recent commits:${NC}"
        echo ""
        
        cd /var/www/cortexbuild-pro
        git log --oneline -10
        
        echo ""
        read -p "Enter commit hash to rollback to (or 'cancel'): " COMMIT
        
        if [ "$COMMIT" = "cancel" ]; then
            echo "Cancelled"
            exit 0
        fi
        
        echo ""
        echo -e "${RED}⚠️  This will reset code to commit: $COMMIT${NC}"
        echo -e "${YELLOW}All uncommitted changes will be permanently lost!${NC}"
        read -p "Are you sure? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" != "yes" ]; then
            echo "Cancelled"
            exit 0
        fi
        
        echo ""
        echo -e "${CYAN}Creating backup branch before reset...${NC}"
        cd /var/www/cortexbuild-pro
        git branch "backup-$(date +%Y%m%d_%H%M%S)" || true
        
        echo ""
        echo -e "${CYAN}Rolling back to commit $COMMIT...${NC}"
        
        # Stop services
        cd deployment
        docker compose down
        
        # Reset to commit
        cd ..
        git reset --hard $COMMIT
        
        # Rebuild and start
        cd deployment
        docker compose up -d --build
        
        # Run migrations
        echo ""
        echo -e "${CYAN}Running database migrations...${NC}"
        docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy"
        
        echo ""
        echo -e "${GREEN}✓ Rollback complete${NC}"
        echo ""
        ;;
        
    4)
        # ============================================
        # Option 4: Complete Redeployment
        # ============================================
        echo ""
        echo -e "${RED}⚠️  This will completely redeploy the application${NC}"
        echo -e "${YELLOW}The database will NOT be affected${NC}"
        echo ""
        read -p "Continue? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" != "yes" ]; then
            echo "Cancelled"
            exit 0
        fi
        
        echo ""
        echo -e "${CYAN}Stopping services...${NC}"
        docker compose down
        
        echo ""
        echo -e "${CYAN}Pulling latest code...${NC}"
        cd /var/www/cortexbuild-pro
        
        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            echo -e "${YELLOW}Found uncommitted changes. Stashing them...${NC}"
            git stash save "Auto-stash before redeployment $(date +%Y%m%d_%H%M%S)"
        fi
        
        if ! git pull origin main; then
            echo -e "${RED}Failed to pull latest code${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${CYAN}Rebuilding application...${NC}"
        cd deployment
        docker compose build --no-cache app
        
        echo ""
        echo -e "${CYAN}Starting services...${NC}"
        docker compose up -d
        
        echo ""
        echo -e "${CYAN}Running migrations...${NC}"
        sleep 10
        docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy"
        
        echo ""
        echo -e "${GREEN}✓ Redeployment complete${NC}"
        echo ""
        ;;
        
    5)
        # ============================================
        # Option 5: Stop All Services
        # ============================================
        echo ""
        echo -e "${RED}⚠️  This will stop all services${NC}"
        echo ""
        read -p "Continue? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" != "yes" ]; then
            echo "Cancelled"
            exit 0
        fi
        
        echo ""
        echo -e "${CYAN}Stopping all services...${NC}"
        docker compose down
        
        echo ""
        echo -e "${GREEN}✓ All services stopped${NC}"
        echo ""
        echo "To start again, run:"
        echo "  cd /var/www/cortexbuild-pro/deployment"
        echo "  docker compose up -d"
        echo ""
        ;;
        
    6)
        echo ""
        echo "Cancelled"
        exit 0
        ;;
        
    *)
        echo ""
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

# ============================================
# Verification
# ============================================

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}POST-ROLLBACK VERIFICATION${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$CHOICE" != "5" ]; then
    echo "Service status:"
    docker compose ps
    
    echo ""
    echo "Testing application..."
    sleep 3
    
    if curl -sf http://localhost:3000/api/auth/providers >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is responding${NC}"
    else
        echo -e "${RED}✗ Application is not responding${NC}"
        echo ""
        echo "Check logs with: docker compose logs -f app"
    fi
    
    echo ""
    echo -e "${BLUE}Run full verification:${NC}"
    echo "  ./verify-deployment.sh"
fi

echo ""
echo -e "${GREEN}Rollback operation completed${NC}"
echo ""
