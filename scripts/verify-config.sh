#!/bin/bash
# Quick verification script to check API keys and server configuration
# This script checks that all required environment variables are set

echo "🔍 CortexBuild Pro - Configuration Verification"
echo "================================================"
echo ""

# Track overall status
FAILED_CHECKS=0

# Function to check if a variable is set
check_var() {
    local var_name=$1
    local var_value=$2
    local required=$3
    
    # Validate parameters
    if [ -z "$var_name" ] || [ -z "$required" ]; then
        echo "⚠️  Invalid parameters to check_var function"
        return 1
    fi
    
    if [ -n "$var_value" ]; then
        echo "✅ $var_name: Configured"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo "❌ $var_name: NOT SET (REQUIRED)"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        else
            echo "⚠️  $var_name: Not set (optional)"
            return 0
        fi
    fi
}

# Check environment files exist
echo "📁 Checking Environment Files:"
echo "--------------------------------"
if [ -f "nextjs_space/.env" ]; then
    echo "✅ nextjs_space/.env exists"
else
    echo "❌ nextjs_space/.env NOT FOUND"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

if [ -f "deployment/.env" ]; then
    echo "✅ deployment/.env exists"
else
    echo "❌ deployment/.env NOT FOUND"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# Load environment variables from nextjs_space/.env
if [ -f "nextjs_space/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . nextjs_space/.env
    set +a
fi

# Check required variables
echo "🔑 Required API Keys & Servers:"
echo "--------------------------------"
check_var "DATABASE_URL" "$DATABASE_URL" "required"
check_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "required"
check_var "NEXTAUTH_URL" "$NEXTAUTH_URL" "required"
check_var "AWS_BUCKET_NAME" "$AWS_BUCKET_NAME" "required"
check_var "AWS_FOLDER_PREFIX" "$AWS_FOLDER_PREFIX" "required"
check_var "AWS_REGION" "$AWS_REGION" "required"
check_var "ABACUSAI_API_KEY" "$ABACUSAI_API_KEY" "required"
check_var "WEB_APP_ID" "$WEB_APP_ID" "required"
echo ""

# Check notification IDs
echo "🔔 Notification Configuration:"
echo "--------------------------------"
check_var "NOTIF_ID_MILESTONE_DEADLINE_REMINDER" "$NOTIF_ID_MILESTONE_DEADLINE_REMINDER" "required"
check_var "NOTIF_ID_TOOLBOX_TALK_COMPLETED" "$NOTIF_ID_TOOLBOX_TALK_COMPLETED" "required"
check_var "NOTIF_ID_MEWP_CHECK_COMPLETED" "$NOTIF_ID_MEWP_CHECK_COMPLETED" "required"
check_var "NOTIF_ID_TOOL_CHECK_COMPLETED" "$NOTIF_ID_TOOL_CHECK_COMPLETED" "required"
echo ""

# Check optional services
echo "🔧 Optional Services:"
echo "--------------------------------"
check_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" "optional"
check_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" "optional"
check_var "SENDGRID_API_KEY" "$SENDGRID_API_KEY" "optional"
check_var "SENDGRID_FROM_EMAIL" "$SENDGRID_FROM_EMAIL" "optional"
echo ""

# Check WebSocket configuration
echo "🌐 Real-time Communication:"
echo "--------------------------------"
check_var "NEXT_PUBLIC_WEBSOCKET_URL" "$NEXT_PUBLIC_WEBSOCKET_URL" "optional"
check_var "WEBSOCKET_PORT" "$WEBSOCKET_PORT" "optional"
echo ""

# Summary
echo "📊 Configuration Summary:"
echo "--------------------------------"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo "✅ All required API keys and servers are configured!"
else
    echo "❌ $FAILED_CHECKS required configuration(s) missing!"
    echo "   Please review the errors above and configure missing variables."
fi

echo ""
echo "✅ Core Services:"
echo "   - PostgreSQL Database"
echo "   - NextAuth Authentication"
echo "   - AWS S3 File Storage"
echo "   - AbacusAI API"
echo "   - Notification System"
echo ""
echo "⚠️  Optional Services (not configured):"
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "   - Google OAuth (optional)"
fi
if [ -z "$SENDGRID_API_KEY" ]; then
    echo "   - SendGrid Email (fallback to AbacusAI)"
fi
echo ""
echo "📚 Next Steps:"
echo "   1. Review docs/API_SETUP_GUIDE.md for detailed configuration"
echo "   2. Check CONFIGURATION_CHECKLIST.md for deployment checklist"
echo "   3. For development: cd nextjs_space && npm install && npm run dev"
echo "   4. For production: cd deployment && docker-compose up -d"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo "✨ Configuration verification complete!"
    exit 0
else
    echo "⚠️  Configuration has missing required variables!"
    exit 1
fi
