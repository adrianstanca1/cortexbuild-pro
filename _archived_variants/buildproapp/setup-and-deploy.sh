#!/bin/bash

# Complete Vercel setup and deployment

# Unset NODE_OPTIONS to avoid debugger issues
unset NODE_OPTIONS

echo "╔═══════════════════════════════════════════════════╗"
echo "║   BuildPro - Complete Vercel Setup & Deploy       ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

set -e  # Exit on error

# Step 1: Install Vercel CLI
echo "1️⃣  Installing Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "Installing globally..."
    NODE_OPTIONS="" npm install -g vercel 2>/dev/null || {
        echo "⚠️  Global install failed. Using npx instead."
        VERCEL_CMD="npx vercel"
    }

    # Check if install succeeded
    if command -v vercel &> /dev/null; then
        echo "✅ Vercel CLI installed"
        VERCEL_CMD="vercel"
    fi
else
    echo "✅ Vercel CLI already installed"
    VERCEL_CMD="vercel"
fi

# Step 2: Commit changes
echo ""
echo "2️⃣  Committing changes..."
git add -A

if git diff --cached --quiet; then
    echo "✅ No changes to commit"
else
    git commit -m "fix: Resolve Vercel deployment issues

- Add missing TypeScript type definitions
- Update vite.config.ts with env variable handling
- Improve build configuration with code splitting
- Update vercel.json with explicit install command
- Add deployment documentation and scripts

Ready for successful Vercel deployment" || echo "⚠️  Commit failed or nothing to commit"
fi

# Step 3: Push to GitHub
echo ""
echo "3️⃣  Pushing to GitHub..."
git push origin main || echo "⚠️  Push failed or already up to date"

# Step 4: Check for .env configuration
echo ""
echo "4️⃣  Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ Local .env found"
else
    echo "⚠️  No .env file found"
    echo "   This is okay for Vercel - set variables in dashboard"
fi

# Step 5: Deploy
echo ""
echo "5️⃣  Deploying to Vercel..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

$VERCEL_CMD --prod

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Deployment process complete!"
echo ""
echo "⚙️  IMPORTANT: Set environment variables in Vercel Dashboard"
echo "   → https://vercel.com/team_8JqgaFIWWp8b31jzxViPkHR2/buildproapp/settings/environment-variables"
echo ""
echo "   Required variables:"
echo "   • VITE_API_KEY (Your Gemini API key)"
echo "   • VITE_API_URL (Your backend API URL)"
echo ""
echo "   Then redeploy from the dashboard!"
echo ""
