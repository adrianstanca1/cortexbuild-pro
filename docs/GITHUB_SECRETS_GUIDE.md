# 🔐 GitHub Secrets Configuration Guide

**Last Updated:** January 28, 2026  
**Purpose:** Complete guide for configuring GitHub repository secrets for CI/CD automation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Why GitHub Secrets?](#why-github-secrets)
3. [Required Secrets](#required-secrets)
4. [Optional Secrets](#optional-secrets)
5. [How to Add Secrets](#how-to-add-secrets)
6. [Secrets for Different Workflows](#secrets-for-different-workflows)
7. [Security Best Practices](#security-best-practices)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

---

## Overview

GitHub Secrets allow you to store sensitive information securely and use it in GitHub Actions workflows. This enables automated deployments without exposing credentials in your code.

### What are GitHub Secrets?

- Encrypted environment variables stored in GitHub
- Accessible only to GitHub Actions workflows
- Never exposed in logs or outputs
- Can be used for CI/CD automation

---

## Why GitHub Secrets?

### Benefits

✅ **Security**: Credentials never appear in code or logs  
✅ **Automation**: Enable automated deployments  
✅ **Centralized**: Manage all secrets in one place  
✅ **Version Control**: Update secrets without changing code  
✅ **Access Control**: Control who can view/modify secrets

### Use Cases

- Automated VPS deployment
- Docker image publishing
- Database migrations
- Third-party API integrations
- Email notifications
- File storage operations

---

## Required Secrets

These secrets are **required** for the CI/CD workflows in this repository.

### 1. VPS Deployment Secrets

#### VPS_HOST

```
Description: IP address or hostname of your VPS server
Example: 192.168.1.100 or vps.cortexbuildpro.com
Used in: deploy-vps.yml workflow
```

**How to obtain:**
- Check your VPS provider dashboard
- Or run `curl ifconfig.me` on your VPS

#### VPS_USER

```
Description: SSH username for VPS access
Example: root or ubuntu or cortexbuild
Used in: deploy-vps.yml workflow
```

**Common values:**
- Ubuntu servers: `ubuntu`
- Debian servers: `root` or `admin`
- Custom user: Your created username

#### VPS_SSH_KEY

```
Description: Private SSH key for passwordless VPS access
Format: Full content of private key file (starts with -----BEGIN OPENSSH PRIVATE KEY-----)
Used in: deploy-vps.yml workflow
```

**How to generate:**

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@cortexbuildpro" -f ~/.ssh/cortexbuild_deploy

# Copy private key (this goes in VPS_SSH_KEY secret)
cat ~/.ssh/cortexbuild_deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/cortexbuild_deploy.pub user@your-vps-ip
```

**Important:**
- Copy the ENTIRE private key including headers
- Keep the formatting and line breaks
- Never share this key
- Store backup securely offline

### 2. Database Secrets

#### DATABASE_URL

```
Description: PostgreSQL connection string
Example: postgresql://cortexbuild:PASSWORD@postgres:5432/cortexbuild?schema=public
Used in: All workflows requiring database access
```

**Production format:**
```
postgresql://username:password@host:port/database?schema=public
```

**Security notes:**
- Use a strong, unique password
- Different from development database
- Minimum 24 characters recommended

#### POSTGRES_PASSWORD

```
Description: Password for PostgreSQL database
Example: A3f7K9mP2nQ8rT5vW1xY4z
Used in: Docker Compose and deployment scripts
```

**How to generate:**
```bash
openssl rand -base64 32
```

### 3. NextAuth Secrets

#### NEXTAUTH_SECRET

```
Description: Secret key for JWT encryption and session management
Example: Generated random string of 32+ characters
Used in: Application authentication
```

**How to generate:**
```bash
openssl rand -base64 32
```

**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Unique per environment
- Change every 90 days

#### NEXTAUTH_URL

```
Description: Public URL of your application
Example: https://www.cortexbuildpro.com
Used in: OAuth callbacks and session management
```

**Format:**
- Production: `https://your-domain.com` (HTTPS required)
- Include www if used
- No trailing slash

### 4. AWS S3 Secrets

#### AWS_ACCESS_KEY_ID

```
Description: AWS IAM user access key ID
Example: AKIAIOSFODNN7EXAMPLE
Used in: File upload operations
```

**How to obtain:**
1. Log in to AWS Console
2. Navigate to IAM → Users
3. Select or create a user for CortexBuild
4. Security credentials → Create access key
5. Copy Access Key ID

#### AWS_SECRET_ACCESS_KEY

```
Description: AWS IAM user secret access key
Example: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Used in: File upload operations
```

**How to obtain:**
- Created together with AWS_ACCESS_KEY_ID
- **Shown only once** - copy immediately
- Store securely - cannot be retrieved later

#### AWS_REGION

```
Description: AWS region where S3 bucket is located
Example: us-west-2
Used in: S3 operations
```

**Common regions:**
- `us-east-1` - US East (N. Virginia)
- `us-west-2` - US West (Oregon)
- `eu-west-1` - Europe (Ireland)
- `ap-southeast-1` - Asia Pacific (Singapore)

#### AWS_BUCKET_NAME

```
Description: Name of your S3 bucket
Example: cortexbuild-prod-files
Used in: File storage operations
```

#### AWS_FOLDER_PREFIX

```
Description: Folder prefix for organizing files in S3
Example: production/ or cortexbuild/
Used in: File organization
```

### 5. AbacusAI Secrets

#### ABACUSAI_API_KEY

```
Description: API key for AbacusAI services
Example: abacus_xxxxxxxxxxxxxxxxxxxxx
Used in: AI features and notifications
```

**How to obtain:**
1. Sign up at https://abacus.ai/
2. Navigate to Settings → API Keys
3. Create new API key
4. Copy immediately (shown only once)

---

## Optional Secrets

These secrets enable additional features but are not required for basic functionality.

### 1. Google OAuth

#### GOOGLE_CLIENT_ID

```
Description: Google OAuth client ID
Example: 1234567890-abcdefghijklmnop.apps.googleusercontent.com
Used in: Google Sign-In feature
```

#### GOOGLE_CLIENT_SECRET

```
Description: Google OAuth client secret
Example: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
Used in: Google Sign-In feature
```

**How to obtain:**
1. Go to https://console.cloud.google.com/
2. Create a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Configure authorized redirect URIs
6. Copy Client ID and Secret

### 2. SendGrid Email

#### SENDGRID_API_KEY

```
Description: SendGrid API key for email delivery
Example: SG.xxxxxxxxxxxxxxxxxxxxxxxx
Used in: Email notifications and invitations
```

**How to obtain:**
1. Sign up at https://sendgrid.com/
2. Verify sender identity
3. Settings → API Keys → Create API Key
4. Set permissions (Full Access or Mail Send)
5. Copy key immediately

#### SENDGRID_FROM_EMAIL

```
Description: Email address to send from
Example: noreply@cortexbuildpro.com
Used in: Email sender address
```

**Requirements:**
- Must be verified in SendGrid
- Domain authentication recommended

#### SENDGRID_FROM_NAME

```
Description: Display name for sent emails
Example: CortexBuild Pro
Used in: Email sender name
```

### 3. Custom SMTP

Alternative to SendGrid.

#### SMTP_HOST

```
Description: SMTP server hostname
Example: smtp.gmail.com
Used in: Email delivery
```

#### SMTP_PORT

```
Description: SMTP server port
Example: 587
Used in: Email delivery
```

#### SMTP_USER

```
Description: SMTP authentication username
Example: your-email@gmail.com
Used in: SMTP authentication
```

#### SMTP_PASSWORD

```
Description: SMTP authentication password
Example: your-app-specific-password
Used in: SMTP authentication
```

### 4. Additional Configuration

#### DOMAIN

```
Description: Your application domain (without www)
Example: cortexbuildpro.com
Used in: SSL certificate generation and configuration
```

#### SSL_EMAIL

```
Description: Email for SSL certificate notifications
Example: admin@cortexbuildpro.com
Used in: Let's Encrypt SSL certificates
```

#### WEBSOCKET_PORT

```
Description: Port for WebSocket connections
Example: 3000
Used in: Real-time features
```

#### NEXT_PUBLIC_WEBSOCKET_URL

```
Description: WebSocket server URL
Example: https://www.cortexbuildpro.com
Used in: Client-side WebSocket connection
```

---

## How to Add Secrets

### Method 1: GitHub Web Interface

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click **Settings** (top menu)

2. **Access Secrets Section**
   - In the left sidebar, click **Secrets and variables**
   - Click **Actions**

3. **Add New Secret**
   - Click **New repository secret**
   - Enter secret name (e.g., `VPS_HOST`)
   - Paste secret value
   - Click **Add secret**

4. **Repeat for All Secrets**
   - Add each required and optional secret
   - Use exact names as documented

### Method 2: GitHub CLI

```bash
# Install GitHub CLI (if not installed)
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu/Debian

# Authenticate
gh auth login

# Add secrets from command line
gh secret set VPS_HOST --body "192.168.1.100"
gh secret set VPS_USER --body "ubuntu"
gh secret set POSTGRES_PASSWORD --body "$(openssl rand -base64 32)"

# Add secret from file (useful for SSH keys)
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy

# Add multiple secrets at once from .env file
while IFS='=' read -r key value; do
  [[ $key =~ ^[A-Z_]+$ ]] && gh secret set "$key" --body "$value"
done < production.secrets
```

### Method 3: Bulk Import Script

Create a `secrets.txt` file (DO NOT commit this file):

```bash
#!/bin/bash
# DO NOT COMMIT THIS FILE - Add to .gitignore

# Required Secrets
gh secret set VPS_HOST --body "your-vps-ip"
gh secret set VPS_USER --body "ubuntu"
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy
gh secret set DATABASE_URL --body "postgresql://user:pass@host:5432/db"
gh secret set POSTGRES_PASSWORD --body "your-secure-password"
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set NEXTAUTH_URL --body "https://your-domain.com"
gh secret set AWS_ACCESS_KEY_ID --body "your-access-key-id"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret-access-key"
gh secret set AWS_REGION --body "us-west-2"
gh secret set AWS_BUCKET_NAME --body "your-bucket"
gh secret set AWS_FOLDER_PREFIX --body "production/"
gh secret set ABACUSAI_API_KEY --body "your-abacus-key"

# Optional Secrets (uncomment if needed)
# gh secret set GOOGLE_CLIENT_ID --body "your-client-id"
# gh secret set GOOGLE_CLIENT_SECRET --body "your-client-secret"
# gh secret set SENDGRID_API_KEY --body "SG.your-key"
# gh secret set SENDGRID_FROM_EMAIL --body "noreply@your-domain.com"
# gh secret set SENDGRID_FROM_NAME --body "CortexBuild Pro"
```

Make it executable and run:
```bash
chmod +x secrets.txt
./secrets.txt
```

---

## Secrets for Different Workflows

### VPS Deployment Workflow (`deploy-vps.yml`)

**Required:**
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `POSTGRES_PASSWORD`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `ABACUSAI_API_KEY`

**Optional:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SENDGRID_API_KEY`
- `DOMAIN`
- `SSL_EMAIL`

### Docker Build & Publish Workflow (`docker-publish.yml`)

**Required:**
- `GITHUB_TOKEN` (automatically provided)

**Optional:**
- None (builds public Docker image)

### Database Migration Workflow

**Required:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

---

## Security Best Practices

### 1. Secret Naming Conventions

✅ **Do:**
- Use UPPERCASE_WITH_UNDERSCORES
- Be descriptive (e.g., `VPS_SSH_KEY` not `KEY`)
- Follow consistent patterns
- Match environment variable names

❌ **Don't:**
- Use lowercase or mixed case
- Use generic names (e.g., `PASSWORD`)
- Include sensitive data in name
- Use spaces or special characters

### 2. Secret Values

✅ **Do:**
- Generate strong, random values
- Use minimum 32 characters for secrets
- Different values for each environment
- Rotate regularly (every 90 days)

❌ **Don't:**
- Reuse passwords across services
- Use weak or predictable values
- Share secrets between repositories
- Store secrets in code comments

### 3. Access Control

✅ **Do:**
- Limit repository access
- Use organization secrets for shared values
- Review secret access regularly
- Remove unused secrets

❌ **Don't:**
- Give unnecessary access
- Share secrets via insecure channels
- Store secrets in issues or PRs
- Log secret values

### 4. Secret Rotation

Schedule regular secret rotation:

```bash
# Every 90 days, generate new secrets:

# 1. Generate new NEXTAUTH_SECRET
NEW_SECRET=$(openssl rand -base64 32)
gh secret set NEXTAUTH_SECRET --body "$NEW_SECRET"

# 2. Generate new database password
NEW_DB_PASS=$(openssl rand -base64 32)
gh secret set POSTGRES_PASSWORD --body "$NEW_DB_PASS"

# 3. Rotate AWS keys (via AWS Console)
# 4. Update deployment immediately after rotation
```

### 5. Audit Trail

Monitor secret usage:

1. **Check Workflow Runs**
   - Actions tab → Select workflow
   - Review which secrets were used
   - Check for failed authentications

2. **Review Access Logs**
   - Settings → Audit log
   - Filter by secret operations
   - Investigate suspicious activity

---

## Verification

### Verify Secrets Are Set

```bash
# List all secrets (values hidden)
gh secret list

# Expected output:
VPS_HOST                 Updated 2026-01-28
VPS_USER                 Updated 2026-01-28
VPS_SSH_KEY              Updated 2026-01-28
DATABASE_URL             Updated 2026-01-28
POSTGRES_PASSWORD        Updated 2026-01-28
NEXTAUTH_SECRET          Updated 2026-01-28
NEXTAUTH_URL             Updated 2026-01-28
AWS_ACCESS_KEY_ID        Updated 2026-01-28
AWS_SECRET_ACCESS_KEY    Updated 2026-01-28
AWS_REGION               Updated 2026-01-28
AWS_BUCKET_NAME          Updated 2026-01-28
AWS_FOLDER_PREFIX        Updated 2026-01-28
ABACUSAI_API_KEY         Updated 2026-01-28
```

### Test Secrets in Workflow

Create a test workflow to verify secrets are accessible:

```yaml
name: Test Secrets
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Required Secrets
        run: |
          echo "Testing secrets (values hidden)..."
          
          [ -z "${{ secrets.VPS_HOST }}" ] && echo "❌ VPS_HOST missing" || echo "✅ VPS_HOST set"
          [ -z "${{ secrets.VPS_USER }}" ] && echo "❌ VPS_USER missing" || echo "✅ VPS_USER set"
          [ -z "${{ secrets.VPS_SSH_KEY }}" ] && echo "❌ VPS_SSH_KEY missing" || echo "✅ VPS_SSH_KEY set"
          [ -z "${{ secrets.DATABASE_URL }}" ] && echo "❌ DATABASE_URL missing" || echo "✅ DATABASE_URL set"
          [ -z "${{ secrets.POSTGRES_PASSWORD }}" ] && echo "❌ POSTGRES_PASSWORD missing" || echo "✅ POSTGRES_PASSWORD set"
          [ -z "${{ secrets.NEXTAUTH_SECRET }}" ] && echo "❌ NEXTAUTH_SECRET missing" || echo "✅ NEXTAUTH_SECRET set"
          [ -z "${{ secrets.NEXTAUTH_URL }}" ] && echo "❌ NEXTAUTH_URL missing" || echo "✅ NEXTAUTH_URL set"
          [ -z "${{ secrets.AWS_ACCESS_KEY_ID }}" ] && echo "❌ AWS_ACCESS_KEY_ID missing" || echo "✅ AWS_ACCESS_KEY_ID set"
          [ -z "${{ secrets.AWS_SECRET_ACCESS_KEY }}" ] && echo "❌ AWS_SECRET_ACCESS_KEY missing" || echo "✅ AWS_SECRET_ACCESS_KEY set"
          [ -z "${{ secrets.ABACUSAI_API_KEY }}" ] && echo "❌ ABACUSAI_API_KEY missing" || echo "✅ ABACUSAI_API_KEY set"
```

---

## Troubleshooting

### Secret Not Found in Workflow

**Problem:** Workflow fails with "secret not found" error

**Solutions:**
1. Verify secret name matches exactly (case-sensitive)
2. Check secret is set at repository level (not organization)
3. Refresh secrets list: `gh secret list`
4. Re-add the secret if needed

### SSH Key Authentication Failed

**Problem:** VPS deployment fails with SSH authentication error

**Solutions:**
1. Verify SSH key format:
   ```bash
   # Should start with:
   -----BEGIN OPENSSH PRIVATE KEY-----
   # or
   -----BEGIN RSA PRIVATE KEY-----
   ```

2. Ensure key includes full content with line breaks
3. Test key locally:
   ```bash
   ssh -i ~/.ssh/cortexbuild_deploy user@vps-ip
   ```

4. Verify public key is in VPS `~/.ssh/authorized_keys`

### Database Connection Failed

**Problem:** Database connection fails in workflow

**Solutions:**
1. Verify `DATABASE_URL` format:
   ```
   postgresql://user:password@host:port/database?schema=public
   ```

2. Check password has no special characters that need URL encoding
3. Test connection locally:
   ```bash
   psql "$DATABASE_URL"
   ```

4. Ensure database server allows connections from GitHub Actions IPs

### AWS S3 Access Denied

**Problem:** File upload fails with 403 Forbidden

**Solutions:**
1. Verify AWS credentials are correct
2. Check IAM user has S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name/*",
           "arn:aws:s3:::your-bucket-name"
         ]
       }
     ]
   }
   ```

3. Verify bucket name and region match
4. Check bucket policy allows access

### NextAuth Secret Issues

**Problem:** Authentication fails or constant re-login required

**Solutions:**
1. Ensure `NEXTAUTH_SECRET` is at least 32 characters
2. Verify same secret is used across all instances
3. Check secret doesn't contain quotes or escape characters
4. Regenerate if compromised:
   ```bash
   gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
   ```

---

## Complete Secrets Checklist

Use this checklist to ensure all secrets are configured:

### Required Secrets ✅

- [ ] `VPS_HOST` - VPS IP address or hostname
- [ ] `VPS_USER` - SSH username for VPS
- [ ] `VPS_SSH_KEY` - Private SSH key for VPS access
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `POSTGRES_PASSWORD` - Database password
- [ ] `NEXTAUTH_SECRET` - NextAuth secret (32+ chars)
- [ ] `NEXTAUTH_URL` - Public application URL
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `AWS_REGION` - S3 bucket region
- [ ] `AWS_BUCKET_NAME` - S3 bucket name
- [ ] `AWS_FOLDER_PREFIX` - S3 folder prefix
- [ ] `ABACUSAI_API_KEY` - AbacusAI API key

### Optional Secrets ⚙️

- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- [ ] `SENDGRID_API_KEY` - SendGrid API key
- [ ] `SENDGRID_FROM_EMAIL` - SendGrid sender email
- [ ] `SENDGRID_FROM_NAME` - SendGrid sender name
- [ ] `SMTP_HOST` - Custom SMTP host
- [ ] `SMTP_PORT` - Custom SMTP port
- [ ] `SMTP_USER` - Custom SMTP username
- [ ] `SMTP_PASSWORD` - Custom SMTP password
- [ ] `DOMAIN` - Application domain
- [ ] `SSL_EMAIL` - SSL certificate email
- [ ] `WEBSOCKET_PORT` - WebSocket port
- [ ] `NEXT_PUBLIC_WEBSOCKET_URL` - WebSocket URL

---

## Quick Setup Commands

Complete setup using GitHub CLI:

```bash
#!/bin/bash
# Quick GitHub Secrets Setup
# Replace values with your actual credentials

echo "Setting up GitHub secrets for CortexBuild Pro..."

# VPS Configuration
gh secret set VPS_HOST --body "YOUR_VPS_IP"
gh secret set VPS_USER --body "ubuntu"
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy

# Database
gh secret set POSTGRES_PASSWORD --body "$(openssl rand -base64 32)"
gh secret set DATABASE_URL --body "postgresql://cortexbuild:PASSWORD@postgres:5432/cortexbuild?schema=public"

# NextAuth
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set NEXTAUTH_URL --body "https://your-domain.com"

# AWS S3
read -p "AWS Access Key ID: " AWS_KEY
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_KEY"
read -s -p "AWS Secret Access Key: " AWS_SECRET
echo
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET"
gh secret set AWS_REGION --body "us-west-2"
gh secret set AWS_BUCKET_NAME --body "your-bucket"
gh secret set AWS_FOLDER_PREFIX --body "production/"

# AbacusAI
read -s -p "AbacusAI API Key: " ABACUS_KEY
echo
gh secret set ABACUSAI_API_KEY --body "$ABACUS_KEY"

echo "✅ All required secrets configured!"
echo "Run 'gh secret list' to verify"
```

---

## Next Steps

After configuring secrets:

1. ✅ Verify all secrets are set: `gh secret list`
2. ✅ Test deployment workflow manually
3. ✅ Set up automated deployments
4. ✅ Configure secret rotation schedule
5. ✅ Document custom secrets (if any)
6. ✅ Review access permissions

---

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Environment Setup Guide](ENVIRONMENT_SETUP_GUIDE.md)
- [Security Checklist](SECURITY_CHECKLIST.md)
- [VPS Deployment Guide](DEPLOY_TO_VPS.md)
- [API Setup Guide](API_SETUP_GUIDE.md)

---

**Last Updated:** January 28, 2026  
**Version:** 1.0.0
