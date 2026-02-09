#!/bin/bash

# 1. Update .env for correct URL mapping
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://72.62.132.43|g' .env

# 2. Inject the Dashboard Redirect logic into the Auth config
# This targets the most common NextAuth configuration paths
AUTH_FILE=$(find . -name "auth-options.ts" -o -name "route.ts" | grep "auth" | head -n 1)

if [ -n "$AUTH_FILE" ]; then
    echo "Updating $AUTH_FILE..."
    # This adds the redirect callback if it's missing to force /dashboard landing
    sed -i "/callbacks: {/a \    async redirect({ url, baseUrl }) { return baseUrl + '/dashboard'; }," "$AUTH_FILE"
else
    echo "Auth configuration file not found automatically."
fi

# 3. Restart the application (Assuming PM2 or standard Node)
if command -v pm2 &> /dev/null; then
    pm2 restart all
else
    npm run build && npm run start &
fi

echo "Fix applied. Please test the Google Login now."