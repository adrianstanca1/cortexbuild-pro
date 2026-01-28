# 🚀 Environment Setup - Quick Reference

**For detailed instructions, see [ENVIRONMENT_SETUP_GUIDE.md](ENVIRONMENT_SETUP_GUIDE.md)**

---

## 📋 Quick Start Checklist

### 1. Development Setup (5 minutes)

```bash
# Navigate to project
cd cortexbuild-pro/nextjs_space

# Copy example to .env
cp .env.example .env

# Generate secure secret
openssl rand -base64 32

# Edit .env with your values
nano .env
```

**Minimum Required Variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cortexbuild?schema=public"
NEXTAUTH_SECRET="<output-from-openssl-command>"
NEXTAUTH_URL="http://localhost:3000"
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="your-bucket-name"
ABACUSAI_API_KEY="your-api-key"
```

### 2. Production Setup (10 minutes)

```bash
# Navigate to deployment
cd cortexbuild-pro/deployment

# Copy example to .env
cp .env.example .env

# Edit with production values
nano .env
```

**Production Variables Template:**
```env
# Database
POSTGRES_PASSWORD="<run: openssl rand -base64 32>"
DATABASE_URL="postgresql://cortexbuild:PASSWORD@postgres:5432/cortexbuild?schema=public"

# NextAuth
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="https://your-domain.com"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="your-bucket"

# AbacusAI
ABACUSAI_API_KEY="your-api-key"

# Domain
DOMAIN="your-domain.com"
NEXT_PUBLIC_WEBSOCKET_URL="https://your-domain.com"
```

### 3. GitHub Secrets (15 minutes)

For automated deployments, configure these secrets in GitHub:

**Required Secrets (13):**
- `VPS_HOST` - Your VPS IP address
- `VPS_USERNAME` - SSH username
- `VPS_SSH_KEY` - Private SSH key (full content)
- `DATABASE_URL` - Connection string
- `POSTGRES_PASSWORD` - Database password
- `NEXTAUTH_SECRET` - Auth secret (32+ chars)
- `NEXTAUTH_URL` - Production URL
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret
- `AWS_REGION` - S3 region
- `AWS_BUCKET_NAME` - S3 bucket
- `AWS_FOLDER_PREFIX` - S3 prefix
- `ABACUSAI_API_KEY` - AbacusAI key

**How to add secrets:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with exact name and value
4. Or use GitHub CLI: `gh secret set SECRET_NAME --body "value"`

---

## 🔑 Required Services & How to Get Credentials

### 1. PostgreSQL Database
**What:** Primary data storage  
**Get credentials:**
- Local: `createdb cortexbuild` → Use localhost connection
- Hosted: Use your database provider credentials
- Docker: Set `POSTGRES_PASSWORD` in deployment/.env

### 2. NextAuth
**What:** Authentication & sessions  
**Get credentials:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### 3. AWS S3
**What:** File storage  
**Get credentials:**
1. AWS Console → IAM → Users → Create user
2. Attach policy: AmazonS3FullAccess
3. Security credentials → Create access key
4. Save Access Key ID and Secret Access Key

**Quick setup:**
```bash
# Create bucket
aws s3 mb s3://cortexbuild-prod-files --region us-west-2

# Configure CORS
aws s3api put-bucket-cors --bucket cortexbuild-prod-files --cors-configuration file://cors.json
```

### 4. AbacusAI
**What:** AI features & notifications  
**Get credentials:**
1. Sign up at https://abacus.ai/
2. Settings → API Keys → Create API Key
3. Copy key (shown only once!)

---

## 🎯 Optional Services

### Google OAuth (Social Login)
**Get credentials:**
1. https://console.cloud.google.com/ → Create project
2. APIs & Services → Credentials → Create OAuth 2.0
3. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret

### SendGrid (Email)
**Get credentials:**
1. https://sendgrid.com/ → Sign up (free tier: 100 emails/day)
2. Settings → Sender Authentication → Verify email
3. Settings → API Keys → Create API Key
4. Copy key (shown only once!)

---

## ⚡ Quick Commands

### Scan Environment Variables
```bash
./scan-env-vars.sh
```

### Generate Secure Passwords
```bash
# 32-character random string
openssl rand -base64 32

# 64-character random string  
openssl rand -base64 48
```

### Test Configuration
```bash
# Development
cd nextjs_space
npx tsx scripts/system-diagnostics.ts

# Production
cd deployment
./validate-config.sh
```

### Setup GitHub Secrets (Bulk)
```bash
# Generate and set all secrets at once
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set POSTGRES_PASSWORD --body "$(openssl rand -base64 32)"
gh secret set VPS_SSH_KEY < ~/.ssh/cortexbuild_deploy
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] All `.env` files have `chmod 600` permissions
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] Database password is 24+ characters  
- [ ] Different credentials for dev and prod
- [ ] No secrets in Git history
- [ ] GitHub secrets configured for CI/CD
- [ ] AWS IAM user has minimal permissions
- [ ] SSL/HTTPS enabled in production
- [ ] Firewall configured on VPS
- [ ] Secrets rotation schedule planned

---

## 🆘 Common Issues

### "Cannot connect to database"
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:5432/db?schema=public

# Test connection
psql "$DATABASE_URL"
```

### "NextAuth secret missing"
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env
echo "NEXTAUTH_SECRET=<paste-secret-here>" >> .env
```

### "AWS S3 upload fails"
```bash
# Test AWS credentials
aws s3 ls s3://your-bucket-name --region us-west-2

# Check IAM permissions in AWS Console
```

### "GitHub Actions deploy fails"
```bash
# Verify all required secrets are set
gh secret list

# Test SSH connection
ssh -i ~/.ssh/cortexbuild_deploy user@vps-ip
```

---

## 📚 Complete Documentation

For detailed information:

- **[ENVIRONMENT_SETUP_GUIDE.md](ENVIRONMENT_SETUP_GUIDE.md)** - Complete environment setup (16KB)
- **[GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)** - GitHub secrets guide (21KB)
- **[.env.template](.env.template)** - Complete template with all variables (13KB)
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - API services configuration
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security best practices

---

## 🎉 You're Ready!

Once you have:
1. ✅ Local `.env` configured → Run `npm run dev`
2. ✅ Production `.env` configured → Run `docker-compose up -d`
3. ✅ GitHub secrets configured → Push to trigger deployment

**Need help?** Run `./scan-env-vars.sh` to see what's configured.

---

**Last Updated:** January 28, 2026
