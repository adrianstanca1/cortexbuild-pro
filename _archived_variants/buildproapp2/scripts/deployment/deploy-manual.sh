#!/bin/bash

# Manual Hostinger Deployment Instructions
# SSH Connection: ssh -p 65002 u875310796@82.29.191.97

set -e

echo "🚀 Hostinger Manual Deployment Guide"
echo "===================================="
echo ""

# Check if dist exists
if [ ! -d "./dist" ]; then
    echo "❌ Error: dist folder not found. Running build..."
    npm run build
fi

echo "📦 Build complete! Now follow these steps:"
echo ""
echo "OPTION 1: Using SCP (Secure Copy)"
echo "-----------------------------------"
echo "1. Upload frontend files:"
echo "   scp -P 65002 -r ./dist/* u875310796@82.29.191.97:/home/u875310796/domains/cortexbuildpro.com/public_html/"
echo ""
echo "2. Upload .htaccess file:"
echo "   scp -P 65002 ./dist/.htaccess u875310796@82.29.191.97:/home/u875310796/domains/cortexbuildpro.com/public_html/"
echo ""
echo "OPTION 2: Using Hostinger File Manager"
echo "---------------------------------------"
echo "1. Log in to Hostinger hPanel (https://hpanel.hostinger.com)"
echo "2. Go to File Manager"
echo "3. Navigate to /domains/cortexbuildpro.com/public_html/"
echo "4. Delete all existing files in public_html"
echo "5. Upload all files from your local ./dist folder"
echo "6. Verify .htaccess file is present"
echo ""
echo "OPTION 3: Interactive SSH"
echo "-------------------------"
echo "Run: ssh -p 65002 u875310796@82.29.191.97"
echo "Then manually upload files using your preferred method"
echo ""
echo "📊 File count in dist/:"
ls -1 ./dist | wc -l
echo ""
echo "Total size:"
du -h ./dist | tail -1
