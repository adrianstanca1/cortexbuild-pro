#!/bin/bash
# Deployment script using curl for FTP upload

FTP_USER="u875310796"
FTP_PASS="Cumparavinde1@"
FTP_HOST="82.29.191.97"
FRONTEND_PATH="domains/cortexbuildpro.com/public_html"
BACKEND_PATH="domains/cortexbuildpro.com/api"

echo "🎨 Uploading Frontend..."
find dist -type f | while read file; do
    rel_path=${file#dist/}
    echo "Uploading $rel_path..."
    curl -u "$FTP_USER:$FTP_PASS" --ftp-create-dirs -T "$file" "ftp://$FTP_HOST/$FRONTEND_PATH/$rel_path" --silent
done

echo "⚙️ Uploading Backend..."
# Upload package.json and .env.hostinger
curl -u "$FTP_USER:$FTP_PASS" --ftp-create-dirs -T server/package.json "ftp://$FTP_HOST/$BACKEND_PATH/package.json" --silent
curl -u "$FTP_USER:$FTP_PASS" --ftp-create-dirs -T server/.env.hostinger "ftp://$FTP_HOST/$BACKEND_PATH/.env" --silent

# Upload dist folder of server
find server/dist -type f | while read file; do
    rel_path=${file#server/dist/}
    echo "Uploading backend/$rel_path..."
    curl -u "$FTP_USER:$FTP_PASS" --ftp-create-dirs -T "$file" "ftp://$FTP_HOST/$BACKEND_PATH/dist/$rel_path" --silent
done

echo "✅ Deployment Complete!"
