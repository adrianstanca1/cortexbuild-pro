#!/bin/bash
# =================================================================
# CortexBuild Pro - Quick Public Launch
# =================================================================
# This is a convenience script that forwards to the main deployment script.
# Run this from the project root for quick public deployment.
# =================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_SCRIPT="$SCRIPT_DIR/deployment/public-launch-master.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     CortexBuild Pro - Quick Public Launch                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if deployment script exists
if [ ! -f "$DEPLOYMENT_SCRIPT" ]; then
    echo -e "${RED}Error: Deployment script not found at $DEPLOYMENT_SCRIPT${NC}"
    exit 1
fi

# Check if script is executable
if [ ! -x "$DEPLOYMENT_SCRIPT" ]; then
    chmod +x "$DEPLOYMENT_SCRIPT"
fi

# Forward all arguments to the main deployment script
echo "Forwarding to: $DEPLOYMENT_SCRIPT"
echo ""

exec "$DEPLOYMENT_SCRIPT" "$@"
