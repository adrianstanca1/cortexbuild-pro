#!/bin/bash
# Script to install SSH key on Hostinger
# Usage: ./setup-hostinger-ssh.sh

FTP_HOST="82.29.191.97"
FTP_USER="u875310796"
FTP_PORT="65002"

echo "🔐 Installing SSH Key to Hostinger..."
echo "This will require your password one last time!"

# 1. Ensure .ssh directory exists
echo "📁 Checking .ssh directory..."
# We use a trick with grep to check, ignoring failure if it exists
ssh -o StrictHostKeyChecking=no -p $FTP_PORT $FTP_USER@$FTP_HOST "mkdir -p .ssh && chmod 700 .ssh"

# 2. Append public key to authorized_keys
echo "📤 Uploading public key..."
cat ./hostinger_key.pub | ssh -o StrictHostKeyChecking=no -p $FTP_PORT $FTP_USER@$FTP_HOST "cat >> .ssh/authorized_keys && chmod 600 .ssh/authorized_keys"

if [ $? -eq 0 ]; then
    echo "✅ SSH Key Installed successfully!"
    echo "You can now deploy without a password."
else
    echo "❌ Failed to install SSH key."
fi
