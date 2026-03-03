#!/bin/bash

# Cleanup script for duplicate files
echo "🧹 Starting duplicate file cleanup..."

# List of duplicate files to remove (after verification they're identical or outdated)
DUPLICATES_TO_REMOVE=(
    "API 2.md"
    ".firebaserc 2"
    "complete-oauth-setup 2.sh"
    "deploy 2.sh"
    "deploy-sftp 2.js"
    "deploy.config 2.js"
    "DEPLOYMENT 2.md"
    "docker-compose.dual 2.yml"
    "docker-compose.production 2.yml"
    "docker-compose.simple 2.yml"
    "docker-compose.sqlite 2.yml"
    "Dockerfile.frontend 2.production"
    "DUAL-BACKEND-ARCHITECTURE 2.md"
    "DUAL-BACKEND-IMPLEMENTATION 2.md"
    "ecosystem.config 2.js"
    "firebase 2.json"
    "IMPLEMENTATION_SUMMARY 2.md"
    "index-hybrid 2.html"
    "index-simple 2.html"
    "netlify 2.toml"
    "nginx 2.conf"
    "OAUTH_FIX_NOW 2.md"
    "OAUTH_SETUP 2.md"
    "OAUTH_SETUP_INSTRUCTIONS 2.md"
    "PRODUCTION_DEPLOYMENT_COMPLETE 2.md"
    "PRODUCTION_DEPLOYMENT_GUIDE 2.md"
    "PRODUCTION_DEPLOYMENT_SUCCESS 2.md"
    "PRODUCTION-DEPLOYMENT 2.md"
    "README_OLD 2.md"
    "SECURITY_AUTH 2.md"
    "setup-oauth 2.sh"
    "setup-vercel-env 2.sh"
    "staticwebapp.config 2.json"
    "test-oauth 2.sh"
    "tsconfig.build 2.json"
)

# Environment files to handle separately (can't read them directly)
ENV_DUPLICATES=(
    ".env 2.development"
    ".env 2.example"
    ".env 2.production"
    ".env 2.webspace"
)

echo "📋 Found ${#DUPLICATES_TO_REMOVE[@]} duplicate files to remove"
echo "🔐 Found ${#ENV_DUPLICATES[@]} environment duplicate files to handle"

# Function to safely remove a file
remove_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "🗑️  Removing: $file"
        rm "$file"
    else
        echo "⚠️  File not found: $file"
    fi
}

# Remove duplicate files
for file in "${DUPLICATES_TO_REMOVE[@]}"; do
    remove_file "$file"
done

# Handle environment files separately
echo ""
echo "🔐 Environment files found (manual review needed):"
for file in "${ENV_DUPLICATES[@]}"; do
    if [ -f "$file" ]; then
        echo "   - $file"
    fi
done

echo ""
echo "✅ Duplicate cleanup completed!"
echo "📝 Next steps:"
echo "   1. Review environment duplicate files manually"
echo "   2. Check backup files (.backup extension)"
echo "   3. Integrate AI services"
echo "   4. Test deployment configurations"
