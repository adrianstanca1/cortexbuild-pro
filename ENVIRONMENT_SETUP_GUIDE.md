# 🔧 CortexBuild Pro - Environment Setup Guide

**Last Updated:** January 28, 2026  
**Purpose:** Complete guide for setting up environment variables for development and production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Required Environment Variables](#required-environment-variables)
4. [Optional Environment Variables](#optional-environment-variables)
5. [Environment Files](#environment-files)
6. [Security Best Practices](#security-best-practices)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Overview

CortexBuild Pro requires several environment variables for proper operation. This guide covers all variables needed for both development and production environments.

### Environment Types

- **Development**: Local development on `http://localhost:3000`
- **Production**: Deployed on VPS or cloud with custom domain
- **Docker**: Containerized deployment using Docker Compose

---

## Quick Start

### For Development

```bash
# Navigate to the application directory
cd cortexbuild-pro/nextjs_space

# Copy the example environment file
cp .env.example .env

# Edit with your values
nano .env

# Generate a secure NextAuth secret
openssl rand -base64 32

# Start development
npm install --legacy-peer-deps
npm run dev
```

### For Production (Docker)

```bash
# Navigate to deployment directory
cd cortexbuild-pro/deployment

# Copy the example environment file
cp .env.example .env

# Edit with production values
nano .env

# Deploy
docker-compose up -d
```

---

## Required Environment Variables

These variables **MUST** be set for the application to function properly.

### 1. Database Configuration

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Description:** PostgreSQL database connection string  
**Example (Development):** `postgresql://cortexbuild:devpassword@localhost:5432/cortexbuild?schema=public`  
**Example (Production):** `postgresql://cortexbuild:SECURE_PASSWORD_HERE@postgres:5432/cortexbuild?schema=public`

**Security Notes:**
- Use a strong password (minimum 24 characters)
- Never commit this to Git
- For Docker: Use service name (`postgres`) as host
- For external DB: Use actual hostname/IP

### 2. NextAuth Configuration

#### NEXTAUTH_SECRET

```env
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

**Description:** Secret key for encrypting JWT tokens and session data  
**How to Generate:**

```bash
openssl rand -base64 32
```

**Requirements:**
- Minimum 32 characters
- Must be cryptographically random
- Different for each environment
- Never reuse across projects

#### NEXTAUTH_URL

```env
NEXTAUTH_URL="http://localhost:3000"
```

**Description:** Your application's public URL  
**Example (Development):** `http://localhost:3000`  
**Example (Production):** `https://www.cortexbuildpro.com`

**Requirements:**
- Must match your actual domain
- Use HTTPS in production
- No trailing slash

### 3. AWS S3 Configuration

Required for file uploads (documents, images, PDFs).

```env
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="your-folder-prefix/"
```

**Description:**
- `AWS_REGION`: AWS region where your S3 bucket is located
- `AWS_BUCKET_NAME`: Name of your S3 bucket
- `AWS_FOLDER_PREFIX`: Folder prefix for organizing files (optional)

**AWS Credentials:**

For security, AWS credentials should be provided via:

1. **Environment Variables (Recommended for Docker/Production):**
   ```env
   AWS_ACCESS_KEY_ID="your-access-key-id"
   AWS_SECRET_ACCESS_KEY="your-secret-access-key"
   ```

2. **AWS Profile (Development):**
   ```env
   AWS_PROFILE="hosted_storage"
   ```
   Configure with: `aws configure --profile hosted_storage`

**Security Notes:**
- Create an IAM user specifically for this application
- Grant only S3 permissions (principle of least privilege)
- Rotate access keys every 90 days
- Never commit credentials to Git

### 4. AbacusAI API Configuration

Required for AI features and notification services.

```env
ABACUSAI_API_KEY="your-abacus-api-key"
```

**Description:** API key for AbacusAI services  
**How to Obtain:**
1. Sign up at https://abacus.ai/
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy and store securely (shown only once)

**Optional Variables:**

```env
WEB_APP_ID="your-web-app-id"
NOTIF_ID_MILESTONE_DEADLINE_REMINDER="your-notif-id"
NOTIF_ID_TOOLBOX_TALK_COMPLETED="your-notif-id"
NOTIF_ID_MEWP_CHECK_COMPLETED="your-notif-id"
NOTIF_ID_TOOL_CHECK_COMPLETED="your-notif-id"
```

These are only needed if using AbacusAI's advanced notification features.

---

## Optional Environment Variables

These variables enhance functionality but are not required for basic operation.

### 1. Google OAuth (Social Login)

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Description:** Enable "Sign in with Google" functionality  
**How to Obtain:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`

### 2. SendGrid Email Service

```env
SENDGRID_API_KEY="SG.your_api_key_here"
SENDGRID_FROM_EMAIL="noreply@your-domain.com"
SENDGRID_FROM_NAME="CortexBuild Pro"
```

**Description:** Email delivery service for notifications and invitations  
**How to Obtain:**
1. Sign up at https://sendgrid.com/
2. Verify sender identity
3. Create an API key with Mail Send permission
4. Copy the key (shown only once)

**Alternative:** If not configured, the application falls back to AbacusAI for email delivery.

### 3. Custom SMTP Email

Alternative to SendGrid using your own SMTP server.

```env
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="your_email@domain.com"
SMTP_PASSWORD="your_password"
EMAIL_FROM="noreply@your-domain.com"
```

**Common Providers:**

**Gmail:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"  # Use App Password, not regular password
```

**Outlook/Office 365:**
```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="your_email@outlook.com"
SMTP_PASSWORD="your_password"
```

### 4. Real-time WebSocket Configuration

```env
NEXT_PUBLIC_WEBSOCKET_URL="https://your-domain.com"
WEBSOCKET_PORT="3000"
```

**Description:** Configuration for real-time updates and chat  
**Development:** `http://localhost:3000`  
**Production:** Your actual domain with HTTPS

**Note:** `NEXT_PUBLIC_` prefix makes this available in the browser.

### 5. Docker-Specific Variables

Only needed when using Docker Compose deployment.

```env
POSTGRES_USER="cortexbuild"
POSTGRES_PASSWORD="your_secure_password_here"
POSTGRES_DB="cortexbuild"
DOMAIN="your-domain.com"
SSL_EMAIL="admin@your-domain.com"
```

---

## Environment Files

### File Locations and Purposes

#### 1. `nextjs_space/.env`

**Purpose:** Local development configuration  
**When to use:** Running `npm run dev`  
**Example:**

```env
DATABASE_URL="postgresql://cortexbuild:devpass@localhost:5432/cortexbuild?schema=public"
NEXTAUTH_SECRET="development-secret-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="dev-bucket"
AWS_FOLDER_PREFIX="dev/"
ABACUSAI_API_KEY="your-dev-api-key"
```

#### 2. `deployment/.env`

**Purpose:** Production Docker deployment  
**When to use:** Running `docker-compose up`  
**Example:**

```env
# PostgreSQL
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=GENERATED_SECURE_PASSWORD_HERE
POSTGRES_DB=cortexbuild

# Database URL (auto-constructed in docker-compose.yml)
DATABASE_URL="postgresql://cortexbuild:GENERATED_SECURE_PASSWORD_HERE@postgres:5432/cortexbuild?schema=public"

# NextAuth
NEXTAUTH_SECRET=GENERATED_SECURE_SECRET_HERE
NEXTAUTH_URL=https://www.cortexbuildpro.com

# Domain
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com

# AWS S3
AWS_REGION=us-west-2
AWS_BUCKET_NAME=prod-bucket
AWS_FOLDER_PREFIX=production/

# AbacusAI
ABACUSAI_API_KEY=your-prod-api-key

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=https://www.cortexbuildpro.com
WEBSOCKET_PORT=3000
```

#### 3. `.env.example` Files

**Purpose:** Template files showing required variables  
**Committed to Git:** Yes  
**Contains real secrets:** No

These serve as documentation and starting points for creating actual `.env` files.

---

## Security Best Practices

### 1. Never Commit Secrets

✅ **Do:**
- Use `.env` files for secrets (already in `.gitignore`)
- Commit `.env.example` files with placeholder values
- Use environment variables in code: `process.env.VARIABLE_NAME`

❌ **Don't:**
- Commit `.env` files to Git
- Hardcode secrets in source code
- Share secrets in documentation
- Include secrets in Docker images

### 2. Generate Strong Secrets

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Generate database password (32+ characters)
openssl rand -base64 32

# Generate random password with special characters
openssl rand -base64 48 | tr -d "=+/" | cut -c1-32
```

### 3. Secure File Permissions

```bash
# Restrict access to .env files
chmod 600 nextjs_space/.env
chmod 600 deployment/.env

# Verify permissions
ls -la nextjs_space/.env
# Should show: -rw------- (only owner can read/write)
```

### 4. Rotate Secrets Regularly

- **NEXTAUTH_SECRET**: Change every 90 days or after security incidents
- **Database passwords**: Change every 90 days
- **API keys**: Rotate according to provider recommendations
- **AWS credentials**: Rotate every 90 days

### 5. Separate Development and Production

- Use different databases for dev and prod
- Use different API keys for dev and prod
- Use different AWS buckets for dev and prod
- Never use production credentials in development

### 6. Use GitHub Secrets for CI/CD

For automated deployments, store secrets in GitHub:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add repository secrets (see [GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md))
3. Reference in GitHub Actions workflows

---

## Verification

### Check Environment Variables

```bash
# Navigate to application directory
cd nextjs_space

# Run system diagnostics
npx tsx scripts/system-diagnostics.ts
```

This will verify:
- ✅ All required variables are set
- ✅ Database connection works
- ✅ Database schema is correct
- ✅ File storage is accessible
- ✅ API services are configured

### Manual Verification

```bash
# Check if .env file exists
ls -la nextjs_space/.env

# Verify required variables (without showing values)
grep -E "^(DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL)=" nextjs_space/.env | sed 's/=.*/=***/' 

# Test database connection
cd nextjs_space
npx prisma db pull
```

### Test Individual Services

#### Database
```bash
cd nextjs_space
npx prisma studio
# Opens GUI at http://localhost:5555
```

#### API Endpoints
```bash
# Start development server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3000/api/auth/providers
```

#### File Upload (S3)
- Log in to the application
- Navigate to Documents section
- Upload a test file
- Verify it appears in your S3 bucket

---

## Troubleshooting

### Database Connection Issues

**Problem:** `Error: P1001: Can't reach database server`

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check database is running:
   ```bash
   # For local PostgreSQL
   sudo systemctl status postgresql
   
   # For Docker
   docker-compose ps
   ```
3. Test connection manually:
   ```bash
   psql "$DATABASE_URL"
   ```
4. Check firewall/network settings

### NextAuth Issues

**Problem:** Authentication not working or errors about NEXTAUTH_SECRET

**Solutions:**
1. Verify `NEXTAUTH_SECRET` is set and at least 32 characters
2. Ensure `NEXTAUTH_URL` matches your actual URL
3. Check for trailing slashes in `NEXTAUTH_URL` (remove them)
4. Restart the server after changing .env

### AWS S3 Upload Issues

**Problem:** File uploads fail with 403 or connection errors

**Solutions:**
1. Verify AWS credentials are correct
2. Check IAM user has S3 permissions
3. Verify bucket name and region are correct
4. Check bucket CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

### Environment Variables Not Loading

**Problem:** Application can't find environment variables

**Solutions:**
1. Verify `.env` file exists in the correct location
2. Check file has no syntax errors (no spaces around `=`)
3. Restart the server after changes
4. For Docker: Restart containers
   ```bash
   docker-compose down
   docker-compose up -d
   ```
5. Check environment variable names are exactly correct (case-sensitive)

### AbacusAI API Issues

**Problem:** AI features not working

**Solutions:**
1. Verify `ABACUSAI_API_KEY` is correct
2. Check API key hasn't expired
3. Verify you have API quota/credits available
4. Check AbacusAI service status

---

## Complete Environment Template

Here's a complete template with all possible variables:

```env
# ===========================================
# REQUIRED VARIABLES
# ===========================================

# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="your-prefix/"

# AbacusAI
ABACUSAI_API_KEY="your-api-key"

# ===========================================
# OPTIONAL VARIABLES
# ===========================================

# Google OAuth
# GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
# GOOGLE_CLIENT_SECRET="your-client-secret"

# SendGrid Email
# SENDGRID_API_KEY="SG.your-api-key"
# SENDGRID_FROM_EMAIL="noreply@your-domain.com"
# SENDGRID_FROM_NAME="CortexBuild Pro"

# Custom SMTP
# SMTP_HOST="smtp.your-provider.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@domain.com"
# SMTP_PASSWORD="your-password"
# EMAIL_FROM="noreply@your-domain.com"

# WebSocket
# NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3000"
# WEBSOCKET_PORT="3000"

# AWS Credentials (if not using AWS profile)
# AWS_ACCESS_KEY_ID="your-access-key-id"
# AWS_SECRET_ACCESS_KEY="your-secret-access-key"

# AbacusAI Advanced
# WEB_APP_ID="your-web-app-id"
# NOTIF_ID_MILESTONE_DEADLINE_REMINDER="notif-id"
# NOTIF_ID_TOOLBOX_TALK_COMPLETED="notif-id"
# NOTIF_ID_MEWP_CHECK_COMPLETED="notif-id"
# NOTIF_ID_TOOL_CHECK_COMPLETED="notif-id"

# Docker-Specific (deployment/.env only)
# POSTGRES_USER="cortexbuild"
# POSTGRES_PASSWORD="secure-password"
# POSTGRES_DB="cortexbuild"
# DOMAIN="your-domain.com"
# SSL_EMAIL="admin@your-domain.com"
```

---

## Next Steps

1. ✅ Copy appropriate `.env.example` to `.env`
2. ✅ Fill in all required variables
3. ✅ Generate secure secrets with `openssl rand -base64 32`
4. ✅ Secure file permissions with `chmod 600 .env`
5. ✅ Run verification script
6. ✅ Test the application
7. ✅ Set up GitHub Secrets for CI/CD (see [GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md))

---

## Additional Resources

- [API Setup Guide](API_SETUP_GUIDE.md) - Detailed API configuration
- [GitHub Secrets Guide](GITHUB_SECRETS_GUIDE.md) - CI/CD secrets setup
- [Security Checklist](SECURITY_CHECKLIST.md) - Security best practices
- [Deployment Guide](PUBLIC_DEPLOYMENT.md) - Production deployment
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review [API Setup Guide](API_SETUP_GUIDE.md)
3. Run system diagnostics: `npx tsx scripts/system-diagnostics.ts`
4. Check application logs
5. Open an issue on GitHub

---

**Last Updated:** January 28, 2026  
**Version:** 1.0.0
