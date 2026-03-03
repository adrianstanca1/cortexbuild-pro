#!/bin/bash
# ASAgents - IONOS Production Deployment Script
# Deploys upgraded Java backend + Node.js backend + React frontend

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ASAgents IONOS Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Configuration
IONOS_HOST="${IONOS_HOST:-your-ionos-server.com}"
IONOS_USER="${IONOS_USER:-deploy}"
IONOS_PATH="${IONOS_PATH:-/var/www/asagents}"
DRY_RUN="${DRY_RUN:-false}"

# Check required tools
command -v rsync >/dev/null 2>&1 || { echo -e "${RED}Error: rsync is required${NC}"; exit 1; }
command -v ssh >/dev/null 2>&1 || { echo -e "${RED}Error: ssh is required${NC}"; exit 1; }

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            IONOS_HOST="$2"
            shift 2
            ;;
        --user)
            IONOS_USER="$2"
            shift 2
            ;;
        --path)
            IONOS_PATH="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--host HOST] [--user USER] [--path PATH] [--dry-run]"
            exit 1
            ;;
    esac
done

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN MODE - No actual deployment${NC}"
    RSYNC_DRY_RUN="--dry-run"
else
    RSYNC_DRY_RUN=""
fi

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Host: ${IONOS_HOST}"
echo -e "  User: ${IONOS_USER}"
echo -e "  Path: ${IONOS_PATH}"
echo ""

# Step 1: Build Frontend
echo -e "${GREEN}[1/7] Building React Frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend build complete${NC}"
echo ""

# Step 2: Build Java Backend
echo -e "${GREEN}[2/7] Building Java Backend...${NC}"
cd backend/java
./mvnw clean package -DskipTests
JAR_FILE=$(ls target/*.jar | head -n 1)
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}Error: JAR file not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java backend build complete: $JAR_FILE${NC}"
cd ../..
echo ""

# Step 3: Prepare deployment package
echo -e "${GREEN}[3/7] Preparing deployment package...${NC}"
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/frontend"
mkdir -p "$TEMP_DIR/backend/java"
mkdir -p "$TEMP_DIR/backend/nodejs"

# Copy frontend build
cp -r dist/* "$TEMP_DIR/frontend/"

# Copy Java backend
cp backend/java/target/*.jar "$TEMP_DIR/backend/java/app.jar"
cp backend/java/deploy-local.sh "$TEMP_DIR/backend/java/"

# Copy Node.js backend
cp -r backend/src "$TEMP_DIR/backend/nodejs/"
cp backend/package*.json "$TEMP_DIR/backend/nodejs/"
cp backend/tsconfig.json "$TEMP_DIR/backend/nodejs/"

echo -e "${GREEN}✓ Deployment package prepared${NC}"
echo ""

# Step 4: Create deployment scripts
echo -e "${GREEN}[4/7] Creating deployment scripts...${NC}"
cat > "$TEMP_DIR/start-services.sh" << 'EOF'
#!/bin/bash
# Start all services

# Start MySQL (if not already running)
if ! systemctl is-active --quiet mysql; then
    sudo systemctl start mysql
fi

# Start Node.js Backend
cd /var/www/asagents/backend/nodejs
npm install --production
nohup node src/index.js > logs/nodejs.log 2>&1 &
echo $! > nodejs.pid

# Start Java Backend
cd /var/www/asagents/backend/java
nohup java -jar -Xms512m -Xmx1024m app.jar > logs/java.log 2>&1 &
echo $! > java.pid

# Start Nginx (serves frontend)
sudo systemctl restart nginx

echo "All services started!"
EOF

chmod +x "$TEMP_DIR/start-services.sh"

cat > "$TEMP_DIR/stop-services.sh" << 'EOF'
#!/bin/bash
# Stop all services

# Stop Node.js
if [ -f /var/www/asagents/backend/nodejs/nodejs.pid ]; then
    kill $(cat /var/www/asagents/backend/nodejs/nodejs.pid)
    rm /var/www/asagents/backend/nodejs/nodejs.pid
fi

# Stop Java
if [ -f /var/www/asagents/backend/java/java.pid ]; then
    kill $(cat /var/www/asagents/backend/java/java.pid)
    rm /var/www/asagents/backend/java/java.pid
fi

echo "All services stopped!"
EOF

chmod +x "$TEMP_DIR/stop-services.sh"

echo -e "${GREEN}✓ Deployment scripts created${NC}"
echo ""

# Step 5: Deploy to IONOS
echo -e "${GREEN}[5/7] Deploying to IONOS...${NC}"
if [ "$DRY_RUN" = false ]; then
    # Create remote directory
    ssh "$IONOS_USER@$IONOS_HOST" "mkdir -p $IONOS_PATH"
    
    # Sync files
    rsync -avz --delete $RSYNC_DRY_RUN \
        "$TEMP_DIR/" \
        "$IONOS_USER@$IONOS_HOST:$IONOS_PATH/"
    
    echo -e "${GREEN}✓ Files deployed${NC}"
else
    echo -e "${YELLOW}Would deploy to: $IONOS_USER@$IONOS_HOST:$IONOS_PATH/${NC}"
fi
echo ""

# Step 6: Configure services
echo -e "${GREEN}[6/7] Configuring services...${NC}"
if [ "$DRY_RUN" = false ]; then
    # Set permissions
    ssh "$IONOS_USER@$IONOS_HOST" << 'ENDSSH'
        cd /var/www/asagents
        chmod +x *.sh
        chmod +x backend/java/deploy-local.sh
        mkdir -p backend/java/logs
        mkdir -p backend/nodejs/logs
ENDSSH
    echo -e "${GREEN}✓ Services configured${NC}"
else
    echo -e "${YELLOW}Would configure services on remote server${NC}"
fi
echo ""

# Step 7: Start services
echo -e "${GREEN}[7/7] Starting services...${NC}"
if [ "$DRY_RUN" = false ]; then
    ssh "$IONOS_USER@$IONOS_HOST" "cd $IONOS_PATH && ./start-services.sh"
    echo -e "${GREEN}✓ Services started${NC}"
else
    echo -e "${YELLOW}Would start services on remote server${NC}"
fi
echo ""

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Application URLs:"
echo -e "  Frontend: http://$IONOS_HOST"
echo -e "  Java API: http://$IONOS_HOST:4001"
echo -e "  Node API: http://$IONOS_HOST:5001"
echo ""
echo -e "Management commands:"
echo -e "  Start:  ssh $IONOS_USER@$IONOS_HOST 'cd $IONOS_PATH && ./start-services.sh'"
echo -e "  Stop:   ssh $IONOS_USER@$IONOS_HOST 'cd $IONOS_PATH && ./stop-services.sh'"
echo -e "  Logs:   ssh $IONOS_USER@$IONOS_HOST 'tail -f $IONOS_PATH/backend/*/logs/*.log'"
echo ""
