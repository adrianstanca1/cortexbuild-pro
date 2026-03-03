#!/bin/bash
# Quick Vercel environment setup for Google OAuth

echo "🚀 Setting up Vercel environment variables for Google OAuth..."

# You'll need to replace 'YOUR_ACTUAL_CLIENT_ID_HERE' with your real Google Client ID
GOOGLE_CLIENT_ID="${1:-YOUR_ACTUAL_CLIENT_ID_HERE}"
REDIRECT_URI="https://final-izv4o3hy4-adrian-b7e84541.vercel.app/auth/google/callback"

if [ "$GOOGLE_CLIENT_ID" = "YOUR_ACTUAL_CLIENT_ID_HERE" ]; then
    echo "❌ Please provide your Google Client ID as an argument:"
    echo "   ./setup-vercel-env.sh YOUR_GOOGLE_CLIENT_ID"
    echo ""
    echo "💡 Or run these commands manually:"
    echo "   echo '$GOOGLE_CLIENT_ID' | vercel env add VITE_GOOGLE_CLIENT_ID production"
    echo "   echo '$REDIRECT_URI' | vercel env add VITE_GOOGLE_REDIRECT_URI production"
    exit 1
fi

echo "Setting VITE_GOOGLE_CLIENT_ID..."
echo "$GOOGLE_CLIENT_ID" | vercel env add VITE_GOOGLE_CLIENT_ID production

echo "Setting VITE_GOOGLE_REDIRECT_URI..."
echo "$REDIRECT_URI" | vercel env add VITE_GOOGLE_REDIRECT_URI production

echo "✅ Environment variables set! Now redeploying..."
vercel --prod --yes

echo "🎉 OAuth setup complete! Your app should now support Google sign-in."