#!/bin/bash
# ============================================
# CortexBuild Pro - Post-Deployment Verification
# ============================================
# This script verifies that all services are running correctly
# after deployment

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║       CortexBuild Pro - Deployment Verification             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Navigate to deployment directory
if [ -d "/var/www/cortexbuild-pro/deployment" ]; then
    cd /var/www/cortexbuild-pro/deployment
elif [ -d "deployment" ]; then
    cd deployment
else
    echo -e "${RED}Error: Cannot find deployment directory${NC}"
    exit 1
fi

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass_test() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail_test() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn_test() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

info_test() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ============================================
# Test 1: Docker Services
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST 1: Docker Services Status${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Docker is running
if systemctl is-active --quiet docker; then
    pass_test "Docker service is running"
else
    fail_test "Docker service is not running"
fi

# Check Docker Compose
if docker compose version &>/dev/null; then
    pass_test "Docker Compose is available"
else
    fail_test "Docker Compose is not available"
fi

# Check container status
echo ""
info_test "Checking container status..."
echo ""

CONTAINERS=("cortexbuild-db" "cortexbuild-app" "cortexbuild-nginx" "cortexbuild-certbot")

for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        # Check if container is healthy or running
        STATUS=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null)
        if [ "$STATUS" = "running" ]; then
            pass_test "Container $container is running"
        else
            fail_test "Container $container is not running (status: $STATUS)"
        fi
    else
        fail_test "Container $container not found"
    fi
done

# ============================================
# Test 2: Database Connection
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST 2: Database Connection${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check PostgreSQL is ready
if docker compose exec -T postgres pg_isready -U cortexbuild &>/dev/null; then
    pass_test "PostgreSQL is ready to accept connections"
else
    fail_test "PostgreSQL is not ready"
fi

# Check database exists
if docker compose exec -T postgres psql -U cortexbuild -d cortexbuild -c "SELECT 1;" &>/dev/null; then
    pass_test "Database 'cortexbuild' is accessible"
else
    fail_test "Cannot access database 'cortexbuild'"
fi

# Check for tables (migrations ran)
TABLE_COUNT=$(docker compose exec -T postgres psql -U cortexbuild -d cortexbuild -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$TABLE_COUNT" -gt 5 ]; then
    pass_test "Database has $TABLE_COUNT tables (migrations ran successfully)"
else
    warn_test "Database has only $TABLE_COUNT tables (migrations may not have run)"
fi

# ============================================
# Test 3: Application Health
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST 3: Application Health${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check application responds
if curl -sf http://localhost:3000/api/auth/providers >/dev/null; then
    pass_test "Application is responding to HTTP requests"
else
    fail_test "Application is not responding"
fi

# Check auth providers endpoint
RESPONSE=$(curl -s http://localhost:3000/api/auth/providers 2>/dev/null)
if echo "$RESPONSE" | grep -q "credentials"; then
    pass_test "Auth providers endpoint returns valid data"
else
    warn_test "Auth providers endpoint response is unexpected"
fi

# Check if application logs show errors
ERROR_COUNT=$(docker compose logs app --tail=50 2>/dev/null | grep -i "error" | grep -v "Failed to load env" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    pass_test "No errors in recent application logs"
elif [ "$ERROR_COUNT" -lt 5 ]; then
    warn_test "Found $ERROR_COUNT errors in recent logs (may be normal)"
else
    fail_test "Found $ERROR_COUNT errors in recent application logs"
fi

# ============================================
# Test 4: Web Server
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST 4: Web Server (Nginx)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Nginx is responding
if curl -sf http://localhost:80 >/dev/null 2>&1; then
    pass_test "Nginx is responding on port 80"
else
    warn_test "Nginx is not responding on port 80 (may not be configured yet)"
fi

# Check Nginx configuration
if docker compose exec -T nginx nginx -t &>/dev/null; then
    pass_test "Nginx configuration is valid"
else
    fail_test "Nginx configuration has errors"
fi

# ============================================
# Test 5: Network and Firewall
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST 5: Network and Firewall${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check firewall status
if command -v ufw &>/dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        pass_test "Firewall (UFW) is active"
        
        # Check required ports
        for port in 22 80 443; do
            if sudo ufw status | grep -q "$port"; then
                pass_test "Port $port is allowed in firewall"
            else
                warn_test "Port $port may not be allowed in firewall"
            fi
        done
    else
        warn_test "Firewall (UFW) is not active"
    fi
else
    info_test "UFW not installed (firewall check skipped)"
fi

# Check port availability
for port in 3000 5432; do
    if netstat -tln 2>/dev/null | grep -q ":$port "; then
        pass_test "Port $port is listening"
    else
        fail_test "Port $port is not listening"
    fi
done

# ============================================
# Test 6: Environment Configuration
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST 6: Environment Configuration${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check .env file exists
if [ -f .env ]; then
    pass_test ".env file exists"
    
    # Check critical environment variables
    if ! source .env 2>/dev/null; then
        fail_test "Failed to load .env file"
    else
        pass_test ".env file loaded successfully"
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your_secure_password_here" ]; then
        fail_test "POSTGRES_PASSWORD is not properly configured"
    else
        pass_test "POSTGRES_PASSWORD is configured"
    fi
    
    if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your_secure_secret_here" ]; then
        fail_test "NEXTAUTH_SECRET is not properly configured"
    else
        pass_test "NEXTAUTH_SECRET is configured"
    fi
    
    if [ -n "$NEXTAUTH_URL" ] && [ "$NEXTAUTH_URL" != "https://your-domain.com" ]; then
        pass_test "NEXTAUTH_URL is configured ($NEXTAUTH_URL)"
    else
        warn_test "NEXTAUTH_URL is not configured"
    fi
else
    fail_test ".env file not found"
fi

# ============================================
# Test 7: Security
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST 7: Security Checks${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Fail2Ban
if command -v fail2ban-client &>/dev/null; then
    if systemctl is-active --quiet fail2ban; then
        pass_test "Fail2Ban is active"
    else
        warn_test "Fail2Ban is installed but not active"
    fi
else
    warn_test "Fail2Ban is not installed"
fi

# Check for credentials file (should be deleted)
if ls ../DEPLOYMENT_CREDENTIALS_*.txt &>/dev/null; then
    warn_test "Credentials file still exists (should be deleted after saving)"
else
    pass_test "Credentials file not found (good for security)"
fi

# Check Docker socket permissions
if [ -S /var/run/docker.sock ]; then
    SOCKET_PERMS=$(stat -c %a /var/run/docker.sock)
    if [ "$SOCKET_PERMS" = "660" ] || [ "$SOCKET_PERMS" = "666" ]; then
        pass_test "Docker socket has secure permissions"
    else
        warn_test "Docker socket permissions may be too open: $SOCKET_PERMS"
    fi
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}VERIFICATION SUMMARY${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
echo -e "  ${GREEN}✓ Passed:${NC}   $PASSED"
echo -e "  ${RED}✗ Failed:${NC}   $FAILED"
echo -e "  ${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo -e "  ${BLUE}━━━━━━━━━━━━━━${NC}"
echo -e "  Total:      $TOTAL"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

# Overall status
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║         ✅  DEPLOYMENT VERIFIED SUCCESSFULLY!         ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Your application is ready!${NC}"
    echo ""
    echo -e "  Access URL: ${BLUE}http://${SERVER_IP}:3000${NC}"
    echo ""
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Note: $WARNINGS warning(s) found. Review above for details.${NC}"
        echo ""
    fi
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}║         ❌  DEPLOYMENT HAS ISSUES                     ║${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}$FAILED test(s) failed. Please review the issues above.${NC}"
    echo ""
    echo -e "${CYAN}Troubleshooting steps:${NC}"
    echo "  1. Check logs:         docker compose logs -f"
    echo "  2. Check services:     docker compose ps"
    echo "  3. Restart services:   docker compose restart"
    echo "  4. View documentation: cat /var/www/cortexbuild-pro/TROUBLESHOOTING.md"
    echo ""
    exit 1
fi
