# CortexBuild Pro - API Keys & Server Configuration Guide

This guide provides detailed instructions for setting up all API keys, servers, and connections required for full functionality of CortexBuild Pro.

## Table of Contents

1. [Overview](#overview)
2. [Core Requirements](#core-requirements)
3. [Optional Services](#optional-services)
4. [Configuration Files](#configuration-files)
5. [Step-by-Step Setup](#step-by-step-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## Overview

CortexBuild Pro requires several services and API keys to function fully:

### Required Services
- **PostgreSQL Database** - Data storage
- **NextAuth** - Authentication and session management
- **AWS S3** - File storage and uploads
- **AbacusAI API** - AI features and notification fallback

### Optional Services
- **Google OAuth** - Social login
- **SendGrid** - Email notifications
- **Custom SMTP** - Alternative email delivery

## Core Requirements

### 1. PostgreSQL Database

**Purpose**: Primary data storage for all application data.

**Current Configuration**:
- The application is currently configured to use a hosted database
- Connection string: `postgresql://role_ddaacb0a0:...@db-ddaacb0a0.db003.hosteddb.reai.io:5432/ddaacb0a0`

**Setup Options**:

#### Option A: Use Existing Hosted Database (Recommended)
The database is already configured in `nextjs_space/.env` and `deployment/.env`.
No action needed if you have access to the hosted database.

#### Option B: Use Local PostgreSQL (Development)
```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

# Create database
createdb cortexbuild

# Update DATABASE_URL in .env:
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/cortexbuild?schema=public"
```

#### Option C: Use Docker PostgreSQL (Production)
The `docker-compose.yml` includes a PostgreSQL service. Set these variables in `deployment/.env`:
```env
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=cortexbuild
```

### 2. NextAuth Configuration

**Purpose**: Secure authentication and session management.

**Required Variables**:
- `NEXTAUTH_SECRET` - Secret key for encrypting session tokens
- `NEXTAUTH_URL` - Your application's public URL

**Setup**:

1. Generate a secure secret:
```bash
openssl rand -base64 32
```

2. Add to your `.env` files:
```env
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=https://your-domain.com  # or http://localhost:3000 for development
```

**Current Configuration**:
- Secret is already set in both environment files
- Production URL: `https://cortexbuildpro.abacusai.app`
- Development URL: `http://localhost:3000` (can be changed)

### 3. AWS S3 File Storage

**Purpose**: Store uploaded files, documents, images, and PDFs.

**Required Variables**:
```env
AWS_PROFILE=hosted_storage
AWS_REGION=us-west-2
AWS_BUCKET_NAME=your-bucket-name
AWS_FOLDER_PREFIX=your-folder-prefix/
```

**Current Configuration**:
The application is currently configured with:
- Bucket: `abacusai-apps-53407cc3ddefcc549b4124cd-us-west-2`
- Region: `us-west-2`
- Prefix: `19754/`

**Setup New AWS S3 Bucket**:

1. **Create AWS Account**:
   - Go to https://aws.amazon.com/
   - Sign up or log in to AWS Console

2. **Create S3 Bucket**:
   ```bash
   # Via AWS Console:
   # - Navigate to S3 service
   # - Click "Create bucket"
   # - Enter unique bucket name (e.g., cortexbuild-prod-files)
   # - Choose region (e.g., us-west-2)
   # - Keep default settings or configure as needed
   # - Click "Create bucket"
   ```

3. **Create IAM User with S3 Access**:
   - Navigate to IAM → Users → Add User
   - User name: `cortexbuild-s3-access`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Save Access Key ID and Secret Access Key

4. **Configure AWS Credentials**:
   
   **Option A: Environment Variables** (Recommended for containers)
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   ```

   **Option B: AWS Profile** (Local development)
   ```bash
   # Install AWS CLI
   pip install awscli
   
   # Configure profile
   aws configure --profile hosted_storage
   # Enter your Access Key ID, Secret Access Key, Region
   ```

5. **Update .env Files**:
   ```env
   AWS_PROFILE=hosted_storage
   AWS_REGION=us-west-2
   AWS_BUCKET_NAME=your-bucket-name
   AWS_FOLDER_PREFIX=uploads/
   ```

### 4. AbacusAI API

**Purpose**: 
- AI-powered features (document analysis, chat assistant)
- Push notifications
- Email fallback service

**Required Variables**:
```env
ABACUSAI_API_KEY=your_api_key
WEB_APP_ID=your_web_app_id
NOTIF_ID_MILESTONE_DEADLINE_REMINDER=your_notif_id
NOTIF_ID_TOOLBOX_TALK_COMPLETED=your_notif_id
NOTIF_ID_MEWP_CHECK_COMPLETED=your_notif_id
NOTIF_ID_TOOL_CHECK_COMPLETED=your_notif_id
```

**Current Configuration**:
The application is already configured with existing credentials.
**Note**: These are existing credentials already in the repository.
For production use, generate new credentials following the steps below.

**Setup New AbacusAI Account**:

1. **Create Account**:
   - Go to https://abacus.ai/
   - Sign up for an account
   - Verify your email

2. **Get API Key**:
   - Log in to Abacus.AI dashboard
   - Navigate to Settings → API Keys
   - Click "Create API Key"
   - Copy the API key (shown only once!)

3. **Create Web App** (if using hosted features):
   - Navigate to Applications
   - Create a new application
   - Note the Web App ID

4. **Set Up Notifications** (optional):
   - Create notification templates
   - Copy the notification IDs
   - Add to environment variables

### 4b. Google Gemini API (Alternative AI Provider)

**Purpose**:
- Alternative AI provider for document analysis
- Supports vision capabilities (images and PDFs)
- Free tier with generous limits

**Required Variables**:
```env
GEMINI_API_KEY=your_gemini_api_key
AI_PROVIDER=gemini  # or 'abacus' to use Abacus AI
```

**Setup Google Gemini**:

1. **Get API Key**:
   - Go to https://makersuite.google.com/app/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy the API key

2. **Free Tier Limits**:
   - 60 requests per minute
   - 1,500 requests per day (gemini-1.5-flash)
   - 50 requests per day (gemini-1.5-pro)

3. **Configure Provider Selection**:
   ```env
   # Use Gemini as primary AI provider
   GEMINI_API_KEY=your_api_key
   AI_PROVIDER=gemini
   
   # Or use Abacus AI (default)
   ABACUSAI_API_KEY=your_api_key
   AI_PROVIDER=abacus
   
   # Or configure both for redundancy
   GEMINI_API_KEY=your_gemini_key
   ABACUSAI_API_KEY=your_abacus_key
   AI_PROVIDER=gemini  # Primary provider
   ```

4. **Choosing Between Providers**:
   - **Use Gemini if**: You want vision capabilities, free tier, or Google ecosystem
   - **Use Abacus AI if**: You need more requests, email fallback, or existing integration
   - **Use Both**: Configure both for automatic fallback if one fails

**See also**: [API_KEYS_SETUP.md](API_KEYS_SETUP.md) for detailed setup instructions

## Optional Services

### 5. Google OAuth (Optional)

**Purpose**: Enable "Sign in with Google" functionality.

**Required Variables**:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Setup**:

1. **Go to Google Cloud Console**:
   - Visit https://console.cloud.google.com/

2. **Create a Project**:
   - Click "Select a project" → "New Project"
   - Enter project name: "CortexBuild Pro"
   - Click "Create"

3. **Enable Google+ API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "CortexBuild Pro"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)
   - Click "Create"

5. **Copy Credentials**:
   - Copy Client ID and Client Secret
   - Add to your `.env` files:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### 6. SendGrid Email Service (Optional)

**Purpose**: Send transactional emails (invitations, notifications, password resets).

**Required Variables**:
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=CortexBuild Pro
```

**Setup**:

1. **Create SendGrid Account**:
   - Go to https://sendgrid.com/
   - Sign up for free account (100 emails/day free tier)

2. **Verify Sender Identity**:
   - Navigate to Settings → Sender Authentication
   - Verify a single sender or authenticate your domain
   - Complete verification process

3. **Create API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "CortexBuild Production"
   - Permission level: "Full Access" or "Restricted Access" with Mail Send
   - Click "Create & View"
   - **Copy the API key immediately** (shown only once!)

4. **Update Environment**:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@your-domain.com
   SENDGRID_FROM_NAME=CortexBuild Pro
   ```

**Note**: If SendGrid is not configured, the application will fall back to AbacusAI API for email delivery.

### 7. Custom SMTP Email (Alternative to SendGrid)

**Purpose**: Use your own SMTP server for email delivery.

**Required Variables**:
```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_password
EMAIL_FROM=noreply@your-domain.com
```

**Common SMTP Providers**:

- **Gmail**:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your_email@gmail.com
  SMTP_PASSWORD=your_app_password  # Use App Password, not regular password
  ```

- **Outlook/Office 365**:
  ```env
  SMTP_HOST=smtp.office365.com
  SMTP_PORT=587
  SMTP_USER=your_email@outlook.com
  SMTP_PASSWORD=your_password
  ```

### 8. Real-time Communication (WebSocket)

**Purpose**: Enable real-time updates, chat, and notifications.

**Required Variables**:
```env
NEXT_PUBLIC_WEBSOCKET_URL=https://your-domain.com
WEBSOCKET_PORT=3000
```

**Current Configuration**:
- Production: `https://cortexbuildpro.abacusai.app`
- Development: `http://localhost:3000`

**Setup**:
- For development: Use `http://localhost:3000`
- For production: Use your actual domain with HTTPS
- Ensure the port matches your server configuration

## Configuration Files

### File Locations

1. **Development Configuration**: `nextjs_space/.env`
   - Used for local development
   - Run `cp nextjs_space/.env.example nextjs_space/.env`
   - Contains actual credentials (already configured)

2. **Production Configuration**: `deployment/.env`
   - Used for Docker deployment
   - Run `cp deployment/.env.example deployment/.env`
   - Now created with production values

3. **Docker Compose**: `deployment/docker-compose.yml`
   - References environment variables from `deployment/.env`
   - No changes needed - already configured

### Environment File Priority

1. `deployment/.env` - Used by Docker Compose for production
2. `nextjs_space/.env` - Used by Next.js for local development
3. `.env.example` files - Templates (never contain real credentials)

## Step-by-Step Setup

### Quick Start (Development)

```bash
# 1. Navigate to project
cd cortexbuild-pro/nextjs_space

# 2. Environment is already configured in .env file
# Verify it exists:
cat .env

# 3. Install dependencies
npm install --legacy-peer-deps

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma db push

# 6. (Optional) Seed database
npx prisma db seed

# 7. Start development server
npm run dev
```

### Production Deployment

```bash
# 1. Navigate to deployment directory
cd cortexbuild-pro/deployment

# 2. Environment file is already created (.env)
# Verify it exists:
cat .env

# 3. Review and update any values as needed
nano .env

# 4. Start services with Docker Compose
docker-compose up -d

# 5. Run migrations
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"

# 6. (Optional) Seed database
docker-compose exec app sh -c "cd /app && npx prisma db seed"

# 7. Check logs
docker-compose logs -f
```

## Verification

### Check Environment Variables

Run the system diagnostics script:
```bash
cd nextjs_space
npx tsx scripts/system-diagnostics.ts
```

This will verify:
- ✅ All required environment variables are set
- ✅ Database connection is working
- ✅ Database schema is correct
- ✅ File storage is accessible
- ✅ API services are configured

### Test Individual Services

#### Test Database Connection
```bash
cd nextjs_space
npx prisma studio
# Opens Prisma Studio in browser - verify you can see your data
```

#### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/auth/providers

# Should return JSON with available auth providers
```

#### Test File Upload (S3)
- Log in to the application
- Navigate to Documents
- Try uploading a file
- Verify it appears in your S3 bucket

#### Test Email (if configured)
- Create a new user invitation
- Verify the email is sent and received

#### Test Real-time (WebSocket)
- Open application in two browser tabs
- Make a change in one tab
- Verify it updates in the other tab in real-time

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check database is running: `docker-compose ps` (if using Docker)
3. Test connection: `psql $DATABASE_URL` (requires psql installed)
4. Check firewall/network access to database host

### AWS S3 Upload Issues

**Problem**: File uploads fail or return 403 errors

**Solutions**:
1. Verify AWS credentials are correct
2. Check bucket name and region match
3. Verify IAM user has S3 permissions
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

### AbacusAI API Issues

**Problem**: AI features not working

**Solutions**:
1. Verify API key is correct
2. Check API key has not expired
3. Verify you have API credits/quota available
4. Check AbacusAI service status

### Email Not Sending

**Problem**: Emails not being delivered

**Solutions**:
1. Verify SendGrid API key is correct
2. Check sender email is verified in SendGrid
3. Look for emails in spam folder
4. Check SendGrid dashboard for delivery logs
5. If SendGrid not configured, verify AbacusAI fallback is working

### Google OAuth Not Working

**Problem**: "Sign in with Google" fails

**Solutions**:
1. Verify Client ID and Client Secret are correct
2. Check redirect URI is correctly configured in Google Cloud Console
3. Verify Google+ API is enabled
4. Check browser console for specific errors

### WebSocket Connection Issues

**Problem**: Real-time updates not working

**Solutions**:
1. Verify NEXT_PUBLIC_WEBSOCKET_URL is correct
2. Check WebSocket port is not blocked by firewall
3. For production, ensure HTTPS/WSS is used (not HTTP/WS)
4. Check browser console for WebSocket connection errors

### Environment Variables Not Loading

**Problem**: Application can't find environment variables

**Solutions**:
1. Verify .env file exists in correct location
2. Restart the server after changing .env
3. For Docker: `docker-compose down && docker-compose up -d`
4. Check no syntax errors in .env file (no quotes needed for most values)

## Security Best Practices

1. **Never Commit .env Files**:
   - Already added to `.gitignore`
   - Always use `.env.example` as template

2. **Rotate Secrets Regularly**:
   - Change NEXTAUTH_SECRET periodically
   - Rotate API keys every 90 days
   - Update database passwords

3. **Use Strong Passwords**:
   - Database passwords: 20+ characters, mixed case, numbers, symbols
   - Generate with: `openssl rand -base64 32`

4. **Limit API Access**:
   - Use least-privilege IAM policies for AWS
   - Restrict API keys to specific IPs if possible
   - Monitor API usage regularly

5. **Secure Transmission**:
   - Always use HTTPS in production
   - Enable WSS (WebSocket Secure) for real-time features
   - Configure SSL certificates properly

## Summary

All API keys and server connections are now configured in the following files:

- ✅ `nextjs_space/.env` - Development configuration (already configured)
- ✅ `deployment/.env` - Production configuration (newly created)
- ✅ `deployment/docker-compose.yml` - References environment variables (already configured)

### Configured Services:
- ✅ PostgreSQL Database - Hosted database connection
- ✅ NextAuth - Authentication configured
- ✅ AWS S3 - File storage configured
- ✅ AbacusAI API - AI features and notifications configured
- ✅ WebSocket - Real-time communication configured
- ⚠️ Google OAuth - Template provided (optional, requires setup)
- ⚠️ SendGrid - Template provided (optional, requires setup)

The application is now ready for deployment with full functionality!

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AbacusAI Documentation](https://abacus.ai/docs/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Docker Documentation](https://docs.docker.com/)

## Support

For additional support or questions:
- Review the main [README.md](../nextjs_space/README.md)
- Check [Production Deployment Guide](../deployment/PRODUCTION-DEPLOY-GUIDE.md)
- See [RUNBOOK.md](RUNBOOK.md) for operational guidance
- Contact the development team
