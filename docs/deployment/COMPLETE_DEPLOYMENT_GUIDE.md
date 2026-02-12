# Complete Deployment & Environment Configuration Guide

This is your master guide for deploying and configuring the CortexBuild application across all environments.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment Environments](#deployment-environments)
3. [Initial Setup](#initial-setup)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Procedures](#deployment-procedures)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

**First-time setup checklist:**

- [ ] Configure GitHub Actions secrets (see [GITHUB_SECRETS_GUIDE.md](./GITHUB_SECRETS_GUIDE.md))
- [ ] Set up Hostinger environment variables (see [HOSTINGER_ENV_VARS.txt](./HOSTINGER_ENV_VARS.txt))
- [ ] Configure VPS environment (see [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md))
- [ ] Verify all credentials are rotated from exposed ones
- [ ] Run initial deployment
- [ ] Test all endpoints

---

## 🌐 Deployment Environments

### 1. **Production (Vercel)**
- **URL**: https://cortexbuildpro.com
- **Purpose**: Main frontend hosting
- **Technology**: Vercel static hosting + serverless functions
- **Deployment**: Automatic on push to `main` branch

### 2. **VPS Server**
- **URL**: https://api.cortexbuildpro.com
- **IP**: 72.62.132.43
- **Purpose**: Backend API hosting
- **Technology**: Node.js + PM2 + MySQL
- **Deployment**: Automatic on push to `main` branch or manual

### 3. **Hostinger**
- **URL**: https://cortexbuildpro.com/api
- **Purpose**: Alternative backend hosting
- **Technology**: Hostinger Node.js App + MySQL
- **Deployment**: Manual via hPanel or FTP/SSH

---

## 🔧 Initial Setup

### Step 1: Configure GitHub Secrets

Follow the complete guide: [GITHUB_SECRETS_GUIDE.md](./GITHUB_SECRETS_GUIDE.md)

**Required secrets:**
```
VERCEL_TOKEN              # For Vercel deployments
SUPABASE_URL              # Database connection
SUPABASE_ANON_KEY         # Public API access
SUPABASE_SERVICE_ROLE_KEY # Admin access
DATABASE_URL              # PostgreSQL connection string
VPS_SSH_KEY               # VPS SSH access
```

**How to add:**
1. Go to: https://github.com/adrianstanca1/cortexbuildapp.com/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret from the guide

### Step 2: Set Up Hostinger Environment

Follow the complete guide: [HOSTINGER_ENV_VARS.txt](./HOSTINGER_ENV_VARS.txt)

**Quick steps:**
1. Log into Hostinger hPanel: https://hpanel.hostinger.com
2. Navigate to **Websites** → **Node.js** → Your Application
3. Add environment variables from the guide
4. Restart the application

### Step 3: Configure VPS Server

Follow the complete guide: [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md)

**Quick steps:**
```bash
# 1. SSH into VPS
ssh deploy@72.62.132.43

# 2. Navigate to app directory
cd /home/deploy/apps/cortexbuild/server

# 3. Create .env file
nano .env
# Add all environment variables from the guide

# 4. Restart application
pm2 restart cortexbuild-backend --update-env
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

All environments need these variables (with environment-specific values):

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment type | `production` |
| `PORT` | Server port | `8080` or `3001` |
| `DATABASE_TYPE` | Database type | `mysql` or `postgres` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_USER` | Database username | `your_db_user` |
| `DB_PASSWORD` | Database password | `secure_password` |
| `DB_NAME` | Database name | `cortexbuildpro` |
| `JWT_SECRET` | JWT signing secret | Generate with crypto |
| `FILE_SIGNING_SECRET` | File signing secret | Generate with crypto |
| `GEMINI_API_KEY` | Google AI API key | `AIzaSy...` |
| `SENDGRID_API_KEY` | Email service key | `SG.xyz...` |
| `VAPID_PUBLIC_KEY` | Push notifications | Generate at vapidkeys.com |
| `VAPID_PRIVATE_KEY` | Push notifications | Generate at vapidkeys.com |
| `CORS_ORIGIN` | Allowed origins | `https://cortexbuildpro.com` |
| `APP_URL` | Application URL | `https://cortexbuildpro.com` |

### Generating Secure Secrets

```bash
# Generate JWT secret (32 bytes = 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate file signing secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate VAPID keys for push notifications
# Visit: https://vapidkeys.com/
```

---

## 🚢 Deployment Procedures

### Automated Deployment (Recommended)

#### Deploy Everything

```bash
# Push to main branch triggers automatic deployment
git push origin main

# Or manually trigger via GitHub Actions:
# 1. Go to Actions tab
# 2. Select "Deploy to All Environments"
# 3. Click "Run workflow"
```

#### Deploy to Vercel Only

```bash
# Automatic on push to main
git push origin main

# Manual deployment
npm run vercel:prod
```

#### Deploy to VPS Only

```bash
# Via GitHub Actions
# 1. Go to Actions tab
# 2. Select "Deploy to VPS"
# 3. Click "Run workflow"

# Or manual deployment via SSH
ssh deploy@72.62.132.43
cd /home/deploy/apps/cortexbuild/server
git pull origin main
npm install --production
npm run build
pm2 restart cortexbuild-backend
```

### Manual Deployment to Hostinger

#### Via hPanel (Easiest)

1. Log into hPanel: https://hpanel.hostinger.com
2. Navigate to **File Manager**
3. Upload built files to `/domains/cortexbuildpro.com/api`
4. Go to **Node.js** → Restart Application

#### Via SSH/FTP

```bash
# Build locally
npm run build:backend

# Upload via SCP
scp -r server/dist/* user@host:/path/to/app/

# Or use FTP client (FileZilla, etc.)
```

---

## ✅ Verification & Testing

### 1. Health Checks

```bash
# Vercel (Frontend)
curl https://cortexbuildpro.com

# VPS (Backend)
curl https://api.cortexbuildpro.com/api/health

# Hostinger (Alternative Backend)
curl https://cortexbuildpro.com/api/health
```

Expected response:
```json
{
  "status": "online",
  "timestamp": "2026-01-25T15:00:00.000Z",
  "environment": "production"
}
```

### 2. API Endpoints

```bash
# Test authentication
curl -X POST https://api.cortexbuildpro.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Test database connection
curl https://api.cortexbuildpro.com/api/projects

# Test AI integration
curl https://api.cortexbuildpro.com/api/ai/status
```

### 3. Verify Environment Variables

```bash
# On VPS
ssh deploy@72.62.132.43
pm2 info cortexbuild-backend | grep env

# On Hostinger
# Check via hPanel → Node.js → Environment Variables
```

### 4. Check Logs

```bash
# VPS PM2 logs
ssh deploy@72.62.132.43
pm2 logs cortexbuild-backend --lines 50

# Hostinger logs
# Access via hPanel → Node.js → Logs

# Vercel logs
# View at: https://vercel.com/dashboard → Your Project → Logs
```

---

## 🐛 Troubleshooting

### Deployment Fails

**GitHub Actions deployment fails:**
```bash
# Check GitHub Actions logs
# Go to: Actions tab → Failed workflow → View logs

# Common issues:
# 1. Missing secrets → Add in GitHub Settings
# 2. SSH key issues → Regenerate and update VPS_SSH_KEY
# 3. Build errors → Check local build works first
```

**VPS deployment fails:**
```bash
# Check PM2 status
ssh deploy@72.62.132.43
pm2 status

# View error logs
pm2 logs cortexbuild-backend --err --lines 100

# Common fixes:
pm2 restart cortexbuild-backend --update-env
npm install --production
pm2 save
```

**Hostinger deployment fails:**
```
# Check Node.js App status in hPanel
# Common issues:
# 1. Dependencies not installed → Click "Install Dependencies"
# 2. Wrong startup file → Set to "dist/index.js"
# 3. Port conflict → Ensure PORT env var is set correctly
```

### API Returns Errors

**500 Internal Server Error:**
```bash
# Check environment variables are set
# Check database connection
# View application logs

# VPS:
pm2 logs cortexbuild-backend

# Hostinger:
# Check logs in hPanel
```

**Database Connection Error:**
```bash
# Verify credentials
# Check database is running
mysql -h 127.0.0.1 -u your_user -p

# Check firewall rules
sudo ufw status

# Test connection from application
node -e "const mysql = require('mysql2'); const conn = mysql.createConnection({host:'127.0.0.1',user:'user',password:'pass',database:'db'}); conn.connect(err => console.log(err || 'Connected!'));"
```

**CORS Errors:**
```bash
# Verify CORS_ORIGIN environment variable includes frontend URL
# Example: CORS_ORIGIN=https://cortexbuildpro.com,https://api.cortexbuildpro.com

# Update and restart
pm2 restart cortexbuild-backend --update-env
```

### SSL/HTTPS Issues

```bash
# Verify SSL certificates
curl -vI https://cortexbuildpro.com

# Check reverse proxy configuration (if using nginx/Apache)
# Ensure proxy passes HTTPS correctly

# VPS nginx config location:
/etc/nginx/sites-available/cortexbuildpro.com
```

---

## 🔐 Security Checklist

Before going live, ensure:

- [ ] All exposed credentials from git history have been rotated
- [ ] JWT_SECRET is strong and unique (min 32 bytes)
- [ ] Database passwords are strong and not default values
- [ ] API keys (Gemini, SendGrid) are production keys with rate limits
- [ ] CORS_ORIGIN is set to specific domains (not `*`)
- [ ] Firewall is configured (only necessary ports open)
- [ ] SSL certificates are valid and not expired
- [ ] Environment files (.env) have restrictive permissions (chmod 600)
- [ ] Backup strategy is in place
- [ ] Monitoring/logging is enabled
- [ ] Error reporting is configured (Sentry, etc.)

---

## 📚 Additional Resources

- [SECURITY_ALERT.md](../../SECURITY_ALERT.md) - Critical security issues found
- [DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md) - Original deployment guide
- [BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md) - Backend-specific setup

---

## 🆘 Getting Help

If you encounter issues:

1. Check the relevant guide above
2. Review application logs
3. Verify environment variables are set correctly
4. Test locally before deploying
5. Check GitHub Actions workflow logs
6. Ensure all secrets are properly configured

For urgent issues, check [SECURITY_ALERT.md](../../SECURITY_ALERT.md) for any critical security concerns.
