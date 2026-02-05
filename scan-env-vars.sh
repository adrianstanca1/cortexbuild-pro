#!/bin/bash

# ============================================
# CortexBuild Pro - Environment Variables Scanner
# ============================================
# This script scans the codebase to identify all environment variables
# and helps you understand which ones you need to configure
# 
# Usage:
#   ./scan-env-vars.sh
# 
# Output:
#   - List of all environment variables used in the codebase
#   - Their locations in the code
#   - Whether they are required or optional
# ============================================

set -e

echo "🔍 CortexBuild Pro - Environment Variables Scanner"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if variable exists in .env
check_env_var() {
    local var_name=$1
    local env_file=$2
    
    if [ -f "$env_file" ]; then
        if grep -q "^${var_name}=" "$env_file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
    else
        echo -e "${YELLOW}?${NC}"
    fi
}

# Find all environment variables in the codebase
echo "📋 Scanning codebase for environment variables..."
echo ""

# Extract unique environment variable names
ENV_VARS=$(grep -rh "process\.env\." nextjs_space/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | \
    grep -oP "process\.env\.\K[A-Z_]+" | \
    sort -u)

# Required variables (core functionality)
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "AWS_REGION"
    "AWS_BUCKET_NAME"
    "ABACUSAI_API_KEY"
)

# Optional variables (enhanced features)
OPTIONAL_VARS=(
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "SENDGRID_API_KEY"
    "SENDGRID_FROM_EMAIL"
    "SENDGRID_FROM_NAME"
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_USER"
    "SMTP_PASSWORD"
    "EMAIL_FROM"
    "NEXT_PUBLIC_WEBSOCKET_URL"
    "WEBSOCKET_PORT"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_PROFILE"
    "AWS_FOLDER_PREFIX"
    "WEB_APP_ID"
)

# Check development environment
DEV_ENV="nextjs_space/.env"
PROD_ENV="deployment/.env"

echo "🔴 REQUIRED Environment Variables (must be set)"
echo "================================================"
echo ""
printf "%-40s %-10s %-10s\n" "Variable Name" "Dev" "Prod"
printf "%-40s %-10s %-10s\n" "----------------------------------------" "----------" "----------"

for var in "${REQUIRED_VARS[@]}"; do
    dev_status=$(check_env_var "$var" "$DEV_ENV")
    prod_status=$(check_env_var "$var" "$PROD_ENV")
    printf "%-40s %-10s %-10s\n" "$var" "$dev_status" "$prod_status"
done

echo ""
echo "🟡 OPTIONAL Environment Variables (enhanced features)"
echo "===================================================="
echo ""
printf "%-40s %-10s %-10s\n" "Variable Name" "Dev" "Prod"
printf "%-40s %-10s %-10s\n" "----------------------------------------" "----------" "----------"

for var in "${OPTIONAL_VARS[@]}"; do
    dev_status=$(check_env_var "$var" "$DEV_ENV")
    prod_status=$(check_env_var "$var" "$PROD_ENV")
    printf "%-40s %-10s %-10s\n" "$var" "$dev_status" "$prod_status"
done

echo ""
echo "📊 Summary"
echo "=========="
echo ""

# Count required variables in dev
DEV_REQUIRED_COUNT=0
for var in "${REQUIRED_VARS[@]}"; do
    if [ -f "$DEV_ENV" ] && grep -q "^${var}=" "$DEV_ENV" 2>/dev/null; then
        ((DEV_REQUIRED_COUNT++))
    fi
done

# Count required variables in prod
PROD_REQUIRED_COUNT=0
for var in "${REQUIRED_VARS[@]}"; do
    if [ -f "$PROD_ENV" ] && grep -q "^${var}=" "$PROD_ENV" 2>/dev/null; then
        ((PROD_REQUIRED_COUNT++))
    fi
done

TOTAL_REQUIRED=${#REQUIRED_VARS[@]}

echo "Development Environment ($DEV_ENV):"
echo "  Required variables: $DEV_REQUIRED_COUNT / $TOTAL_REQUIRED configured"

if [ $DEV_REQUIRED_COUNT -eq $TOTAL_REQUIRED ]; then
    echo -e "  Status: ${GREEN}✓ All required variables configured${NC}"
elif [ -f "$DEV_ENV" ]; then
    echo -e "  Status: ${YELLOW}⚠ Missing $((TOTAL_REQUIRED - DEV_REQUIRED_COUNT)) required variables${NC}"
else
    echo -e "  Status: ${RED}✗ Environment file not found${NC}"
    echo "  Action: Copy .env.example to .env and configure"
fi

echo ""
echo "Production Environment ($PROD_ENV):"
echo "  Required variables: $PROD_REQUIRED_COUNT / $TOTAL_REQUIRED configured"

if [ $PROD_REQUIRED_COUNT -eq $TOTAL_REQUIRED ]; then
    echo -e "  Status: ${GREEN}✓ All required variables configured${NC}"
elif [ -f "$PROD_ENV" ]; then
    echo -e "  Status: ${YELLOW}⚠ Missing $((TOTAL_REQUIRED - PROD_REQUIRED_COUNT)) required variables${NC}"
else
    echo -e "  Status: ${RED}✗ Environment file not found${NC}"
    echo "  Action: Copy .env.example to .env and configure"
fi

echo ""
echo "📚 Next Steps"
echo "============="
echo ""

if [ ! -f "$DEV_ENV" ]; then
    echo "1. Create development environment file:"
    echo "   cd nextjs_space"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
fi

if [ ! -f "$PROD_ENV" ]; then
    echo "2. Create production environment file:"
    echo "   cd deployment"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
fi

echo "3. Generate secure secrets:"
echo "   openssl rand -base64 32"
echo ""

echo "4. Read the complete setup guide:"
echo "   cat ENVIRONMENT_SETUP_GUIDE.md"
echo ""

echo "5. Configure GitHub secrets for CI/CD:"
echo "   cat GITHUB_SECRETS_GUIDE.md"
echo ""

echo "6. Verify configuration:"
echo "   cd nextjs_space"
echo "   npx tsx scripts/system-diagnostics.ts"
echo ""

echo "📖 Documentation"
echo "================"
echo ""
echo "  - ENVIRONMENT_SETUP_GUIDE.md    Complete environment setup guide"
echo "  - GITHUB_SECRETS_GUIDE.md       GitHub secrets configuration"
echo "  - .env.template                 Complete template with all variables"
echo "  - API_SETUP_GUIDE.md            API services configuration"
echo "  - SECURITY_CHECKLIST.md         Security best practices"
echo ""

echo "✨ For detailed information about each variable, see:"
echo "   ENVIRONMENT_SETUP_GUIDE.md"
echo ""

# Show all unique environment variables found in code
echo "📝 All Environment Variables Found in Code"
echo "==========================================="
echo ""
echo "The following environment variables are referenced in the codebase:"
echo ""
echo "$ENV_VARS" | sort | nl -w3 -s'. '
echo ""
echo "Total: $(echo "$ENV_VARS" | wc -l) unique environment variables"
echo ""

echo "🔒 Security Reminders"
echo "===================="
echo ""
echo "  ✓ Never commit .env files to Git"
echo "  ✓ Use different values for development and production"
echo "  ✓ Generate strong random secrets (32+ characters)"
echo "  ✓ Set file permissions: chmod 600 .env"
echo "  ✓ Rotate secrets every 90 days"
echo "  ✓ Store production secrets in GitHub Secrets for CI/CD"
echo ""

echo "=================================================="
echo "✅ Scan complete!"
echo ""
