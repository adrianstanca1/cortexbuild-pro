#!/bin/bash

# Backend Deployment Script for Hostinger (api.cortexbuildpro.com)

set -e

echo "🚀 Starting Backend Deployment..."

# Configuration
FTP_HOST="82.29.191.97"
FTP_USER="u875310796"
REMOTE_ROOT="/home/u875310796/domains/cortexbuildpro.com/public_html/api" 
# NOTE: Ideally this should be outside public_html, but for simple setup in shared hosting 'api' folder is common.
# If user created 'api.cortexbuildpro.com' subdomain pointing to specific folder, we upload there.
# Let's assume standard subdomain mapping: domains/cortexbuildpro.com/public_html/api OR separate folder.
# Default Hostinger behavior: subdomain 'api' -> domains/cortexbuildpro.com/public_html/api
# We will verify this path.

LOCAL_SERVER="./server"

# 1. Build Backend
echo "🔨 Building Backend..."
cd $LOCAL_SERVER
npm install
npm run build
cd ..

# 2. Upload
echo "📤 Uploading Backend Files..."

# Create remote directory structure first (ignore errors if exists)
echo "Ensuring remote directory structure..."

# Hostinger default SSH port is often 65002 for shared hosting, 22 for VPS.
# If 22 times out, try 65002.
SSH_PORT="65002"

sftp -o StrictHostKeyChecking=no -i ./hostinger_key -P $SSH_PORT $FTP_USER@$FTP_HOST <<EOF
mkdir domains
mkdir domains/cortexbuildpro.com
mkdir domains/cortexbuildpro.com/public_html
mkdir domains/cortexbuildpro.com/public_html/api
mkdir domains/cortexbuildpro.com/public_html/api/dist
bye
EOF

# Upload files
echo "Uploading files..."
sftp -o StrictHostKeyChecking=no -i ./hostinger_key -P $SSH_PORT $FTP_USER@$FTP_HOST <<EOF
cd $REMOTE_ROOT
put $LOCAL_SERVER/package.json
put $LOCAL_SERVER/package-lock.json
put $LOCAL_SERVER/.env
put $LOCAL_SERVER/.htaccess
cd dist
put -r $LOCAL_SERVER/dist/*
bye
EOF


echo "✅ Upload Complete."
echo "⚠️  NOTE: You must now log in to Hostinger hPanel -> Websites -> Node.js"
echo "    1. Select folder '$REMOTE_ROOT'"
echo "    2. Install dependencies (NPM Install)"
echo "    3. Start the application"
