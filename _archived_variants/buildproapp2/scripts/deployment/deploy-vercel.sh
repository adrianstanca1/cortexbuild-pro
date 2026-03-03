#!/bin/bash

# Fresh Vercel Deployment Setup
# This script will link and deploy the BuildPro app to Vercel

set -e

echo "🚀 BuildPro - Fresh Vercel Deployment"
echo "======================================"
echo ""

# Check if token is set
TOKEN="${VERCEL_TOKEN:-VjyUJtH2JjAeudJsz3gCbWgB}"

# Verify authentication
echo "✓ Verifying Vercel authentication..."
VERCEL_USER=$(VERCEL_TOKEN="$TOKEN" npx vercel whoami 2>&1 | tail -n 1)
if [ $? -eq 0 ]; then
    echo "✓ Authenticated as: $VERCEL_USER"
else
    echo "❌ Authentication failed."
    exit 1
fi

echo ""
echo "📋 Project Configuration:"
echo "   Name: buildpro-app"
echo "   Framework: Vite (React + TypeScript)"
echo "   Build Command: npm run build"
echo "   Output Directory: dist"
echo ""

# Deploy (this will auto-create project if needed)
echo "🚀 Deploying to Vercel..."
echo ""

VERCEL_TOKEN="$TOKEN" npx vercel \
  --prod \
  --yes \
  --name buildpro-app

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  - View your deployment in the Vercel dashboard"
echo "  - Configure custom domain if needed"
echo "  - Set up environment variables via: vercel env add"
