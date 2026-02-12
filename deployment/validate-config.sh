#!/bin/bash
# =============================================================================
# CortexBuild Pro - Configuration Validation Script
# =============================================================================
# This script validates that VPS, connections, and WebSocket configuration
# is set up correctly before deployment
#
# Usage: ./validate-config.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_check() {
    echo -n "  Checking $1... "
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo -e "    ${YELLOW}$1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "    ${RED}$1${NC}"
    ERRORS=$((ERRORS + 1))
}

print_info() {
    echo -e "${BLUE}  → $1${NC}"
}

# Change to repository root
cd "$(dirname "$0")/.."

print_header "CortexBuild Pro - Configuration Validation"

# 1. Check WebSocket Path Consistency
print_header "1. WebSocket Configuration"

print_check "WebSocket client path"
CLIENT_FILE="nextjs_space/server/websocket-client.ts"
if [ ! -f "$CLIENT_FILE" ]; then
    CLIENT_FILE="nextjs_space/lib/websocket-client.ts"
fi
CLIENT_PATH=$(grep -o "path: '[^']*'" "$CLIENT_FILE" | head -1 | cut -d"'" -f2)
if [ "$CLIENT_PATH" = "/api/socketio" ]; then
    print_pass
else
    print_fail "Client path is '$CLIENT_PATH', expected '/api/socketio'"
fi

print_check "WebSocket server path"
SERVER_PATH=$(grep -o "path: '[^']*'" nextjs_space/production-server.js | head -1 | cut -d"'" -f2)
if [ "$SERVER_PATH" = "/api/socketio" ]; then
    print_pass
else
    print_fail "Server path is '$SERVER_PATH', expected '/api/socketio'"
fi

print_check "Nginx WebSocket proxy compatibility"
if grep -q "proxy_set_header Upgrade \$http_upgrade" deployment/nginx.conf && grep -q "proxy_set_header Connection 'upgrade'" deployment/nginx.conf; then
    print_pass
else
    print_fail "Nginx config missing required websocket upgrade proxy headers"
fi

# 2. Check Database Configuration
print_header "2. Database Configuration"

print_check "PostgreSQL health check"
if grep -q "pg_isready" deployment/docker-compose.yml; then
    print_pass
else
    print_fail "PostgreSQL health check not configured"
fi

print_check "Database connection pooling"
if grep -q "connection_limit" deployment/docker-compose.yml; then
    print_pass
else
    print_warn "Connection pooling not configured in docker-compose.yml"
fi

print_check "PostgreSQL performance tuning"
if grep -q "max_connections" deployment/docker-compose.yml; then
    print_pass
else
    print_warn "PostgreSQL performance parameters not configured"
fi

# 3. Check Environment Configuration
print_header "3. Environment Configuration"

print_check ".env.example exists"
if [ -f "deployment/.env.example" ]; then
    print_pass
else
    print_fail ".env.example not found"
fi

print_check ".env.example has required variables"
REQUIRED_VARS=("NEXTAUTH_SECRET" "NEXTAUTH_URL" "NEXT_PUBLIC_WEBSOCKET_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" deployment/.env.example; then
        print_pass
        print_info "Found: $var"
    else
        print_fail "Missing required variable: $var"
    fi
done

print_check "Database env strategy in .env.example"
if grep -q "^DATABASE_URL=" deployment/.env.example || (grep -q "^POSTGRES_USER=" deployment/.env.example && grep -q "^POSTGRES_PASSWORD=" deployment/.env.example && grep -q "^POSTGRES_DB=" deployment/.env.example); then
    print_pass
else
    print_fail "Missing database configuration strategy (DATABASE_URL or POSTGRES_* vars)"
fi

print_check ".env is gitignored"
if grep -q "deployment/\.env" .gitignore || grep -q "^\.env$" .gitignore; then
    print_pass
else
    print_fail ".env files not in .gitignore - SECURITY RISK!"
fi

# 4. Check Nginx Configuration
print_header "4. Nginx Configuration"

print_check "Nginx SSL configuration"
if grep -q "ssl_certificate" deployment/nginx.conf; then
    print_pass
else
    print_warn "SSL configuration present but verify certificates path"
fi

print_check "Nginx proxy headers"
REQUIRED_HEADERS=("X-Real-IP" "X-Forwarded-For" "X-Forwarded-Proto")
for header in "${REQUIRED_HEADERS[@]}"; do
    if grep -q "$header" deployment/nginx.conf; then
        print_pass
        print_info "Found header: $header"
    else
        print_warn "Missing proxy header: $header"
    fi
done

print_check "HTTP to HTTPS redirect"
if grep -q "return 301 https" deployment/nginx.conf; then
    print_pass
else
    print_warn "HTTP to HTTPS redirect not configured"
fi

# 5. Check Docker Configuration
print_header "5. Docker Configuration"

print_check "docker-compose.yml exists"
if [ -f "deployment/docker-compose.yml" ]; then
    print_pass
else
    print_fail "docker-compose.yml not found"
fi

print_check "Docker network configured"
if grep -q "cortexbuild-network" deployment/docker-compose.yml; then
    print_pass
else
    print_fail "Docker network not configured"
fi

print_check "Application health check"
if awk '/^  app:/{in_app=1;next} /^  [a-zA-Z0-9_-]+:/{if(in_app){exit(found?0:1)}} in_app && /^    healthcheck:/{found=1} END{if(in_app) exit(found?0:1)}' deployment/docker-compose.yml; then
    print_pass
else
    print_warn "Application health check not configured"
fi

# 6. Check Scripts
print_header "6. Deployment Scripts"

print_check "VPS setup script exists"
if [ -f "deployment/vps-setup.sh" ]; then
    print_pass
else
    print_fail "vps-setup.sh not found"
fi

print_check "VPS setup script is executable"
if [ -x "deployment/vps-setup.sh" ]; then
    print_pass
else
    print_warn "vps-setup.sh is not executable (run: chmod +x deployment/vps-setup.sh)"
fi

print_check "SSL setup script exists"
if [ -f "deployment/setup-ssl.sh" ]; then
    print_pass
else
    print_fail "setup-ssl.sh not found"
fi

print_check "Quick start script exists"
if [ -f "deployment/quick-start.sh" ]; then
    print_pass
else
    print_warn "quick-start.sh not found"
fi

# 7. Check Documentation
print_header "7. Documentation"

print_check "Deployment guide exists"
if [ -f "deployment/PRODUCTION-DEPLOY-GUIDE.md" ] || [ -f "PRODUCTION-DEPLOY-GUIDE.md" ]; then
    print_pass
else
    print_warn "deployment/PRODUCTION-DEPLOY-GUIDE.md not found"
fi

print_check "Production deployment guide exists"
if [ -f "deployment/PRODUCTION-DEPLOY-GUIDE.md" ] || [ -f "docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md" ]; then
    print_pass
else
    print_warn "Production deployment guide not found"
fi

print_check "API endpoints documented"
if [ -f "docs/API_ENDPOINTS.md" ]; then
    print_pass
else
    print_warn "docs/API_ENDPOINTS.md not found"
fi

# 8. Summary
print_header "Validation Summary"

echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}Configuration is ready for deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warnings found${NC}"
    echo -e "${YELLOW}Configuration is usable but could be improved.${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS errors and $WARNINGS warnings found${NC}"
    echo -e "${RED}Please fix errors before deployment.${NC}"
    exit 1
fi
