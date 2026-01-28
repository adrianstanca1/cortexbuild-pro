# 🔐 Repository Secrets Summary

**Last Updated:** January 28, 2026  
**Purpose:** Complete list of all secrets to configure in GitHub repository

---

## 📋 Overview

This document lists ALL environment variables, API keys, passwords, and secrets that should be stored as **GitHub Repository Secrets** for CI/CD automation.

### Why GitHub Secrets?

- ✅ Encrypted and secure storage
- ✅ Never exposed in logs or code
- ✅ Enables automated deployments
- ✅ Centralized credential management
- ✅ Easy rotation and updates

### How to Add Secrets

**Method 1: GitHub Web Interface**
1. Go to: Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add name and value
4. Click "Add secret"

**Method 2: GitHub CLI**
```bash
gh secret set SECRET_NAME --body "value"
```

**For detailed instructions, see:** [GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)

---

## 🔴 REQUIRED Repository Secrets

These secrets **MUST** be configured for automated deployments to work.

### 1. VPS Server Access

#### VPS_HOST
```
Description: IP address or hostname of your VPS server
Example: 192.168.1.100 or vps.example.com
How to get: Check your VPS provider dashboard or run 'curl ifconfig.me' on VPS
Command: gh secret set VPS_HOST --body "your-vps-ip"
```

#### VPS_USERNAME
```
Description: SSH username for VPS access
Example: ubuntu, root, or cortexbuild
How to get: Your VPS provider or system administrator
Command: gh secret set VPS_USERNAME --body "ubuntu"
```

#### VPS_SSH_KEY
```
Description: Private SSH key for passwordless authentication
Format: Complete private key including -----BEGIN and -----END lines
How to get:
  1. Generate: ssh-keygen -t ed25519 -f ~/.ssh/cortexbuild_deploy
  2. Copy public key to VPS: ssh-copy-id -i ~/.ssh/cortexbuild_deploy.pub user@vps-ip
  3. Use private key as secret value
Command: gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy
Security: NEVER share this key; store backup securely offline
```

### 2. Database Configuration

#### DATABASE_URL
```
Description: PostgreSQL connection string
Format: postgresql://username:password@host:port/database?schema=public
Example: postgresql://cortexbuild:SECURE_PASS@postgres:5432/cortexbuild?schema=public
How to get: From your database provider or docker-compose setup
Command: gh secret set DATABASE_URL --body "postgresql://..."
Security: Use strong password (24+ characters)
```

#### POSTGRES_PASSWORD
```
Description: PostgreSQL database password
Example: Generated secure random string
How to get: openssl rand -base64 32
Command: gh secret set POSTGRES_PASSWORD --body "$(openssl rand -base64 32)"
Security: Minimum 24 characters; different from development
```

### 3. Authentication & Security

#### NEXTAUTH_SECRET
```
Description: Secret key for JWT encryption and session management
Requirements: MUST be at least 32 characters, cryptographically random
How to get: openssl rand -base64 32
Command: gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
Security: Rotate every 90 days; unique per environment
```

#### NEXTAUTH_URL
```
Description: Public URL of your production application
Example: https://www.cortexbuildpro.com
Format: Must use HTTPS in production; no trailing slash
Command: gh secret set NEXTAUTH_URL --body "https://your-domain.com"
```

### 4. AWS S3 File Storage

#### AWS_ACCESS_KEY_ID
```
Description: AWS IAM user access key ID
Example: AKIAIOSFODNN7EXAMPLE
How to get:
  1. AWS Console → IAM → Users
  2. Create user for CortexBuild
  3. Security credentials → Create access key
  4. Copy Access Key ID
Command: gh secret set AWS_ACCESS_KEY_ID --body "AKIA..."
Security: Create dedicated IAM user; least privilege permissions
```

#### AWS_SECRET_ACCESS_KEY
```
Description: AWS IAM user secret access key
Example: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
How to get: Created with AWS_ACCESS_KEY_ID (shown only once)
Command: gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret-key"
Security: NEVER share; rotate every 90 days
```

#### AWS_REGION
```
Description: AWS region where S3 bucket is located
Example: us-west-2, us-east-1, eu-west-1
Command: gh secret set AWS_REGION --body "us-west-2"
```

#### AWS_BUCKET_NAME
```
Description: Name of your S3 bucket for file storage
Example: cortexbuild-prod-files
How to get: Create bucket in AWS Console S3 service
Command: gh secret set AWS_BUCKET_NAME --body "your-bucket-name"
```

#### AWS_FOLDER_PREFIX
```
Description: Folder prefix for organizing files in S3
Example: production/ or cortexbuild/
Command: gh secret set AWS_FOLDER_PREFIX --body "production/"
```

### 5. AI & Notifications

#### ABACUSAI_API_KEY
```
Description: API key for AbacusAI services (AI features, notifications)
Example: abacus_xxxxxxxxxxxxxxxxxxxxx
How to get:
  1. Sign up at https://abacus.ai/
  2. Settings → API Keys
  3. Create new API key
  4. Copy key (shown only once)
Command: gh secret set ABACUSAI_API_KEY --body "abacus_..."
Security: Store securely; provides access to AI services
```

---

## 🟡 OPTIONAL Repository Secrets

These secrets enable additional features but are not required for basic functionality.

### 6. Google OAuth (Social Login)

#### GOOGLE_CLIENT_ID
```
Description: Google OAuth 2.0 client ID for "Sign in with Google"
Example: 1234567890-abc.apps.googleusercontent.com
How to get:
  1. https://console.cloud.google.com/
  2. Create project → Enable Google+ API
  3. Create OAuth 2.0 credentials
  4. Add redirect URIs (see GITHUB_SECRETS_GUIDE.md)
Command: gh secret set GOOGLE_CLIENT_ID --body "your-client-id"
```

#### GOOGLE_CLIENT_SECRET
```
Description: Google OAuth 2.0 client secret
Example: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
How to get: Created with GOOGLE_CLIENT_ID
Command: gh secret set GOOGLE_CLIENT_SECRET --body "GOCSPX-..."
Security: Keep confidential; don't share
```

### 7. SendGrid Email Service

#### SENDGRID_API_KEY
```
Description: SendGrid API key for email delivery
Example: SG.xxxxxxxxxxxxxxxxxxxxxxxx
How to get:
  1. Sign up at https://sendgrid.com/ (free tier: 100 emails/day)
  2. Settings → Sender Authentication → Verify email
  3. Settings → API Keys → Create API Key
  4. Copy key (shown only once)
Command: gh secret set SENDGRID_API_KEY --body "SG...."
Note: If not configured, app uses AbacusAI for email delivery
```

#### SENDGRID_FROM_EMAIL
```
Description: Email address to send from
Example: noreply@your-domain.com
Requirements: Must be verified in SendGrid
Command: gh secret set SENDGRID_FROM_EMAIL --body "noreply@your-domain.com"
```

#### SENDGRID_FROM_NAME
```
Description: Display name for sent emails
Example: CortexBuild Pro
Command: gh secret set SENDGRID_FROM_NAME --body "CortexBuild Pro"
```

### 8. Custom SMTP Email (Alternative to SendGrid)

#### SMTP_HOST
```
Description: SMTP server hostname
Example: smtp.gmail.com, smtp.office365.com
Command: gh secret set SMTP_HOST --body "smtp.gmail.com"
```

#### SMTP_PORT
```
Description: SMTP server port
Example: 587 (TLS) or 465 (SSL)
Command: gh secret set SMTP_PORT --body "587"
```

#### SMTP_USER
```
Description: SMTP authentication username
Example: your-email@gmail.com
Command: gh secret set SMTP_USER --body "your-email@gmail.com"
```

#### SMTP_PASSWORD
```
Description: SMTP authentication password
Example: App-specific password for Gmail
Command: gh secret set SMTP_PASSWORD --body "your-app-password"
Security: For Gmail, use App Passwords not regular password
```

### 9. Domain & SSL Configuration

#### DOMAIN
```
Description: Your production domain (without www or https://)
Example: cortexbuildpro.com
Used for: SSL certificate generation
Command: gh secret set DOMAIN --body "your-domain.com"
```

#### SSL_EMAIL
```
Description: Email for SSL certificate notifications
Example: admin@your-domain.com
Used for: Let's Encrypt renewal notifications
Command: gh secret set SSL_EMAIL --body "admin@your-domain.com"
```

### 10. Real-time WebSocket

#### NEXT_PUBLIC_WEBSOCKET_URL
```
Description: WebSocket server URL for real-time features
Example: https://www.cortexbuildpro.com
Format: Use HTTPS (WSS) in production
Command: gh secret set NEXT_PUBLIC_WEBSOCKET_URL --body "https://your-domain.com"
```

#### WEBSOCKET_PORT
```
Description: WebSocket server port
Example: 3000
Command: gh secret set WEBSOCKET_PORT --body "3000"
```

### 11. Additional AbacusAI Configuration

#### WEB_APP_ID
```
Description: AbacusAI web application ID
Example: your-web-app-id
Used for: AbacusAI hosted features
Command: gh secret set WEB_APP_ID --body "your-web-app-id"
```

#### Notification IDs (Optional)
```
Description: Notification template IDs for AbacusAI push notifications
Commands:
  gh secret set NOTIF_ID_MILESTONE_DEADLINE_REMINDER --body "notif-id"
  gh secret set NOTIF_ID_TOOLBOX_TALK_COMPLETED --body "notif-id"
  gh secret set NOTIF_ID_MEWP_CHECK_COMPLETED --body "notif-id"
  gh secret set NOTIF_ID_TOOL_CHECK_COMPLETED --body "notif-id"
```

---

## 📊 Secrets Summary

### Required Secrets Count: 13
1. VPS_HOST
2. VPS_USERNAME
3. VPS_SSH_KEY
4. DATABASE_URL
5. POSTGRES_PASSWORD
6. NEXTAUTH_SECRET
7. NEXTAUTH_URL
8. AWS_ACCESS_KEY_ID
9. AWS_SECRET_ACCESS_KEY
10. AWS_REGION
11. AWS_BUCKET_NAME
12. AWS_FOLDER_PREFIX
13. ABACUSAI_API_KEY

### Optional Secrets Count: 15+
- Google OAuth (2 secrets)
- SendGrid (3 secrets)
- Custom SMTP (4 secrets)
- Domain/SSL (2 secrets)
- WebSocket (2 secrets)
- Additional AbacusAI (5+ secrets)

**Total Possible Secrets: 28+**

---

## 🚀 Quick Setup Script

Copy and customize this script to set all required secrets at once:

```bash
#!/bin/bash
# Setup GitHub Repository Secrets
# SECURITY: This script contains sensitive data - DO NOT commit to Git!

echo "Setting up GitHub secrets for CortexBuild Pro..."

# VPS Configuration
gh secret set VPS_HOST --body "YOUR_VPS_IP_HERE"
gh secret set VPS_USERNAME --body "ubuntu"
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy

# Database
gh secret set POSTGRES_PASSWORD --body "$(openssl rand -base64 32)"
gh secret set DATABASE_URL --body "postgresql://cortexbuild:PASSWORD@postgres:5432/cortexbuild?schema=public"

# NextAuth
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set NEXTAUTH_URL --body "https://your-domain.com"

# AWS S3
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_AWS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_AWS_SECRET_KEY"
gh secret set AWS_REGION --body "us-west-2"
gh secret set AWS_BUCKET_NAME --body "your-bucket-name"
gh secret set AWS_FOLDER_PREFIX --body "production/"

# AbacusAI
gh secret set ABACUSAI_API_KEY --body "YOUR_ABACUS_KEY"

# Optional: Google OAuth
# gh secret set GOOGLE_CLIENT_ID --body "YOUR_GOOGLE_CLIENT_ID"
# gh secret set GOOGLE_CLIENT_SECRET --body "YOUR_GOOGLE_CLIENT_SECRET"

# Optional: SendGrid
# gh secret set SENDGRID_API_KEY --body "SG.YOUR_KEY"
# gh secret set SENDGRID_FROM_EMAIL --body "noreply@your-domain.com"
# gh secret set SENDGRID_FROM_NAME --body "CortexBuild Pro"

echo "✅ Required secrets configured!"
echo "Run 'gh secret list' to verify all secrets are set"
```

**To use:**
1. Save as `setup-secrets.sh` (add to .gitignore!)
2. Replace ALL_CAPS placeholders with your actual values
3. Make executable: `chmod +x setup-secrets.sh`
4. Run: `./setup-secrets.sh`
5. **DELETE the script after use** (contains sensitive data)

---

## ✅ Verification Checklist

After adding secrets, verify your setup:

```bash
# 1. List all secrets (values hidden)
gh secret list

# 2. Expected output should include at minimum:
#    - VPS_HOST
#    - VPS_USERNAME
#    - VPS_SSH_KEY
#    - DATABASE_URL
#    - POSTGRES_PASSWORD
#    - NEXTAUTH_SECRET
#    - NEXTAUTH_URL
#    - AWS_ACCESS_KEY_ID
#    - AWS_SECRET_ACCESS_KEY
#    - AWS_REGION
#    - AWS_BUCKET_NAME
#    - AWS_FOLDER_PREFIX
#    - ABACUSAI_API_KEY

# 3. Test deployment workflow
#    Trigger manually or push to main branch

# 4. Check workflow logs
#    GitHub → Actions tab → Select workflow run
#    Verify no "secret not found" errors
```

---

## 🔒 Security Best Practices

### DO ✅
- Use GitHub Secrets for ALL sensitive data
- Generate strong random values (32+ characters)
- Different secrets for dev and prod
- Rotate secrets every 90 days
- Use least-privilege IAM policies
- Keep backup of SSH keys offline
- Document secret purposes

### DON'T ❌
- Commit secrets to Git
- Share secrets via email/chat
- Reuse passwords across services
- Use weak or predictable values
- Log secret values in code
- Store secrets in code comments
- Share GitHub credentials

### Secret Rotation Schedule

**Every 90 days, rotate:**
- NEXTAUTH_SECRET
- POSTGRES_PASSWORD
- AWS access keys
- API keys (AbacusAI, SendGrid, etc.)

**Immediately rotate if:**
- Suspected compromise
- Employee departure
- Public exposure
- Security incident

---

## 🆘 Troubleshooting

### Secret Not Found Error
**Problem:** Workflow fails with "secret not found"

**Solution:**
```bash
# Verify secret exists
gh secret list | grep SECRET_NAME

# Re-add if missing
gh secret set SECRET_NAME --body "value"

# Check exact spelling (case-sensitive)
```

### SSH Key Authentication Failed
**Problem:** VPS deployment fails with SSH error

**Solution:**
```bash
# Verify key format (must include headers)
cat ~/.ssh/cortexbuild_deploy
# Should start with: -----BEGIN OPENSSH PRIVATE KEY-----

# Test key locally
ssh -i ~/.ssh/cortexbuild_deploy user@vps-ip

# Re-add key ensuring all content is included
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy
```

### Database Connection Failed
**Problem:** Cannot connect to database

**Solution:**
```bash
# Verify DATABASE_URL format
# Correct: postgresql://user:pass@host:5432/db?schema=public
# Check no special characters need URL encoding in password

# Test locally
psql "postgresql://user:pass@host:5432/db"
```

---

## 📚 Related Documentation

- **[GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)** - Complete guide with detailed instructions
- **[ENVIRONMENT_SETUP_GUIDE.md](ENVIRONMENT_SETUP_GUIDE.md)** - Environment variables setup
- **[ENV_SETUP_QUICK_REFERENCE.md](ENV_SETUP_QUICK_REFERENCE.md)** - Quick start guide
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security best practices
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - API services configuration

---

## 🎯 Next Steps

After configuring secrets:

1. ✅ Verify all required secrets are set: `gh secret list`
2. ✅ Test workflow manually (if available)
3. ✅ Push to main branch to trigger deployment
4. ✅ Monitor GitHub Actions workflow
5. ✅ Verify deployment success
6. ✅ Schedule secret rotation reminders
7. ✅ Document any custom secrets added

---

**Last Updated:** January 28, 2026  
**Version:** 1.0.0  
**Status:** Complete ✅
