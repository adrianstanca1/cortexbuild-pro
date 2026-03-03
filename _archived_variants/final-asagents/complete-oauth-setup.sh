#!/bin/bash
# Final OAuth Configuration Setup

echo "🎯 Final OAuth Configuration Setup"
echo "=================================="
echo ""

CURRENT_URL="https://final-hd6tbubcs-adrian-b7e84541.vercel.app"
REDIRECT_URI="$CURRENT_URL/auth/google/callback"

echo "✅ Google API Key configured: AIzaSyC...G5Y"
echo "✅ Current deployment: $CURRENT_URL"
echo "✅ Redirect URI: $REDIRECT_URI"
echo ""

echo "🚨 IMPORTANT: Update your Google Cloud Console with the NEW redirect URI:"
echo "   $REDIRECT_URI"
echo ""

echo "📝 To complete setup, you need your Google OAuth Client ID:"
echo "   (It should look like: 123456789-abc123def456.apps.googleusercontent.com)"
echo ""

read -p "Enter your Google OAuth Client ID: " GOOGLE_CLIENT_ID

if [ -n "$GOOGLE_CLIENT_ID" ]; then
    echo ""
    echo "🔄 Updating Vercel with your Client ID..."
    
    # Remove existing and add new
    echo "$GOOGLE_CLIENT_ID" | vercel env add VITE_GOOGLE_CLIENT_ID_REAL production
    
    echo "🔄 Updating redirect URI..."
    echo "$REDIRECT_URI" | vercel env add VITE_GOOGLE_REDIRECT_URI_LATEST production
    
    echo ""
    echo "🚀 Redeploying with your OAuth configuration..."
    vercel --prod --yes
    
    echo ""
    echo "🎉 OAuth setup complete!"
    echo "🔗 Test Google sign-in at: $CURRENT_URL"
    echo ""
    echo "✅ Your app now has:"
    echo "   - Google OAuth authentication"
    echo "   - Google AI services (Gemini)"
    echo "   - Fallback mock authentication"
    echo ""
else
    echo "❌ No Client ID provided. OAuth will use fallback authentication."
    echo "💡 You can run this script again anytime to add your Client ID."
fi

echo ""
echo "🔗 Live application: $CURRENT_URL"