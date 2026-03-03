#!/bin/bash

# Hostinger FTP Deployment Script for cortexbuildpro.com
# Uses FTP instead of SFTP for Hostinger compatibility

set -e

echo "🚀 Starting FTP deployment to cortexbuildpro.com..."

# Configuration
FTP_HOST="82.29.191.97"
FTP_USER="u875310796"
FTP_PASS=""  # Will be prompted
REMOTE_PATH="/domains/cortexbuildpro.com/public_html"
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



# Configuration
# Hostinger Shared Hosting often uses port 65002 for SSH/SFTP. 
# If 22 times out, try 65002.
FTP_PORT="65002" 

# Upload files using sftp
echo "📤 Uploading files using sftp..."

# Batch commands for sftp
sftp -o StrictHostKeyChecking=no -i ./hostinger_key -P $FTP_PORT $FTP_USER@$FTP_HOST <<EOF
cd domains/cortexbuildpro.com/public_html
put -r $LOCAL_DIST/* .
bye
EOF

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your site is now live at:"
    echo "   https://cortexbuildpro.com"
    echo "   https://www.cortexbuildpro.com"
else
    echo "❌ Deployment failed! (Check if Port 22 is correct, Hostinger often uses 65002)"
    exit 1
fi
