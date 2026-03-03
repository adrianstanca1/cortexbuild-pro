#!/bin/bash
# FTP Deployment Script for Hostinger
# Using provided FTP credentials

set -e

echo "🚀 FTP Deployment to cortexbuildpro.com"
echo "========================================"

# Configuration
FTP_HOST="82.29.191.97"
FTP_USER="u875310796"
FTP_PATH="public_html"

# Check if dist folder exists
if [ ! -d "./dist" ]; then
    echo "❌ Error: dist folder not found. Running build..."
    npm run build
fi

echo ""
echo "📦 Preparing files for FTP upload..."

# Create .htaccess for SPA routing
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # SPA routing - redirect all requests to index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

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

echo "✅ .htaccess created"
echo ""
echo "📤 Uploading files via FTP..."
echo "This will prompt for your FTP password"
echo ""

# Using lftp for better FTP handling (install with: brew install lftp)
if command -v lftp &> /dev/null; then
    echo "Using lftp for upload..."
    lftp -u $FTP_USER ftp://$FTP_HOST <<EOF
cd $FTP_PATH
mirror --reverse --delete --verbose ./dist ./
bye
EOF
else
    # Fallback to ftp command (less reliable)
    echo "lftp not found. Using basic ftp (slower)..."
    echo "Consider installing lftp: brew install lftp"
    
    ftp -n $FTP_HOST <<EOF
user $FTP_USER
cd $FTP_PATH
lcd dist
prompt
mput *
bye
EOF
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Frontend Deployment Complete!"
    echo ""
    echo "🌐 Your site should now be live at:"
    echo "   https://cortexbuildpro.com"
    echo "   https://www.cortexbuildpro.com"
    echo ""
    echo "📝 Important: Clear browser cache and test:"
    echo "   1. Visit https://cortexbuildpro.com"
    echo "   2. Press Cmd+Shift+R (Mac) to hard refresh"
    echo "   3. Verify new AI-focused homepage loads"
    echo "   4. Test login functionality"
    echo ""
else
    echo "❌ Deployment failed!"
    echo "Please check your FTP credentials and try again"
    exit 1
fi
