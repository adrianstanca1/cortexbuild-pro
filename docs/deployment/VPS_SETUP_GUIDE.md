# VPS Environment Setup Guide

This guide explains how to securely configure environment variables on your VPS server.

## Server Information

- **VPS Host**: 72.62.132.43
- **VPS User**: deploy
- **Backend Path**: `/home/deploy/apps/cortexbuild/server/`
- **PM2 App Name**: cortexbuild-backend

## Prerequisites

1. SSH access to the VPS
2. PM2 installed globally
3. Node.js 18.x or higher installed

## Setup Instructions

### 1. Connect to VPS

```bash
ssh deploy@72.62.132.43
```

### 2. Navigate to Application Directory

```bash
cd /home/deploy/apps/cortexbuild/server
```

### 3. Create Environment File

Create a `.env` file with secure credentials:

```bash
nano .env
```

Add the following content (replace with your actual values):

```bash
# Server Configuration
PORT=8080
NODE_ENV=production

# Database Configuration
DATABASE_TYPE=mysql
DB_HOST=127.0.0.1
DB_USER=your_database_username
DB_PASSWORD=your_secure_database_password
DB_NAME=your_database_name
DB_PORT=3306

# Security Tokens
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_secure_jwt_secret_min_32_chars
FILE_SIGNING_SECRET=your_secure_file_signing_secret_min_32_chars

# Storage
STORAGE_ROOT=./storage

# Application URLs
APP_URL=https://api.cortexbuildpro.com
CORS_ORIGIN=https://cortexbuildpro.com,https://api.cortexbuildpro.com

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@cortexbuildpro.com

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key

# Web Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Feature Flags
USE_LOCAL_DB=false
ENABLE_DEMO_AUTH=false
MAINTENANCE_MODE=false
```

Save and exit (Ctrl+X, then Y, then Enter)

### 4. Set File Permissions

Secure the environment file:

```bash
chmod 600 .env
```

This ensures only the owner can read/write the file.

### 5. Configure PM2

#### Option A: Use ecosystem.config.js (Recommended)

Update the PM2 configuration to load from .env file:

```bash
nano ecosystem.config.production.js
```

Ensure it has:

```javascript
module.exports = {
  apps: [{
    name: 'cortexbuild-backend',
    script: './dist/index.js',
    cwd: '/home/deploy/apps/cortexbuild/server',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env',  // Loads from .env file
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
```

#### Option B: Use PM2 Environment Variables

Alternatively, set environment variables directly in PM2:

```bash
pm2 set cortexbuild-backend:env NODE_ENV=production
pm2 set cortexbuild-backend:env PORT=8080
# ... set other variables ...
```

### 6. Start/Restart Application

```bash
# If using ecosystem config:
pm2 start ecosystem.config.production.js

# Or restart existing app:
pm2 restart cortexbuild-backend --update-env

# Save PM2 configuration:
pm2 save

# Setup PM2 to start on boot:
pm2 startup
```

### 7. Verify Configuration

Check that environment variables are loaded:

```bash
# View PM2 app info
pm2 info cortexbuild-backend

# Check application logs
pm2 logs cortexbuild-backend --lines 50

# Test health endpoint
curl http://localhost:8080/api/health
```

## GitHub Actions Configuration

To enable automated deployments, add the following secrets to your GitHub repository:

### Required GitHub Secrets

Go to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

1. **VPS_SSH_KEY**: Your SSH private key for VPS access
   ```bash
   # Generate on your local machine:
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   
   # Copy the private key content:
   cat ~/.ssh/id_ed25519
   
   # Add the public key to VPS:
   ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@72.62.132.43
   ```

2. **Environment-specific secrets** (if needed):
   - `VPS_DB_PASSWORD`: Database password
   - `VPS_JWT_SECRET`: JWT secret
   - `VPS_GEMINI_API_KEY`: Gemini API key
   - `VPS_SENDGRID_API_KEY`: SendGrid API key

## Security Best Practices

1. ✅ **Never commit .env files** - Already in .gitignore
2. ✅ **Use SSH keys** - Not passwords for SSH access
3. ✅ **Restrict file permissions** - chmod 600 for .env files
4. ✅ **Rotate secrets regularly** - Change API keys and secrets periodically
5. ✅ **Use separate credentials** - Different for staging/production
6. ✅ **Enable firewall** - Only allow necessary ports
7. ✅ **Monitor logs** - Check PM2 logs for suspicious activity
8. ✅ **Keep systems updated** - Regular security updates

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs cortexbuild-backend --err

# Check if environment variables are loaded
pm2 env cortexbuild-backend

# Verify .env file exists and is readable
ls -la /home/deploy/apps/cortexbuild/server/.env
cat /home/deploy/apps/cortexbuild/server/.env
```

### Database connection errors

```bash
# Test database connection from VPS
mysql -h 127.0.0.1 -u your_user -p your_database

# Check MySQL is running
systemctl status mysql
```

### Permission denied errors

```bash
# Fix ownership
sudo chown -R deploy:deploy /home/deploy/apps/cortexbuild

# Fix permissions
chmod 755 /home/deploy/apps/cortexbuild/server
chmod 600 /home/deploy/apps/cortexbuild/server/.env
```

## Maintenance Commands

```bash
# Restart application
pm2 restart cortexbuild-backend

# View logs
pm2 logs cortexbuild-backend

# Monitor resources
pm2 monit

# List all apps
pm2 list

# Stop application
pm2 stop cortexbuild-backend

# Delete from PM2
pm2 delete cortexbuild-backend
```

## Backup Recommendations

1. Backup .env file securely (encrypted)
2. Document all credential locations
3. Store backup of PM2 configuration
4. Regular database backups

```bash
# Backup database
mysqldump -u your_user -p your_database > backup_$(date +%Y%m%d).sql

# Backup .env (encrypted)
tar -czf - .env | openssl enc -aes-256-cbc -salt -out env_backup_$(date +%Y%m%d).tar.gz.enc
```
