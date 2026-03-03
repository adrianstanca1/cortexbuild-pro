#!/bin/bash
# Interactive FTP Upload Script for cortexbuildpro.com
# Uploads the dist/ folder to Hostinger

set -e

echo "🚀 Uploading to cortexbuildpro.com..."
echo ""

# Configuration
FTP_HOST="82.29.191.97"
FTP_USER="u875310796"
REMOTE_PATH="/domains/cortexbuildpro.com/public_html"
LOCAL_DIST="./dist"

# Check if dist folder exists
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ Error: dist folder not found!"
    exit 1
fi

# Prompt for password
read -sp "🔐 Enter FTP password for $FTP_USER: " FTP_PASS
echo ""

# Count files
FILE_COUNT=$(find $LOCAL_DIST -type f | wc -l | tr -d ' ')
echo "📦 Uploading $FILE_COUNT files..."
echo ""

# Create FTP command file
cat > /tmp/ftp_commands.txt << EOF
user $FTP_USER $FTP_PASS
binary
cd $REMOTE_PATH
lcd $LOCAL_DIST
prompt
mput *
bye
EOF

# Execute FTP upload
ftp -n $FTP_HOST < /tmp/ftp_commands.txt

# Clean up
rm /tmp/ftp_commands.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload complete!"
    echo ""
    echo "🌐 Your site is now live at:"
    echo "   https://cortexbuildpro.com"
    echo "   https://www.cortexbuildpro.com"
else
    echo "❌ Upload failed. Please check credentials and try again."
    exit 1
fi
