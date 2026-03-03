#!/bin/bash
# Google OAuth Setup Automation Script for ASAgents Platform

echo "🔐 Setting up Google OAuth for ASAgents Platform"
echo "=================================================="
echo ""

# Get the latest Vercel deployment URL
echo "📡 Getting current Vercel deployment URL..."
CURRENT_URL=$(vercel --prod 2>/dev/null | grep -E "https://final-.*\.vercel\.app" | tail -1)

if [ -z "$CURRENT_URL" ]; then
    CURRENT_URL="https://final-3bvex7393-adrian-b7e84541.vercel.app"
    echo "⚠️  Using fallback URL: $CURRENT_URL"
else
    echo "✅ Current deployment: $CURRENT_URL"
fi

# Set up redirect URI
REDIRECT_URI="$CURRENT_URL/auth/google/callback"
echo "🔄 Redirect URI will be: $REDIRECT_URI"

echo ""
echo "🚨 IMPORTANT: You need to complete these steps manually:"
echo ""
echo "1️⃣  Go to Google Cloud Console: https://console.cloud.google.com/"
echo "2️⃣  Select your project or create a new one"
echo "3️⃣  Go to 'APIs & Services' → 'Credentials'"
echo "4️⃣  Click 'Create Credentials' → 'OAuth 2.0 Client IDs'"
echo "5️⃣  Select 'Web application'"
echo "6️⃣  Add this EXACT redirect URI:"
echo "    $REDIRECT_URI"
echo "7️⃣  Copy the Client ID (looks like: 123456-abc123.apps.googleusercontent.com)"
echo ""
echo "🔧 Then run this command with your actual Client ID:"
echo "vercel env add VITE_GOOGLE_CLIENT_ID"
echo ""
echo "📝 Or manually add these environment variables in Vercel dashboard:"
echo "VITE_GOOGLE_CLIENT_ID = your-actual-client-id"
echo "VITE_GOOGLE_REDIRECT_URI = $REDIRECT_URI"
echo ""

# Set up local environment for testing
echo "🏠 Setting up local development environment..."
cat > .env.local << EOF
# Local Development OAuth Configuration
VITE_GOOGLE_CLIENT_ID=demo-client-id-for-local-testing
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
VITE_ALLOW_MOCK_FALLBACK=true
EOF

echo "✅ Created .env.local for development"
echo ""
echo "🎯 Next steps:"
echo "1. Complete Google Cloud Console setup above"
echo "2. Add the Client ID to Vercel environment variables"
echo "3. Test with: npm run dev (local) or visit $CURRENT_URL (production)"
echo ""
echo "💡 Tip: If you skip OAuth setup, the app will use mock authentication automatically!"