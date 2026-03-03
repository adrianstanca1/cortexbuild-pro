#!/bin/bash

# Hostinger Deployment Script for cortexbuildpro.com
# This script uploads the production build to Hostinger via SFTP

set -e

echo "🚀 Starting deployment to cortexbuildpro.com..."

# Configuration
REMOTE_USER="u875310796"
REMOTE_HOST="82.29.191.97"
REMOTE_PORT="65002"
REMOTE_PATH="/home/u875310796/domains/cortexbuildpro.com/public_html"
LOCAL_DIST="./dist"

# Check if dist folder exists
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ Error: dist folder not found. Please run 'npm run build' first."
    exit 1
fi

echo "📦 Preparing files for upload..."

# Create .htaccess for SPA routing
cat > dist/.htaccess << 'EOF'
# Enable Rewrite Engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Force HTTPS redirect
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # Exclude API from SPA routing
  RewriteCond %{REQUEST_URI} ^/api [NC]
  RewriteRule ^api - [L]

  # SPA routing - redirect all requests to index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/wasm "access plus 1 year"
</IfModule>
EOF

echo "✅ Created .htaccess file"

# Upload files using SFTP
echo "📤 Uploading files to Hostinger..."

sftp -P $REMOTE_PORT -i ./hostinger_key -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST << SFTP_COMMANDS
cd $REMOTE_PATH
put -r $LOCAL_DIST/*
bye
SFTP_COMMANDS

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your site is now live at:"
    echo "   https://cortexbuildpro.com"
    echo "   https://www.cortexbuildpro.com"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Verify the site loads correctly"
    echo "   2. Test authentication with backend"
    echo "   3. Check SSL certificate (may take a few minutes)"
else
    echo "❌ Deployment failed!"
    exit 1
fi
