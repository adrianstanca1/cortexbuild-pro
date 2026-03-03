#!/bin/bash
# OAuth Test and Fix Script

echo "🔍 Checking OAuth Configuration..."
echo "================================="

# Get current deployment URL
CURRENT_URL=$(vercel --prod 2>/dev/null | grep -E "https://final-.*\.vercel\.app" | tail -1 | grep -oE "https://[^[:space:]]+")

if [ -z "$CURRENT_URL" ]; then
    CURRENT_URL="https://final-1j1ze0sc0-adrian-b7e84541.vercel.app"
fi

REDIRECT_URI="$CURRENT_URL/auth/google/callback"

echo "✅ Current deployment: $CURRENT_URL"
echo "🔄 Required redirect URI: $REDIRECT_URI"
echo ""

echo "🚨 URGENT ACTION REQUIRED:"
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Navigate to APIs & Services → Credentials"
echo "3. Find OAuth 2.0 Client: 747468230889-nmpf6edq6r3j78oc9abkceojssb9iue4.apps.googleusercontent.com"
echo "4. ADD this redirect URI:"
echo "   $REDIRECT_URI"
echo ""

echo "💡 Quick Test:"
echo "   Visit: $CURRENT_URL"
echo "   Click 'Continue with Google'"
echo "   Should redirect to Google (not error)"
echo ""

echo "⚡ Auto-Update Environment:"
read -p "Press Enter to update Vercel environment with current URL..."

# Update Vercel environment
echo "$REDIRECT_URI" | vercel env add VITE_GOOGLE_REDIRECT_URI_AUTO production 2>/dev/null || echo "Environment variable already exists"

echo ""
echo "✅ Environment updated!"
echo "🔗 Test OAuth at: $CURRENT_URL"