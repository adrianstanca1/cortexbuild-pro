# 🔐 CortexBuild Pro - Credentials Quick Checklist

**Quick Start Guide** | For detailed information, see [API_KEYS_AND_PASSWORDS_REFERENCE.md](API_KEYS_AND_PASSWORDS_REFERENCE.md)

---

## 📝 Required Credentials Checklist

Use this checklist to ensure you have all necessary credentials configured.

### 1️⃣ Database

- [ ] **DATABASE_URL** - PostgreSQL connection string
  ```
  Format: postgresql://user:pass@host:5432/database?schema=public
  Generate password: openssl rand -base64 32
  ```

- [ ] **POSTGRES_PASSWORD** - Database password (for Docker deployment)
  ```
  Generate: openssl rand -base64 32
  Must match password in DATABASE_URL
  ```

### 2️⃣ Authentication

- [ ] **NEXTAUTH_SECRET** - JWT encryption key (32+ characters)
  ```bash
  openssl rand -base64 32
  ```

- [ ] **NEXTAUTH_URL** - Application public URL
  ```
  Development: http://localhost:3000
  Production: https://www.your-domain.com
  ```

### 3️⃣ AWS S3 (File Storage)

- [ ] **AWS_ACCESS_KEY_ID** - AWS access key
  ```
  Get from: AWS Console → IAM → Users → Security credentials
  ```

- [ ] **AWS_SECRET_ACCESS_KEY** - AWS secret key
  ```
  Created with access key (shown only once!)
  ```

- [ ] **AWS_REGION** - S3 bucket region
  ```
  Example: us-west-2, us-east-1, eu-west-1
  ```

- [ ] **AWS_BUCKET_NAME** - S3 bucket name
  ```
  Create in: AWS Console → S3
  Must be globally unique
  ```

- [ ] **AWS_FOLDER_PREFIX** - Folder prefix (optional)
  ```
  Example: production/ or dev/
  ```

### 4️⃣ AI Services

- [ ] **ABACUSAI_API_KEY** - AbacusAI API key
  ```
  Get from: https://abacus.ai/ → Settings → API Keys
  Required for AI features
  ```

---

## 🎯 Optional Credentials Checklist

### Google OAuth (Social Login)

- [ ] **GOOGLE_CLIENT_ID** - Google OAuth client ID
- [ ] **GOOGLE_CLIENT_SECRET** - Google OAuth secret
  ```
  Get from: https://console.cloud.google.com/
  Creates "Sign in with Google" button
  ```

### Email Service (SendGrid)

- [ ] **SENDGRID_API_KEY** - SendGrid API key
- [ ] **SENDGRID_FROM_EMAIL** - Sender email address
- [ ] **SENDGRID_FROM_NAME** - Sender display name
  ```
  Get from: https://sendgrid.com/
  Free tier: 100 emails/day
  Fallback: Uses AbacusAI if not configured
  ```

### Email Service (Custom SMTP)

- [ ] **SMTP_HOST** - SMTP server hostname
- [ ] **SMTP_PORT** - SMTP server port (587 or 465)
- [ ] **SMTP_USER** - SMTP username
- [ ] **SMTP_PASSWORD** - SMTP password
- [ ] **EMAIL_FROM** - Sender email address
  ```
  Alternative to SendGrid
  Gmail users: Use App Password, not regular password
  ```

### VPS Deployment

- [ ] **VPS_HOST** - VPS IP or hostname
- [ ] **VPS_USER** - SSH username
- [ ] **VPS_SSH_KEY** - Private SSH key
  ```bash
  # Generate SSH key
  ssh-keygen -t ed25519 -f ~/.ssh/cortexbuild_deploy
  
  # Copy to VPS
  ssh-copy-id -i ~/.ssh/cortexbuild_deploy.pub user@vps-ip
  
  # Use private key content for VPS_SSH_KEY
  cat ~/.ssh/cortexbuild_deploy
  ```

### Additional Configuration

- [ ] **DOMAIN** - Production domain (without www)
- [ ] **SSL_EMAIL** - Email for SSL certificate notifications
- [ ] **NEXT_PUBLIC_WEBSOCKET_URL** - WebSocket URL
- [ ] **WEBSOCKET_PORT** - WebSocket port (default: 3000)
- [ ] **WEB_APP_ID** - AbacusAI web app ID (optional)

---

## 📍 Where to Add Credentials

### Development Environment
```bash
cd cortexbuild-pro/nextjs_space
cp .env.example .env
nano .env
# Add your credentials
chmod 600 .env
```

### Production Environment
```bash
cd cortexbuild-pro/deployment
cp .env.example .env
nano .env
# Add your credentials
chmod 600 .env
```

### GitHub Secrets (for CI/CD)
```bash
# Install GitHub CLI
gh auth login

# Add secrets
gh secret set SECRET_NAME --body "value"

# Verify
gh secret list
```

---

## ✅ Verification Steps

### 1. Check Configuration
```bash
cd nextjs_space
npx tsx scripts/system-diagnostics.ts
```

### 2. Test Database
```bash
psql "$DATABASE_URL"
```

### 3. Test Application
```bash
cd nextjs_space
npm run dev
# Visit http://localhost:3000
```

### 4. Check GitHub Secrets
```bash
gh secret list
```

---

## 🔒 Security Checklist

- [ ] All passwords are 24+ characters
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] Used `openssl rand -base64 32` to generate secrets
- [ ] Different credentials for dev/staging/prod
- [ ] File permissions set: `chmod 600 .env`
- [ ] .env files NOT committed to Git (in .gitignore)
- [ ] SSH keys backed up securely
- [ ] AWS IAM user has least-privilege permissions
- [ ] GitHub secrets configured for all required variables
- [ ] Documented where to find all credentials
- [ ] Scheduled secret rotation (every 90 days)

---

## 🚀 Quick Setup Commands

```bash
# Generate secure secrets
openssl rand -base64 32

# Create .env files
cp .env.example .env

# Secure .env files
chmod 600 .env

# Add GitHub secret
gh secret set SECRET_NAME --body "value"

# Add SSH key as secret
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy

# List all secrets
gh secret list

# Verify configuration
cd nextjs_space && npx tsx scripts/system-diagnostics.ts

# Start development
cd nextjs_space && npm run dev

# Start production (Docker)
cd deployment && docker compose up -d
```

---

## 📊 Status Summary

### Required (Must Have) - 6 Items
| Credential | Status | Notes |
|------------|--------|-------|
| DATABASE_URL | ☐ | PostgreSQL connection |
| NEXTAUTH_SECRET | ☐ | 32+ characters |
| NEXTAUTH_URL | ☐ | Application URL |
| AWS_ACCESS_KEY_ID | ☐ | S3 access |
| AWS_SECRET_ACCESS_KEY | ☐ | S3 secret |
| AWS_REGION | ☐ | S3 region |
| AWS_BUCKET_NAME | ☐ | S3 bucket |
| ABACUSAI_API_KEY | ☐ | AI services |

### Optional (Enhanced Features) - 15+ Items
| Feature | Credentials | Status |
|---------|-------------|--------|
| Google OAuth | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | ☐ |
| SendGrid Email | SENDGRID_API_KEY, FROM_EMAIL, FROM_NAME | ☐ |
| Custom SMTP | SMTP_HOST, PORT, USER, PASSWORD | ☐ |
| VPS Deployment | VPS_HOST, VPS_USER, VPS_SSH_KEY | ☐ |
| Additional | DOMAIN, SSL_EMAIL, WEBSOCKET_URL | ☐ |

---

## 📚 Related Documents

- **[API_KEYS_AND_PASSWORDS_REFERENCE.md](API_KEYS_AND_PASSWORDS_REFERENCE.md)** ⭐ Complete detailed guide
- **[ENVIRONMENT_SETUP_GUIDE.md](ENVIRONMENT_SETUP_GUIDE.md)** - Environment setup
- **[GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)** - GitHub secrets
- **[REPOSITORY_SECRETS_SUMMARY.md](REPOSITORY_SECRETS_SUMMARY.md)** - Secrets summary
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - API configuration
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security practices
- **[.env.template](.env.template)** - Complete template

---

## 💡 Quick Links

### Get API Keys
- **AWS Console**: https://console.aws.amazon.com/
- **AbacusAI**: https://abacus.ai/
- **Google Cloud**: https://console.cloud.google.com/
- **SendGrid**: https://sendgrid.com/

### Documentation
- **PostgreSQL**: https://www.postgresql.org/docs/
- **NextAuth.js**: https://next-auth.js.org/
- **AWS S3**: https://docs.aws.amazon.com/s3/
- **Prisma**: https://www.prisma.io/docs/

---

## 🆘 Need Help?

1. ✅ Read [API_KEYS_AND_PASSWORDS_REFERENCE.md](API_KEYS_AND_PASSWORDS_REFERENCE.md) for detailed instructions
2. ✅ Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
3. ✅ Run diagnostics: `npx tsx scripts/system-diagnostics.ts`
4. ✅ Review logs for errors
5. ✅ Open GitHub issue if problem persists

---

**Last Updated:** January 28, 2026  
**Version:** 1.0.0  
**Status:** Ready to use ✅
