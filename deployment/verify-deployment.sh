#!/bin/bash
# ============================================
# CortexBuild Pro - Deployment Verification
# ============================================
# This script verifies the deployment is ready and working

echo "🔍 CortexBuild Pro - Deployment Verification"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track status
ERRORS=0
WARNINGS=0

# Function to check service
check_service() {
    local service=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if docker compose ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Running${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check URL
check_url() {
    local url=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Responding${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Responding${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check port
check_port() {
    local port=$1
    local description=$2
    
    echo -n "Checking $description (port $port)... "
    
    if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ Listening${NC}"
        return 0
    elif ss -tulpn 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ Listening${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Listening${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "📦 Step 1: Checking Docker Services"
echo "------------------------------------"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found!${NC}"
    echo "Please run this script from the deployment directory."
    exit 1
fi

# Check Docker services
check_service "postgres" "PostgreSQL Database"
check_service "app" "Application Server"
check_service "nginx" "Nginx Reverse Proxy"

echo ""
echo "🌐 Step 2: Checking Network Connectivity"
echo "-----------------------------------------"

# Check ports
check_port "5432" "PostgreSQL"
check_port "3000" "Application"
check_port "80" "HTTP"
check_port "443" "HTTPS"

echo ""
echo "🔌 Step 3: Checking API Endpoints"
echo "----------------------------------"

# Check if services are accessible
check_url "http://localhost:3000/api/auth/providers" "Authentication API"

echo ""
echo "💾 Step 4: Checking Database Connection"
echo "----------------------------------------"

echo -n "Testing database connection... "
if docker compose exec -T postgres psql -U cortexbuild -d cortexbuild -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking database tables... "
TABLE_COUNT=$(docker compose exec -T postgres psql -U cortexbuild -d cortexbuild -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
if [ "$TABLE_COUNT" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✅ $TABLE_COUNT tables found${NC}"
else
    echo -e "${YELLOW}⚠️  No tables found (may need to run migrations)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "📝 Step 5: Checking Logs for Errors"
echo "------------------------------------"

echo -n "Checking application logs... "
ERROR_COUNT=$(docker compose logs app --tail=100 2>&1 | grep -i "error" | grep -v "0 errors" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No errors in recent logs${NC}"
else
    echo -e "${YELLOW}⚠️  $ERROR_COUNT error(s) found in logs${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "🔒 Step 6: Checking SSL/HTTPS (if applicable)"
echo "----------------------------------------------"

if [ -d "/etc/letsencrypt/live" ]; then
    echo -n "Checking SSL certificates... "
    if docker compose exec -T nginx ls /etc/letsencrypt/live > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SSL certificates found${NC}"
    else
        echo -e "${YELLOW}⚠️  SSL certificates not found${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SSL certificates directory not found (OK for local dev)${NC}"
fi

echo ""
echo "📊 Verification Summary"
echo "========================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Deployment is healthy.${NC}"
    echo ""
    echo "🎉 Your CortexBuild Pro deployment is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Access the application at: http://localhost:3000"
    echo "  2. Create an admin account"
    echo "  3. Configure your organization"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Deployment is running with $WARNINGS warning(s).${NC}"
    echo ""
    echo "Review the warnings above and address them if necessary."
    echo ""
    exit 0
else
    echo -e "${RED}❌ Deployment has $ERRORS error(s) and $WARNINGS warning(s).${NC}"
    echo ""
    echo "Please address the errors above before using the application."
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check logs: docker compose logs -f"
    echo "  2. Verify .env configuration"
    echo "  3. Ensure all required services are running"
    echo "  4. Review TROUBLESHOOTING.md for common issues"
    echo ""
    exit 1
fi
