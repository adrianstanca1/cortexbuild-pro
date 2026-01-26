#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Post-Deployment Verification
# Verifies that the deployment is working correctly
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    CortexBuild Pro - Deployment Verification             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DEPLOYMENT_DIR"

# Check if running from deployment directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found!${NC}"
    echo "Please run this script from the deployment directory."
    exit 1
fi

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to increment counters
pass_check() {
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

fail_check() {
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

warn_check() {
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
}

echo -e "${CYAN}[1/8] Checking Docker Services...${NC}"
echo ""

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Docker services are running${NC}"
    pass_check
else
    echo -e "${RED}✗ Docker services are not running${NC}"
    fail_check
fi

# Check individual services
services=("postgres" "app")
for service in "${services[@]}"; do
    if docker compose ps | grep "$service" | grep -q "Up"; then
        echo -e "${GREEN}✓ $service is running${NC}"
        pass_check
    else
        echo -e "${RED}✗ $service is not running${NC}"
        fail_check
    fi
done

echo ""
echo -e "${CYAN}[2/8] Checking Database Connection...${NC}"
echo ""

# Test database connection
if docker compose exec -T postgres pg_isready -U cortexbuild > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is accepting connections${NC}"
    pass_check
else
    echo -e "${RED}✗ Database is not accepting connections${NC}"
    fail_check
fi

# Check if database exists
if docker compose exec -T postgres psql -U cortexbuild -d cortexbuild -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database 'cortexbuild' exists${NC}"
    pass_check
else
    echo -e "${RED}✗ Database 'cortexbuild' does not exist${NC}"
    fail_check
fi

echo ""
echo -e "${CYAN}[3/8] Checking Application Health...${NC}"
echo ""

# Wait a moment for the app to be fully ready
sleep 2

# Test application endpoint
if curl -s -f http://localhost:3000/api/auth/providers > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is responding${NC}"
    pass_check
else
    echo -e "${RED}✗ Application is not responding${NC}"
    echo -e "${YELLOW}  Try: docker compose logs app${NC}"
    fail_check
fi

echo ""
echo -e "${CYAN}[4/8] Checking Database Schema...${NC}"
echo ""

# Check if User table exists (core table)
if docker compose exec -T postgres psql -U cortexbuild -d cortexbuild -c "SELECT to_regclass('public.\"User\"');" | grep -q "User"; then
    echo -e "${GREEN}✓ Database schema is initialized${NC}"
    pass_check
else
    echo -e "${YELLOW}⚠ Database schema may not be initialized${NC}"
    echo -e "${YELLOW}  Run: docker compose exec app sh -c 'cd /app && npx prisma migrate deploy'${NC}"
    warn_check
fi

# Count tables
TABLE_COUNT=$(docker compose exec -T postgres psql -U cortexbuild -d cortexbuild -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | sed -n 3p | tr -d ' ')
if [ "$TABLE_COUNT" -gt 20 ]; then
    echo -e "${GREEN}✓ Database has $TABLE_COUNT tables${NC}"
    pass_check
else
    echo -e "${YELLOW}⚠ Database only has $TABLE_COUNT tables (expected 50+)${NC}"
    warn_check
fi

echo ""
echo -e "${CYAN}[5/8] Checking Environment Configuration...${NC}"
echo ""

# Check if critical environment variables are set
ENV_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${ENV_VARS[@]}"; do
    if docker compose exec -T app printenv "$var" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $var is set${NC}"
        pass_check
    else
        echo -e "${RED}✗ $var is not set${NC}"
        fail_check
    fi
done

echo ""
echo -e "${CYAN}[6/8] Checking Ports and Network...${NC}"
echo ""

# Check if port 3000 is accessible
if nc -z localhost 3000 2>/dev/null || netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✓ Port 3000 is accessible${NC}"
    pass_check
else
    echo -e "${RED}✗ Port 3000 is not accessible${NC}"
    fail_check
fi

# Check if port 5432 is listening
if docker compose exec -T postgres netstat -tuln 2>/dev/null | grep -q ":5432" || docker compose ps postgres | grep -q "5432"; then
    echo -e "${GREEN}✓ Database port 5432 is listening${NC}"
    pass_check
else
    echo -e "${YELLOW}⚠ Database port 5432 may not be listening${NC}"
    warn_check
fi

echo ""
echo -e "${CYAN}[7/8] Checking SSL/HTTPS (if applicable)...${NC}"
echo ""

# Load environment to check domain
if [ -f .env ]; then
    source .env
fi

if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
    # Check if nginx is running
    if docker compose ps | grep "nginx" | grep -q "Up"; then
        echo -e "${GREEN}✓ Nginx is running${NC}"
        pass_check
        
        # Check if SSL certificate exists
        if [ -d "/etc/letsencrypt/live/$DOMAIN" ] || [ -f "ssl/$DOMAIN.crt" ]; then
            echo -e "${GREEN}✓ SSL certificate found${NC}"
            pass_check
        else
            echo -e "${YELLOW}⚠ SSL certificate not found${NC}"
            echo -e "${YELLOW}  Run: ./setup-ssl.sh $DOMAIN admin@$DOMAIN${NC}"
            warn_check
        fi
    else
        echo -e "${YELLOW}⚠ Nginx is not running${NC}"
        echo -e "${YELLOW}  SSL setup may not be complete${NC}"
        warn_check
    fi
else
    echo -e "${YELLOW}⚠ Domain not configured, skipping SSL checks${NC}"
    warn_check
fi

echo ""
echo -e "${CYAN}[8/8] Checking System Resources...${NC}"
echo ""

# Check disk space
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓ Disk usage is healthy ($DISK_USAGE%)${NC}"
    pass_check
else
    echo -e "${YELLOW}⚠ Disk usage is high ($DISK_USAGE%)${NC}"
    warn_check
fi

# Check Docker disk usage
DOCKER_DISK=$(docker system df --format "{{.Type}}\t{{.Size}}" 2>/dev/null | head -n1)
if [ ! -z "$DOCKER_DISK" ]; then
    echo -e "${GREEN}✓ Docker disk usage available${NC}"
else
    echo -e "${YELLOW}⚠ Unable to check Docker disk usage${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                    VERIFICATION SUMMARY                 ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}✓ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}✗ Failed: $CHECKS_FAILED${NC}"
echo -e "${YELLOW}⚠ Warnings: $CHECKS_WARNING${NC}"

echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║          Deployment Verification Successful! ✓           ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🎉 Your CortexBuild Pro deployment is working correctly!"
    echo ""
    echo "Access your application:"
    if [ ! -z "$NEXTAUTH_URL" ]; then
        echo "  → $NEXTAUTH_URL"
    else
        echo "  → http://localhost:3000"
    fi
    echo ""
    
    if [ $CHECKS_WARNING -gt 0 ]; then
        echo -e "${YELLOW}Note: There are $CHECKS_WARNING warnings that may need attention.${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}║          Deployment Verification Failed!                 ║${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "❌ Some checks failed. Please review the errors above."
    echo ""
    echo "Troubleshooting steps:"
    echo ""
    echo "1. Check service logs:"
    echo "   → docker compose logs -f"
    echo ""
    echo "2. Restart services:"
    echo "   → docker compose restart"
    echo ""
    echo "3. Check configuration:"
    echo "   → cat .env"
    echo ""
    echo "4. Re-run migrations:"
    echo "   → docker compose exec app sh -c 'cd /app && npx prisma migrate deploy'"
    echo ""
    echo "5. View full documentation:"
    echo "   → cat PUBLIC_DEPLOYMENT.md"
    echo ""
    
    exit 1
fi
