#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - VPS Deployment Preparation
# ============================================
# This script prepares and validates the application
# for deployment to a VPS server.

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR/deployment"
NEXTJS_DIR="$SCRIPT_DIR/nextjs_space"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      CortexBuild Pro - VPS Deployment Preparation        ║
║                                                           ║
║         Validate Build & Deployment Configuration        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Track overall status
ALL_CHECKS_PASSED=true

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        ALL_CHECKS_PASSED=false
    fi
}

# Function to check command availability
check_command() {
    if command -v $1 &> /dev/null; then
        print_status 0 "$1 is installed"
        return 0
    else
        print_status 1 "$1 is not installed"
        return 1
    fi
}

# ============================================
# Step 1: Check System Prerequisites
# ============================================
echo -e "${CYAN}[1/7] Checking System Prerequisites...${NC}"
echo ""

check_command "docker" || true
check_command "git" || true
check_command "node" || true
check_command "npm" || true

# Check for docker compose
if docker compose version &> /dev/null; then
    print_status 0 "docker compose is available"
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    print_status 0 "docker-compose is available"
    DOCKER_COMPOSE_CMD="docker-compose"
else
    print_status 1 "docker compose is not available"
    DOCKER_COMPOSE_CMD=""
fi

echo ""

# ============================================
# Step 2: Validate Repository Structure
# ============================================
echo -e "${CYAN}[2/7] Validating Repository Structure...${NC}"
echo ""

[ -d "$NEXTJS_DIR" ] && print_status 0 "Next.js application directory exists" || print_status 1 "Next.js application directory missing"
[ -d "$DEPLOYMENT_DIR" ] && print_status 0 "Deployment directory exists" || print_status 1 "Deployment directory missing"
[ -f "$DEPLOYMENT_DIR/docker-compose.yml" ] && print_status 0 "docker-compose.yml exists" || print_status 1 "docker-compose.yml missing"
[ -f "$DEPLOYMENT_DIR/Dockerfile" ] && print_status 0 "Dockerfile exists" || print_status 1 "Dockerfile missing"
[ -f "$DEPLOYMENT_DIR/.env.example" ] && print_status 0 ".env.example exists" || print_status 1 ".env.example missing"
[ -f "$NEXTJS_DIR/package.json" ] && print_status 0 "package.json exists" || print_status 1 "package.json missing"
[ -f "$NEXTJS_DIR/next.config.js" ] && print_status 0 "next.config.js exists" || print_status 1 "next.config.js missing"
[ -d "$NEXTJS_DIR/prisma" ] && print_status 0 "Prisma directory exists" || print_status 1 "Prisma directory missing"

echo ""

# ============================================
# Step 3: Check Git Status
# ============================================
echo -e "${CYAN}[3/7] Checking Git Status...${NC}"
echo ""

cd "$SCRIPT_DIR"

# Check if there are uncommitted changes
if git diff-index --quiet HEAD --; then
    print_status 0 "No uncommitted changes"
else
    print_status 1 "There are uncommitted changes"
    echo -e "${YELLOW}  Files with changes:${NC}"
    git status --short | head -10
fi

# Show current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "  Current branch: ${CYAN}$CURRENT_BRANCH${NC}"

echo ""

# ============================================
# Step 4: Validate Environment Configuration
# ============================================
echo -e "${CYAN}[4/7] Validating Environment Configuration...${NC}"
echo ""

if [ -f "$DEPLOYMENT_DIR/.env.example" ]; then
    print_status 0 "Environment template exists"
    
    # List required environment variables
    echo -e "${YELLOW}  Required environment variables:${NC}"
    grep -v '^#' "$DEPLOYMENT_DIR/.env.example" | grep -v '^$' | grep '=' | cut -d'=' -f1 | while read -r var; do
        echo "    - $var"
    done
else
    print_status 1 "Environment template missing"
fi

echo ""

# ============================================
# Step 5: Validate Docker Configuration
# ============================================
echo -e "${CYAN}[5/7] Validating Docker Configuration...${NC}"
echo ""

cd "$DEPLOYMENT_DIR"

# Validate docker-compose.yml syntax
if [ -n "$DOCKER_COMPOSE_CMD" ]; then
    if $DOCKER_COMPOSE_CMD config > /dev/null 2>&1; then
        print_status 0 "docker-compose.yml syntax is valid"
    else
        print_status 1 "docker-compose.yml syntax is invalid"
        $DOCKER_COMPOSE_CMD config 2>&1 | head -10
    fi
else
    print_status 1 "Cannot validate docker-compose.yml - Docker Compose not available"
fi

# Check for required services
if grep -q "postgres:" docker-compose.yml; then
    print_status 0 "PostgreSQL service configured"
else
    print_status 1 "PostgreSQL service not found"
fi

if grep -q "app:" docker-compose.yml; then
    print_status 0 "Application service configured"
else
    print_status 1 "Application service not found"
fi

if grep -q "nginx:" docker-compose.yml; then
    print_status 0 "Nginx service configured"
else
    print_status 1 "Nginx service not found"
fi

echo ""

# ============================================
# Step 6: Test Docker Build (Optional)
# ============================================
echo -e "${CYAN}[6/7] Docker Build Test${NC}"
echo ""

read -p "Do you want to test the Docker build? This may take 5-10 minutes. (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Testing Docker build...${NC}"
    
    # Create temporary .env for build
    if [ ! -f .env ]; then
        echo "Creating temporary .env file..."
        cp .env.example .env
        # Set minimal required vars
        sed -i 's/your_secure_password_here/test_password_123/g' .env
        sed -i 's/your_secure_secret_here/test_secret_123456789/g' .env
        TEMP_ENV_CREATED=true
    fi
    
    cd "$DEPLOYMENT_DIR"
    
    # Enable pipefail to capture build failures correctly
    set +e  # Temporarily disable exit on error
    set -o pipefail
    
    if docker compose build app 2>&1 | tee /tmp/docker-build.log; then
        BUILD_EXIT=$?
    else
        BUILD_EXIT=$?
    fi
    
    set +o pipefail
    set -e  # Re-enable exit on error
    
    if [ $BUILD_EXIT -eq 0 ]; then
        print_status 0 "Docker build successful"
    else
        print_status 1 "Docker build failed"
        echo -e "${YELLOW}Build log saved to: /tmp/docker-build.log${NC}"
    fi
    
    # Clean up temporary .env if we created it
    if [ "$TEMP_ENV_CREATED" = true ]; then
        rm -f .env
        echo "Cleaned up temporary .env file"
    fi
else
    echo -e "${YELLOW}Skipping Docker build test${NC}"
fi

echo ""

# ============================================
# Step 7: Generate Deployment Summary
# ============================================
echo -e "${CYAN}[7/7] Generating Deployment Summary...${NC}"
echo ""

# Create deployment summary file
SUMMARY_FILE="$SCRIPT_DIR/DEPLOYMENT_SUMMARY.md"

cat > "$SUMMARY_FILE" << EOF
# CortexBuild Pro - Deployment Summary

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Branch:** $CURRENT_BRANCH

## Validation Results

EOF

if [ "$ALL_CHECKS_PASSED" = true ]; then
    cat >> "$SUMMARY_FILE" << EOF
✅ **ALL CHECKS PASSED** - Ready for deployment

EOF
else
    cat >> "$SUMMARY_FILE" << EOF
⚠️ **SOME CHECKS FAILED** - Review issues before deployment

EOF
fi

cat >> "$SUMMARY_FILE" << EOF
## Quick Deployment Steps

### On Your VPS Server:

\`\`\`bash
# 1. SSH into your VPS
ssh root@YOUR_VPS_IP

# 2. Install prerequisites (if not already installed)
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin git

# 3. Clone the repository
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro
git checkout $CURRENT_BRANCH

# 4. Configure environment
cd deployment
cp .env.example .env
nano .env  # Edit with your configuration

# 5. Deploy
docker compose up -d

# 6. Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# 7. (Optional) Seed database
docker compose exec app sh -c "cd /app && npx prisma db seed"
\`\`\`

### Access Application

- **HTTP:** http://YOUR_VPS_IP:3000
- **Admin Console:** http://YOUR_VPS_IP:3000/admin
- **API Health:** http://YOUR_VPS_IP:3000/api/auth/providers

### Required Environment Variables

Set these in \`deployment/.env\`:

- \`POSTGRES_PASSWORD\` - Strong database password
- \`NEXTAUTH_SECRET\` - Generate with: \`openssl rand -base64 32\`
- \`NEXTAUTH_URL\` - Your domain URL (e.g., https://yourdomain.com)
- \`AWS_*\` - AWS S3 credentials (if using file uploads)
- \`SENDGRID_API_KEY\` - Email service API key (if using email)

### Post-Deployment

1. **Setup SSL** (recommended):
   \`\`\`bash
   cd deployment
   ./setup-ssl.sh yourdomain.com admin@yourdomain.com
   \`\`\`

2. **Setup Automated Backups**:
   \`\`\`bash
   # Add to crontab
   crontab -e
   # Add: 0 2 * * * cd /var/www/cortexbuild-pro/deployment && ./backup.sh
   \`\`\`

3. **Monitor Services**:
   \`\`\`bash
   # View logs
   docker compose logs -f
   
   # Check service status
   docker compose ps
   
   # Restart if needed
   docker compose restart app
   \`\`\`

## Additional Resources

- **Full Deployment Guide:** VPS_DEPLOYMENT_INSTRUCTIONS.md
- **Production Checklist:** PRODUCTION_DEPLOYMENT_CHECKLIST.md
- **Troubleshooting:** TROUBLESHOOTING.md
- **API Documentation:** API_ENDPOINTS.md

## Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Configure firewall (ufw)
- [ ] Enable SSL/TLS certificates
- [ ] Setup automated backups
- [ ] Configure log rotation
- [ ] Restrict SSH access
- [ ] Enable fail2ban
- [ ] Review security settings

## Support

For issues or questions, see TROUBLESHOOTING.md or check the documentation.
EOF

print_status 0 "Deployment summary generated"
echo -e "  Summary saved to: ${CYAN}$SUMMARY_FILE${NC}"

echo ""

# ============================================
# Final Summary
# ============================================
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║        ✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT       ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
else
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}║      ⚠️  SOME CHECKS FAILED - REVIEW BEFORE DEPLOY      ║${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
fi

echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo ""

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo "1. Review deployment summary: cat DEPLOYMENT_SUMMARY.md"
    echo "2. Prepare your VPS server (ensure Docker is installed)"
    echo "3. Clone this repository on your VPS"
    echo "4. Configure environment variables in deployment/.env"
    echo "5. Run: cd deployment && docker compose up -d"
    echo "6. Run migrations: docker compose exec app sh -c 'cd /app && npx prisma migrate deploy'"
else
    echo "1. Fix the issues identified above"
    echo "2. Re-run this script to verify all checks pass"
    echo "3. Review deployment documentation"
fi

echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo ""
echo "View deployment summary:  cat DEPLOYMENT_SUMMARY.md"
echo "Test deployment locally:  cd deployment && docker compose up"
echo "View logs:                cd deployment && docker compose logs -f"
echo "Stop services:            cd deployment && docker compose down"
echo ""

if [ "$ALL_CHECKS_PASSED" = true ]; then
    exit 0
else
    exit 1
fi
