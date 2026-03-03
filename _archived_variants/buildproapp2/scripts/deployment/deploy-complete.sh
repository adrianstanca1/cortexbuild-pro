#!/bin/bash
# Complete Deployment Script for Hostinger
# Run this script from your project root: bash deploy-complete.sh

set -e

echo "🚀 BuildPro Complete Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REMOTE_USER="u875310796"
REMOTE_HOST="82.29.188.65"
REMOTE_PORT="65002"
REMOTE_FRONTEND="/home/u875310796/domains/cortexbuildpro.com/public_html"
REMOTE_BACKEND="/home/u875310796/domains/cortexbuildpro.com/api"

echo "${YELLOW}Step 1: Commit and Push Changes${NC}"
git add -A
if git diff --cached --quiet; then
    echo "${GREEN}✓ No changes to commit${NC}"
else
    git commit -m "Deploy: Complete system with all features and database integration"
    git push origin main
    echo "${GREEN}✓ Changes committed and pushed${NC}"
fi

echo ""
echo "${YELLOW}Step 2: Frontend Build${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Frontend build successful${NC}"
else
    echo "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}Step 3: Backend Build${NC}"
cd server
npm install --production
if [ -f "tsconfig.json" ]; then
    npm run build
    echo "${GREEN}✓ Backend build successful${NC}"
else
    echo "${YELLOW}⚠ No backend build needed (using JS directly)${NC}"
fi
cd ..

echo ""
echo "${YELLOW}Step 4: Create .htaccess for Frontend${NC}"
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # Exclude API from SPA routing
  RewriteCond %{REQUEST_URI} ^/api [NC]
  RewriteRule ^api - [L]

  # SPA routing
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
EOF
echo "${GREEN}✓ .htaccess created${NC}"

echo ""
echo "${YELLOW}Step 5: Deploying Frontend to Hostinger${NC}"
echo "Uploading files to cortexbuildpro.com..."

scp -P $REMOTE_PORT -r dist/* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_FRONTEND}/
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Frontend deployed successfully${NC}"
else
    echo "${RED}✗ Frontend deployment failed${NC}"
    echo "You may need to enter your password or configure SSH keys"
fi

echo ""
echo "${YELLOW}Step 6: Deploying Backend to Hostinger${NC}"
echo "Uploading server files..."

# Create backend directory if it doesn't exist
ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_BACKEND} ${REMOTE_BACKEND}/dist"

# Upload backend files
scp -P $REMOTE_PORT server/package.json ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/
scp -P $REMOTE_PORT server/package-lock.json ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/

# Upload .env if exists
if [ -f "server/.env" ]; then
    scp -P $REMOTE_PORT server/.env ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/
    echo "${GREEN}✓ Environment file uploaded${NC}"
fi

# Upload built files or source
if [ -d "server/dist" ]; then
    scp -P $REMOTE_PORT -r server/dist/* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/dist/
    echo "${GREEN}✓ Backend build uploaded${NC}"
else
    # Upload source files if no build directory
    scp -P $REMOTE_PORT -r server/*.js ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/ 2>/dev/null || true
    scp -P $REMOTE_PORT -r server/controllers ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/ 2>/dev/null || true
    scp -P $REMOTE_PORT -r server/middleware ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/ 2>/dev/null || true
    scp -P $REMOTE_PORT -r server/services ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/ 2>/dev/null || true
    scp -P $REMOTE_PORT -r server/routes ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/ 2>/dev/null || true
    scp -P $REMOTE_PORT -r server/utils ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BACKEND}/ 2>/dev/null || true
    echo "${GREEN}✓ Backend source uploaded${NC}"
fi

echo ""
echo "${GREEN}======================================"
echo "✅ Deployment Complete!"
echo "======================================${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Log in to Hostinger hPanel (https://hpanel.hostinger.com)"
echo "2. Go to: Websites → Node.js"
echo "3. Set up application:"
echo "   - Directory: ${REMOTE_BACKEND}"
echo "   - Entry point: dist/index.js (or index.js)"
echo "   - Node version: 18.x or higher"
echo "4. Click 'Install Dependencies'"
echo "5. Click 'Start Application'"
echo ""
echo "🌐 Your sites:"
echo "   Frontend: https://cortexbuildpro.com"
echo "   Backend:  https://api.cortexbuildpro.com"
echo ""
echo "🔍 Verification:"
echo "   curl https://cortexbuildpro.com"
echo "   curl https://api.cortexbuildpro.com/health"
echo ""
