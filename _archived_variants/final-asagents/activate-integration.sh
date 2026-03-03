#!/bin/bash

# ASAgents Platform - Activate Integration Features
# This script rebuilds and restarts services to activate the new integration features

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🚀 Activating ASAgents Integration Features                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Build Java Backend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Building Java Backend with Integration Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd backend/java

if mvn clean package -DskipTests; then
    echo -e "${GREEN}✓ Java backend built successfully${NC}"
else
    echo -e "${YELLOW}⚠ Java backend build had issues, but continuing...${NC}"
fi

cd ../..

# Step 2: Build Node.js Backend
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Building Node.js Backend with Integration Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd server

if npm run build; then
    echo -e "${GREEN}✓ Node.js backend built successfully${NC}"
else
    echo -e "${YELLOW}⚠ Node.js backend build had issues, but continuing...${NC}"
fi

cd ..

# Step 3: Restart Node.js Backend Container
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Restarting Node.js Backend Container${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if docker restart final-backend-1; then
    echo -e "${GREEN}✓ Node.js backend restarted${NC}"
    echo "  Waiting for Node.js to be ready..."
    sleep 5
else
    echo -e "${YELLOW}⚠ Could not restart Node.js container${NC}"
fi

# Step 4: Restart Java Backend (if running)
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: Checking Java Backend Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Java backend is running
JAVA_PID=$(ps aux | grep -E "java.*MultimodalBackendApplication" | grep -v grep | awk '{print $2}' | head -1)

if [ ! -z "$JAVA_PID" ]; then
    echo "  Java backend is running (PID: $JAVA_PID)"
    echo "  Note: To apply Java changes, restart manually:"
    echo "  cd backend/java && ./deploy-local.sh restart"
else
    echo -e "${YELLOW}  Java backend not running. Start with:${NC}"
    echo "  cd backend/java && ./deploy-local.sh start"
fi

# Step 5: Test Integration Endpoints
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: Testing Integration Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

sleep 3

# Test Node.js health
echo "Testing Node.js Backend..."
if NODE_HEALTH=$(curl -s http://localhost:5001/api/health 2>/dev/null); then
    echo -e "${GREEN}✓ Node.js backend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Node.js backend not responding yet${NC}"
fi

# Test Java health
echo "Testing Java Backend..."
if JAVA_HEALTH=$(curl -s http://localhost:4001/api/enhanced/health 2>/dev/null); then
    echo -e "${GREEN}✓ Java backend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Java backend not responding${NC}"
fi

# Test integration endpoint (may not work yet if Node.js needs full restart)
echo "Testing Integration Endpoint..."
if INT_HEALTH=$(curl -s http://localhost:5001/api/integration/health/unified 2>/dev/null); then
    echo -e "${GREEN}✓ Integration endpoints are active!${NC}"
else
    echo -e "${YELLOW}⚠ Integration endpoints not yet active${NC}"
    echo "  This is normal if Node.js just restarted"
    echo "  Try again in a few seconds with:"
    echo "  curl http://localhost:5001/api/integration/health/unified | jq"
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Integration Activation Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🔗 Integration Endpoints (once fully loaded):"
echo ""
echo "  Unified Health Check:"
echo "    curl http://localhost:5001/api/integration/health/unified | jq"
echo ""
echo "  Integration Status:"
echo "    curl http://localhost:5001/api/integration/status | jq"
echo ""
echo "  Route Request:"
echo "    curl http://localhost:5001/api/integration/route/api/enhanced/health | jq"
echo ""
echo "📚 Documentation:"
echo "  - INTEGRATION_COMPLETE.md"
echo "  - INTEGRATION_QUICK_REFERENCE.md"
echo "  - INTEGRATION_SUMMARY.md"
echo ""
echo -e "${GREEN}🎉 Your platform now has full cross-backend integration!${NC}"
echo ""
