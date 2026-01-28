# 🔐 Environment Files Setup Instructions

**Generated:** January 28, 2026  
**Status:** ✅ Environment files created and configured

---

## 📄 Created Files

Two environment files have been created with secure defaults and placeholders:

1. **`nextjs_space/.env`** - Development configuration
2. **`deployment/.env`** - Production/Docker configuration

Both files have been secured with `chmod 600` (read/write for owner only).

---

## 🔑 Required API Keys to Configure

You must replace the placeholder values in the .env files with your actual credentials:

### 1. Database Configuration

**For Development (`nextjs_space/.env`):**
```env
DATABASE_URL="postgresql://cortexbuild:devpass123@localhost:5432/cortexbuild?schema=public"
```
- Default setup assumes local PostgreSQL with simple development password
- Adjust username, password, host, and database name as needed

**For Production (`deployment/.env`):**
```env
POSTGRES_PASSWORD=<already-generated-secure-password>
DATABASE_URL="postgresql://cortexbuild:FijtFxXHRTI7PoeXNchmR/t9WspnFqtqYB1HQP1sw1M=@postgres:5432/cortexbuild?schema=public"
```
- ✅ Secure password already generated
- Password is URL-encoded in DATABASE_URL
- If using external database, uncomment and update the alternative DATABASE_URL

### 2. Authentication Secrets

**Both environments have pre-generated NEXTAUTH_SECRET:**
```env
NEXTAUTH_SECRET="07DUWxJew+0E2es5SFWibuW2XoirSi4Z536rpYG2s9Y="
```
- ✅ Already configured with cryptographically secure random value
- ⚠️ For maximum security, generate unique secrets for dev and prod:
  ```bash
  openssl rand -base64 32
  ```

**Update Application URLs:**
- Development: Already set to `http://localhost:3000`
- Production: Update `NEXTAUTH_URL` in `deployment/.env` with your actual domain

### 3. AWS S3 Configuration (REQUIRED)

**⚠️ ACTION REQUIRED:** You must obtain AWS credentials and update both files.

**How to get AWS credentials:**

1. **Sign up for AWS account** at https://aws.amazon.com/

2. **Create S3 Bucket:**
   - Navigate to S3 service in AWS Console
   - Click "Create bucket"
   - Choose unique bucket name (e.g., `cortexbuild-dev-files`, `cortexbuild-prod-files`)
   - Select region (e.g., `us-west-2`)
   - Click "Create bucket"

3. **Create IAM User:**
   - Navigate to IAM → Users → Add User
   - Username: `cortexbuild-s3-access`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy with limited permissions)
   - Click through to create user
   - **IMPORTANT:** Copy Access Key ID and Secret Access Key (shown only once!)

4. **Update .env files:**

**Development (`nextjs_space/.env`):**
```env
AWS_BUCKET_NAME="cortexbuild-dev-files"
AWS_FOLDER_PREFIX="development/"

# Option 1: Use AWS Profile (recommended for local dev)
AWS_PROFILE="hosted_storage"

# Option 2: Direct credentials (uncomment and fill in)
# AWS_ACCESS_KEY_ID="AKIA..."
# AWS_SECRET_ACCESS_KEY="..."
```

**Production (`deployment/.env`):**
```env
AWS_BUCKET_NAME=cortexbuild-prod-files
AWS_FOLDER_PREFIX=production/
AWS_ACCESS_KEY_ID=AKIA...  # Replace with your actual key
AWS_SECRET_ACCESS_KEY=...  # Replace with your actual secret
```

### 4. AbacusAI API Key (REQUIRED)

**⚠️ ACTION REQUIRED:** You must obtain an AbacusAI API key.

**How to get AbacusAI API key:**

1. Sign up at https://abacus.ai/
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Copy the API key (shown only once!)

**Update both .env files:**
```env
ABACUSAI_API_KEY=abacus_your_actual_key_here
```

**Optional AbacusAI configuration:**
- `WEB_APP_ID` - If using AbacusAI hosted features
- `NOTIF_ID_*` - If using AbacusAI notification templates

### 5. Optional Services

#### Google OAuth (Optional)

**Enable "Sign in with Google" functionality:**

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://your-domain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret

**Update .env files (uncomment and fill in):**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### SendGrid Email (Optional)

**For transactional emails:**

1. Sign up at https://sendgrid.com/ (free tier: 100 emails/day)
2. Verify sender email (Settings → Sender Authentication)
3. Create API key (Settings → API Keys → Create API Key)
4. Copy API key (shown only once!)

**Update .env files (uncomment and fill in):**
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=CortexBuild Pro
```

**Note:** If SendGrid is not configured, the application will fall back to AbacusAI for email delivery.

---

## 🚀 Quick Start After Configuration

### Development Setup

```bash
# 1. Navigate to application directory
cd nextjs_space

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma db push

# 5. (Optional) Seed database with sample data
npx prisma db seed

# 6. Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Production Deployment

```bash
# 1. Navigate to deployment directory
cd deployment

# 2. Ensure all production values are configured in .env
nano .env

# 3. Start services with Docker Compose
docker-compose up -d

# 4. Run database migrations
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"

# 5. (Optional) Seed database
docker-compose exec app sh -c "cd /app && npx prisma db seed"

# 6. Check logs
docker-compose logs -f

# 7. Verify services are running
docker-compose ps
```

---

## ✅ Verification

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

**Check .env files exist:**
```bash
ls -la nextjs_space/.env deployment/.env
```

**Verify required variables (without showing values):**
```bash
grep -E "^(DATABASE_URL|NEXTAUTH_SECRET|AWS_BUCKET_NAME|ABACUSAI_API_KEY)=" nextjs_space/.env | sed 's/=.*/=***/'
```

**Test database connection:**
```bash
cd nextjs_space
npx prisma studio
# Opens GUI at http://localhost:5555
```

---

## 🔒 Security Checklist

Before deploying to production, ensure:

- [ ] All placeholder values replaced with actual credentials
- [ ] NEXTAUTH_SECRET is 32+ characters and cryptographically random
- [ ] POSTGRES_PASSWORD is strong (24+ characters)
- [ ] AWS credentials are from dedicated IAM user with least privilege
- [ ] Different credentials for development and production
- [ ] File permissions are set: `chmod 600 .env` (already done)
- [ ] .env files are in .gitignore (already configured)
- [ ] Sensitive keys backed up securely offline
- [ ] Production domain and SSL email configured correctly

### Rotate Secrets Regularly

**Schedule (every 90 days):**
- NEXTAUTH_SECRET
- POSTGRES_PASSWORD
- AWS access keys
- API keys (AbacusAI, SendGrid, etc.)

**Generate new secrets:**
```bash
# Generate new NEXTAUTH_SECRET
openssl rand -base64 32

# Generate new database password
openssl rand -base64 32
```

---

## 📚 Additional Documentation

For more detailed information, see:

- **[ENVIRONMENT_SETUP_GUIDE.md](ENVIRONMENT_SETUP_GUIDE.md)** - Complete environment setup guide
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - API services configuration details
- **[GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)** - GitHub repository secrets for CI/CD
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security best practices
- **[PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md)** - Production deployment guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🆘 Troubleshooting

### Database Connection Issues

**Problem:** Can't connect to database

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running: `sudo systemctl status postgresql`
3. For Docker: `docker-compose ps`
4. Test connection: `psql "$DATABASE_URL"`

### AWS S3 Upload Failures

**Problem:** File uploads fail with 403 errors

**Solutions:**
1. Verify AWS credentials are correct
2. Check IAM user has S3 permissions
3. Verify bucket name and region match
4. Check bucket CORS configuration (see ENVIRONMENT_SETUP_GUIDE.md)

### Environment Variables Not Loading

**Problem:** Application can't find environment variables

**Solutions:**
1. Verify .env file exists in correct location
2. Check file has no syntax errors (no spaces around `=`)
3. Restart the server after changes
4. For Docker: `docker-compose down && docker-compose up -d`

---

## 📊 Summary

### What Was Created

✅ **Development environment file:** `nextjs_space/.env`
- Secure NEXTAUTH_SECRET pre-generated
- Development-friendly defaults
- Local database configuration
- Placeholder values for AWS and AbacusAI

✅ **Production environment file:** `deployment/.env`
- Secure NEXTAUTH_SECRET pre-generated
- Secure POSTGRES_PASSWORD pre-generated
- Production-ready configuration
- Docker-optimized settings
- Placeholder values for AWS and AbacusAI

✅ **Security measures applied:**
- Files set to chmod 600 (owner read/write only)
- Both files already in .gitignore
- Different passwords for dev and prod

### What You Need to Do

⚠️ **Required Actions:**
1. Obtain AWS S3 credentials and update both .env files
2. Obtain AbacusAI API key and update both .env files
3. Update production domain in `deployment/.env`
4. (Optional) Configure Google OAuth credentials
5. (Optional) Configure SendGrid email service
6. Test configuration with system diagnostics

---

**Last Updated:** January 28, 2026  
**Version:** 1.0.0  
**Status:** ✅ Files created - Ready for credential configuration
