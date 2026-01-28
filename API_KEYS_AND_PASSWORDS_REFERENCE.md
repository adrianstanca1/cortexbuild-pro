# 🔐 CortexBuild Pro - Complete API Keys and Passwords Reference

**Last Updated:** January 28, 2026  
**Purpose:** Comprehensive reference for all API keys, passwords, and secrets needed for CortexBuild Pro

---

## 📋 Quick Reference

This document consolidates all information about API keys, passwords, and secrets required for CortexBuild Pro. It provides clear instructions on where to obtain each credential and how to configure them.

### Document Structure
1. [Overview](#overview) - What this document covers
2. [Required Credentials](#required-credentials) - Must have for basic functionality
3. [Optional Credentials](#optional-credentials) - Enhanced features
4. [Where to Store Secrets](#where-to-store-secrets) - Configuration files
5. [GitHub Repository Secrets](#github-repository-secrets) - CI/CD automation
6. [How to Obtain Each Credential](#how-to-obtain-each-credential) - Detailed setup
7. [Quick Setup Checklist](#quick-setup-checklist) - Step-by-step guide
8. [Verification](#verification) - Test your configuration
9. [Security Best Practices](#security-best-practices) - Keep secrets safe

---

## Overview

CortexBuild Pro requires various API keys, passwords, and secrets to function properly. These credentials are used for:

- **Database access** - PostgreSQL for data storage
- **Authentication** - NextAuth for user sessions
- **File storage** - AWS S3 for uploads
- **AI features** - AbacusAI for AI capabilities
- **Email delivery** - SendGrid or SMTP for notifications
- **Social login** - Google OAuth for sign-in
- **Deployment** - VPS access via SSH

### Credential Categories

**🔴 REQUIRED** - Application won't start without these
**🟡 OPTIONAL** - Enable additional features but not required for basic functionality

---

## Required Credentials

These credentials **MUST** be configured for the application to function.

### 1. Database Credentials 🔴

#### DATABASE_URL
```
Description: PostgreSQL database connection string
Format: postgresql://username:password@host:port/database?schema=public
Example (Development): postgresql://cortexbuild:devpass@localhost:5432/cortexbuild?schema=public
Example (Production): postgresql://cortexbuild:SECURE_PASS@postgres:5432/cortexbuild?schema=public
Example (Hosted): postgresql://role_abc:pass@db.hosteddb.example.io:5432/dbname

Where to use:
  - nextjs_space/.env (development)
  - deployment/.env (production)
  - GitHub Secret: DATABASE_URL (for CI/CD)

Security:
  - Use strong password (24+ characters)
  - Different passwords for dev/prod
  - Never commit to Git
```

#### POSTGRES_PASSWORD
```
Description: Password for PostgreSQL database user
Example: A3f7K9mP2nQ8rT5vW1xY4zB6cD8eF0gH
Generate: openssl rand -base64 32

Where to use:
  - deployment/.env (Docker Compose)
  - GitHub Secret: POSTGRES_PASSWORD (for automated deployment)

Security:
  - Minimum 24 characters
  - Must match password in DATABASE_URL
  - Rotate every 90 days
```

### 2. Authentication Secrets 🔴

#### NEXTAUTH_SECRET
```
Description: Secret key for JWT encryption and session management
Requirements: MUST be at least 32 characters, cryptographically random
Generate: openssl rand -base64 32
Example: 3eZQkW8rX9mP5nT7vY2bC4dF6gH8jK0lM1nQ3sV5wX7z

Where to use:
  - nextjs_space/.env (development)
  - deployment/.env (production)
  - GitHub Secret: NEXTAUTH_SECRET (for CI/CD)

Security:
  - MUST be 32+ characters
  - Different for each environment
  - Rotate every 90 days
  - Never reuse across projects
```

#### NEXTAUTH_URL
```
Description: Public URL of your application
Example (Development): http://localhost:3000
Example (Production): https://www.cortexbuildpro.com
Example (Staging): https://staging.cortexbuildpro.com

Where to use:
  - nextjs_space/.env (development)
  - deployment/.env (production)
  - GitHub Secret: NEXTAUTH_URL (for CI/CD)

Requirements:
  - Must match your actual domain
  - Use HTTPS in production
  - No trailing slash
  - Include subdomain if used (www, app, etc.)
```

### 3. AWS S3 Credentials 🔴

Required for file uploads (documents, images, PDFs).

#### AWS_ACCESS_KEY_ID
```
Description: AWS IAM user access key ID for S3 operations
Example: AKIAIOSFODNN7EXAMPLE
Format: Starts with AKIA

Where to obtain:
  1. Log in to AWS Console (https://console.aws.amazon.com/)
  2. Navigate to IAM → Users
  3. Create new user or select existing user
  4. Security credentials tab → Create access key
  5. Select "Application running on AWS compute service" or "Third-party service"
  6. Copy Access Key ID

Where to use:
  - nextjs_space/.env (development)
  - deployment/.env (production)
  - GitHub Secret: AWS_ACCESS_KEY_ID (for CI/CD)

Security:
  - Create dedicated IAM user for CortexBuild
  - Grant only S3 permissions (principle of least privilege)
  - Rotate every 90 days
  - Never share or commit to Git
```

#### AWS_SECRET_ACCESS_KEY
```
Description: AWS IAM user secret access key
Example: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

Where to obtain:
  - Created together with AWS_ACCESS_KEY_ID
  - SHOWN ONLY ONCE during key creation
  - Must copy immediately and store securely

Where to use:
  - nextjs_space/.env (development)
  - deployment/.env (production)
  - GitHub Secret: AWS_SECRET_ACCESS_KEY (for CI/CD)

Security:
  - Cannot be retrieved after initial creation
  - If lost, must create new access key pair
  - Rotate every 90 days
  - Never share or commit to Git
```

#### AWS_REGION
```
Description: AWS region where your S3 bucket is located
Example: us-west-2
Common regions:
  - us-east-1 - US East (N. Virginia)
  - us-west-2 - US West (Oregon)
  - eu-west-1 - Europe (Ireland)
  - ap-southeast-1 - Asia Pacific (Singapore)

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: AWS_REGION

How to find:
  - AWS Console → S3 → Your bucket → Properties → AWS Region
```

#### AWS_BUCKET_NAME
```
Description: Name of your S3 bucket for file storage
Example: cortexbuild-prod-files
Requirements:
  - Must be globally unique across all AWS accounts
  - 3-63 characters
  - Lowercase letters, numbers, hyphens only
  - No underscores or spaces

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: AWS_BUCKET_NAME

How to create:
  1. AWS Console → S3 → Create bucket
  2. Choose unique name
  3. Select region (same as AWS_REGION)
  4. Configure CORS (see below)
  5. Set permissions (private recommended)
```

#### AWS_FOLDER_PREFIX
```
Description: Folder prefix for organizing files in S3
Example: production/ or cortexbuild/prod/
Default: your-folder-prefix/

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: AWS_FOLDER_PREFIX

Purpose:
  - Organize files within bucket
  - Separate environments (dev/, staging/, production/)
  - Trailing slash recommended
```

**AWS S3 CORS Configuration (Required):**
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

**Required IAM Policy for S3 Access:**
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

### 4. AbacusAI API Key 🔴

Required for AI features and notification fallback.

#### ABACUSAI_API_KEY
```
Description: API key for AbacusAI services (AI features, notifications)
Example: abacus_xxxxxxxxxxxxxxxxxxxxx
Format: Starts with "abacus_"

Where to obtain:
  1. Sign up at https://abacus.ai/
  2. Complete account verification
  3. Navigate to Settings → API Keys
  4. Click "Create new API key"
  5. Copy key immediately (shown only once)
  6. Store securely

Where to use:
  - nextjs_space/.env (development)
  - deployment/.env (production)
  - GitHub Secret: ABACUSAI_API_KEY (for CI/CD)

Features enabled:
  - AI-powered features
  - Email notification fallback (if SendGrid not configured)
  - Push notifications
  - Data analysis

Security:
  - Shown only once during creation
  - Store backup securely
  - If lost, create new key and update everywhere
  - Monitor usage in AbacusAI dashboard
```

---

## Optional Credentials

These credentials enable additional features but are not required for basic functionality.

### 5. Google OAuth (Social Login) 🟡

Enables "Sign in with Google" functionality.

#### GOOGLE_CLIENT_ID
```
Description: Google OAuth 2.0 client ID
Example: 1234567890-abc.apps.googleusercontent.com
Format: Ends with .apps.googleusercontent.com

Where to obtain:
  1. Go to https://console.cloud.google.com/
  2. Create new project or select existing project
  3. Enable Google+ API (APIs & Services → Library → Google+ API)
  4. Navigate to Credentials
  5. Create OAuth 2.0 Client ID
  6. Application type: Web application
  7. Add authorized redirect URIs:
     - Development: http://localhost:3000/api/auth/callback/google
     - Production: https://your-domain.com/api/auth/callback/google
  8. Copy Client ID

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: GOOGLE_CLIENT_ID
```

#### GOOGLE_CLIENT_SECRET
```
Description: Google OAuth 2.0 client secret
Example: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
Format: Starts with GOCSPX-

Where to obtain:
  - Created together with GOOGLE_CLIENT_ID
  - Shown on credentials page
  - Can be viewed/regenerated later

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: GOOGLE_CLIENT_SECRET

Security:
  - Keep confidential
  - Regenerate if compromised
  - Different for each environment recommended
```

### 6. SendGrid Email Service 🟡

Email delivery service for notifications and invitations.

#### SENDGRID_API_KEY
```
Description: SendGrid API key for email delivery
Example: SG.xxxxxxxxxxxxxxxxxxxxxxxx
Format: Starts with "SG."

Where to obtain:
  1. Sign up at https://sendgrid.com/ (Free tier: 100 emails/day)
  2. Complete sender verification (Settings → Sender Authentication)
  3. Navigate to Settings → API Keys
  4. Click "Create API Key"
  5. Name: "CortexBuild Pro Production" (or similar)
  6. Permission Level: Full Access or Mail Send only
  7. Copy key immediately (shown only once)

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: SENDGRID_API_KEY

Note: If not configured, application falls back to AbacusAI for email delivery
```

#### SENDGRID_FROM_EMAIL
```
Description: Email address to send from
Example: noreply@your-domain.com
Requirements:
  - Must be verified in SendGrid
  - Domain authentication recommended for better deliverability

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: SENDGRID_FROM_EMAIL

Setup:
  1. SendGrid → Settings → Sender Authentication
  2. Verify Single Sender or Authenticate Domain
  3. Use verified email here
```

#### SENDGRID_FROM_NAME
```
Description: Display name for sent emails
Example: CortexBuild Pro
Default: CortexBuild Pro

Where to use:
  - nextjs_space/.env
  - deployment/.env
  - GitHub Secret: SENDGRID_FROM_NAME
```

### 7. Custom SMTP Email (Alternative to SendGrid) 🟡

Use your own SMTP server for email delivery.

#### SMTP_HOST
```
Description: SMTP server hostname
Example: smtp.gmail.com, smtp.office365.com
Common providers:
  - Gmail: smtp.gmail.com
  - Outlook/Office 365: smtp.office365.com
  - Custom server: mail.your-domain.com
```

#### SMTP_PORT
```
Description: SMTP server port
Example: 587 (TLS) or 465 (SSL)
Recommended: 587 (STARTTLS)
```

#### SMTP_USER
```
Description: SMTP authentication username
Example: your-email@gmail.com
Usually: Your email address
```

#### SMTP_PASSWORD
```
Description: SMTP authentication password
Example: App-specific password for Gmail

Gmail users:
  1. Enable 2FA on Google Account
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate app password for "Mail"
  4. Use generated password here (NOT your regular Gmail password)
```

#### EMAIL_FROM
```
Description: Email address to use as sender
Example: noreply@your-domain.com
```

### 8. VPS Deployment Credentials 🟡

Required for automated VPS deployment via GitHub Actions.

#### VPS_HOST
```
Description: IP address or hostname of your VPS server
Example: 192.168.1.100 or vps.cortexbuildpro.com

Where to find:
  - VPS provider dashboard
  - Or run on VPS: curl ifconfig.me

Where to use:
  - GitHub Secret: VPS_HOST (for automated deployment)
```

#### VPS_USER or VPS_USERNAME
```
Description: SSH username for VPS access
Example: root, ubuntu, or cortexbuild

Common values:
  - Ubuntu servers: ubuntu
  - Debian servers: root or admin
  - Custom user: Your created username

Where to use:
  - GitHub Secret: VPS_USER or VPS_USERNAME
```

#### VPS_SSH_KEY
```
Description: Private SSH key for passwordless authentication
Format: Complete private key including -----BEGIN and -----END lines

How to generate:
  # On your local machine
  ssh-keygen -t ed25519 -C "github-actions@cortexbuildpro" -f ~/.ssh/cortexbuild_deploy
  
  # Copy public key to VPS
  ssh-copy-id -i ~/.ssh/cortexbuild_deploy.pub user@your-vps-ip
  
  # Use private key content as secret value
  cat ~/.ssh/cortexbuild_deploy

Where to use:
  - GitHub Secret: VPS_SSH_KEY

Important:
  - Copy ENTIRE private key including headers
  - Keep formatting and line breaks
  - Never share this key
  - Store backup securely offline
  - Test locally before adding to GitHub:
    ssh -i ~/.ssh/cortexbuild_deploy user@vps-ip
```

#### VPS_PORT (Optional)
```
Description: SSH port (if not default 22)
Example: 22
Default: 22
```

### 9. Additional Configuration 🟡

#### WEB_APP_ID
```
Description: AbacusAI web application ID
Example: your-web-app-id
Used for: AbacusAI hosted features
Where to find: AbacusAI dashboard → Applications
```

#### Notification Template IDs
```
Description: Notification template IDs for AbacusAI push notifications
Variables:
  - NOTIF_ID_MILESTONE_DEADLINE_REMINDER
  - NOTIF_ID_TOOLBOX_TALK_COMPLETED
  - NOTIF_ID_MEWP_CHECK_COMPLETED
  - NOTIF_ID_TOOL_CHECK_COMPLETED

Where to find: AbacusAI dashboard → Notifications → Templates
Required: Only if using AbacusAI notification service
```

#### DOMAIN
```
Description: Your production domain (without www or https://)
Example: cortexbuildpro.com
Used for: SSL certificate generation, configuration
```

#### SSL_EMAIL
```
Description: Email for SSL certificate notifications
Example: admin@cortexbuildpro.com
Used for: Let's Encrypt renewal notifications
```

#### NEXT_PUBLIC_WEBSOCKET_URL
```
Description: WebSocket server URL for real-time features
Example (Development): http://localhost:3000
Example (Production): https://www.cortexbuildpro.com
Format: Use HTTPS (WSS) in production
Note: NEXT_PUBLIC_ prefix makes this available in browser
```

#### WEBSOCKET_PORT
```
Description: WebSocket server port
Example: 3000
Default: 3000
```

---

## Where to Store Secrets

### 1. Local Development: `nextjs_space/.env`

```bash
# Navigate to project directory
cd cortexbuild-pro/nextjs_space

# Copy example file
cp .env.example .env

# Edit with your values
nano .env

# Secure file permissions
chmod 600 .env
```

**Example Development .env:**
```env
# Database (local PostgreSQL)
DATABASE_URL="postgresql://cortexbuild:devpass@localhost:5432/cortexbuild?schema=public"

# NextAuth
NEXTAUTH_SECRET="development-secret-32-chars-minimum-generated-by-openssl"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (dev bucket)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="cortexbuild-dev-files"
AWS_FOLDER_PREFIX="dev/"

# AbacusAI (dev key)
ABACUSAI_API_KEY="abacus_dev_..."

# Optional: Google OAuth (development)
# GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
# GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

### 2. Production Docker: `deployment/.env`

```bash
# Navigate to deployment directory
cd cortexbuild-pro/deployment

# Copy example file
cp .env.example .env

# Edit with production values
nano .env

# Secure file permissions
chmod 600 .env
```

**Example Production .env:**
```env
# PostgreSQL (Docker container)
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=GENERATED_SECURE_PASSWORD_32_CHARS
POSTGRES_DB=cortexbuild

# Database URL (matches POSTGRES_* above)
DATABASE_URL="postgresql://cortexbuild:GENERATED_SECURE_PASSWORD_32_CHARS@postgres:5432/cortexbuild?schema=public"

# NextAuth
NEXTAUTH_SECRET=GENERATED_SECURE_SECRET_32_CHARS
NEXTAUTH_URL=https://www.cortexbuildpro.com

# Domain
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com

# AWS S3 (production bucket)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="cortexbuild-prod-files"
AWS_FOLDER_PREFIX="production/"

# AbacusAI (production key)
ABACUSAI_API_KEY="abacus_prod_..."

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=https://www.cortexbuildpro.com
WEBSOCKET_PORT=3000

# Optional: Email (production)
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@cortexbuildpro.com"
SENDGRID_FROM_NAME="CortexBuild Pro"
```

### 3. GitHub Repository Secrets

For automated CI/CD deployment, add secrets to GitHub:

```bash
# Install GitHub CLI (if not installed)
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu/Debian

# Authenticate
gh auth login

# Add secrets
gh secret set VPS_HOST --body "192.168.1.100"
gh secret set VPS_USER --body "ubuntu"
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set POSTGRES_PASSWORD --body "$(openssl rand -base64 32)"
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set NEXTAUTH_URL --body "https://your-domain.com"
gh secret set AWS_ACCESS_KEY_ID --body "AKIA..."
gh secret set AWS_SECRET_ACCESS_KEY --body "..."
gh secret set AWS_REGION --body "us-west-2"
gh secret set AWS_BUCKET_NAME --body "your-bucket"
gh secret set AWS_FOLDER_PREFIX --body "production/"
gh secret set ABACUSAI_API_KEY --body "abacus_..."

# Verify secrets are set
gh secret list
```

---

## Quick Setup Checklist

Follow these steps to configure all credentials:

### ✅ Step 1: Database Setup

- [ ] Set up PostgreSQL database (local, Docker, or hosted)
- [ ] Note connection details (host, port, username, password, database name)
- [ ] Create DATABASE_URL connection string
- [ ] Test connection: `psql "$DATABASE_URL"`

### ✅ Step 2: Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate database password (if needed)
openssl rand -base64 32
```

- [ ] Generate NEXTAUTH_SECRET
- [ ] Generate POSTGRES_PASSWORD (if self-hosted)
- [ ] Save these securely

### ✅ Step 3: AWS S3 Setup

- [ ] Log in to AWS Console
- [ ] Create S3 bucket (or use existing)
- [ ] Configure CORS on bucket
- [ ] Create IAM user for CortexBuild
- [ ] Attach S3 policy to user
- [ ] Generate access keys
- [ ] Save AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

### ✅ Step 4: AbacusAI Setup

- [ ] Sign up at https://abacus.ai/
- [ ] Complete account verification
- [ ] Navigate to Settings → API Keys
- [ ] Create new API key
- [ ] Save ABACUSAI_API_KEY securely

### ✅ Step 5: Create Environment Files

**Development:**
```bash
cd cortexbuild-pro/nextjs_space
cp .env.example .env
nano .env  # Add your credentials
chmod 600 .env
```

- [ ] Create nextjs_space/.env
- [ ] Add all required credentials
- [ ] Secure file permissions

**Production:**
```bash
cd cortexbuild-pro/deployment
cp .env.example .env
nano .env  # Add your credentials
chmod 600 .env
```

- [ ] Create deployment/.env
- [ ] Add all required credentials
- [ ] Secure file permissions

### ✅ Step 6: Optional Services (If Needed)

**Google OAuth:**
- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add redirect URIs
- [ ] Save GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

**SendGrid:**
- [ ] Sign up at https://sendgrid.com/
- [ ] Verify sender identity
- [ ] Create API key
- [ ] Save SENDGRID_API_KEY

### ✅ Step 7: VPS Setup (For Deployment)

- [ ] Set up VPS server
- [ ] Note VPS_HOST (IP or hostname)
- [ ] Note VPS_USER (SSH username)
- [ ] Generate SSH key pair
- [ ] Copy public key to VPS
- [ ] Test SSH connection

### ✅ Step 8: Configure GitHub Secrets

- [ ] Install GitHub CLI
- [ ] Authenticate: `gh auth login`
- [ ] Add all required secrets
- [ ] Verify: `gh secret list`

### ✅ Step 9: Verification

```bash
# Verify development environment
cd nextjs_space
npx tsx scripts/system-diagnostics.ts

# Start development server
npm run dev

# Test in browser
open http://localhost:3000
```

- [ ] Run system diagnostics
- [ ] Start development server
- [ ] Test authentication
- [ ] Test file upload
- [ ] Check logs for errors

---

## Verification

### 1. Check Environment Variables

```bash
# Development
cd cortexbuild-pro/nextjs_space
npx tsx scripts/system-diagnostics.ts
```

This will verify:
- ✅ All required variables are set
- ✅ Database connection works
- ✅ AWS S3 is accessible
- ✅ API services are configured

### 2. Test Individual Services

**Database:**
```bash
psql "$DATABASE_URL"
# Should connect successfully
\q
```

**AWS S3:**
```bash
# List bucket contents
aws s3 ls s3://$AWS_BUCKET_NAME --region $AWS_REGION
```

**Application:**
```bash
cd nextjs_space
npm run dev
# Visit http://localhost:3000
# Try logging in
# Try uploading a file
```

### 3. GitHub Secrets

```bash
# List all secrets
gh secret list

# Expected: All required secrets shown
```

---

## Security Best Practices

### 🔒 DO ✅

1. **Use Strong Secrets**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   
   # Generate secure hexadecimal
   openssl rand -hex 32
   ```

2. **Secure File Permissions**
   ```bash
   chmod 600 .env
   chmod 600 ~/.ssh/cortexbuild_deploy
   ```

3. **Separate Environments**
   - Different credentials for dev/staging/prod
   - Different databases for each environment
   - Different AWS buckets for each environment
   - Different API keys when possible

4. **Regular Rotation**
   - Rotate NEXTAUTH_SECRET every 90 days
   - Rotate database passwords every 90 days
   - Rotate AWS keys every 90 days
   - Rotate API keys per provider recommendations

5. **Store Backups Securely**
   - Use password manager (1Password, LastPass, etc.)
   - Store SSH key backups offline
   - Document recovery procedures

### 🚫 DON'T ❌

1. **Never Commit Secrets**
   - Don't commit .env files
   - Don't hardcode secrets in code
   - Don't include secrets in documentation
   - Don't add secrets to Docker images

2. **Never Share Secrets**
   - Don't email credentials
   - Don't share via chat/Slack
   - Don't post in issues or PRs
   - Don't log secret values

3. **Never Reuse Secrets**
   - Different secrets per environment
   - Different secrets per project
   - Don't use same password everywhere

4. **Never Use Weak Secrets**
   - No simple passwords
   - No predictable values
   - Always generate with openssl or similar
   - Minimum 32 characters for secrets

### 🔄 Rotation Schedule

**Every 90 days:**
- NEXTAUTH_SECRET
- POSTGRES_PASSWORD  
- AWS access keys
- API keys (AbacusAI, SendGrid, etc.)

**Immediately if:**
- Suspected compromise
- Employee departure
- Public exposure
- Security incident

**Rotation procedure:**
```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update GitHub secret
gh secret set NEXTAUTH_SECRET --body "$NEW_SECRET"

# 3. Update .env files
# Edit manually or with sed

# 4. Deploy immediately
# Push to trigger deployment or deploy manually

# 5. Verify application still works
# Test authentication, etc.

# 6. Document rotation in changelog
```

---

## Summary

### Minimum Required Setup (6 items)
1. ✅ DATABASE_URL
2. ✅ NEXTAUTH_SECRET
3. ✅ NEXTAUTH_URL
4. ✅ AWS credentials (3 items: KEY, SECRET, REGION, BUCKET)
5. ✅ ABACUSAI_API_KEY

### Full Production Setup (13+ items)
All required items above, plus:
- VPS credentials (for deployment)
- Google OAuth (optional)
- SendGrid or SMTP (optional)
- Additional configuration

### Quick Commands Reference

```bash
# Generate secrets
openssl rand -base64 32

# Secure .env files
chmod 600 .env

# Test database
psql "$DATABASE_URL"

# Run diagnostics
cd nextjs_space && npx tsx scripts/system-diagnostics.ts

# Add GitHub secret
gh secret set SECRET_NAME --body "value"

# List GitHub secrets
gh secret list

# Start development
cd nextjs_space && npm run dev

# Start production (Docker)
cd deployment && docker compose up -d
```

---

## Related Documentation

- **[ENVIRONMENT_SETUP_GUIDE.md](ENVIRONMENT_SETUP_GUIDE.md)** - Complete environment setup
- **[GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)** - GitHub secrets detailed guide
- **[REPOSITORY_SECRETS_SUMMARY.md](REPOSITORY_SECRETS_SUMMARY.md)** - Quick secrets summary
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - API services configuration
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security best practices
- **[DEPLOY_TO_VPS.md](DEPLOY_TO_VPS.md)** - VPS deployment guide
- **[.env.template](.env.template)** - Complete environment template

---

## Support

If you need help:

1. Review this document thoroughly
2. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Run system diagnostics: `npx tsx scripts/system-diagnostics.ts`
4. Check application logs
5. Review relevant documentation above
6. Open an issue on GitHub

---

**Document Version:** 1.0.0  
**Last Updated:** January 28, 2026  
**Status:** Complete and Verified ✅
