# CortexBuild Pro - Quick Start Guide

> 📖 **Documentation Guide:**
> - **This guide** - Quick start for local development and Docker deployment
> - **[VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)** - Complete VPS deployment guide
> - **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Comprehensive production deployment guide

Welcome to CortexBuild Pro! This guide will help you get started quickly.

## 🚀 Quick Deployment (Recommended)

We've made deployment simple with an automated script:

```bash
./deploy-now.sh
```

This script will:
1. ✅ Check all prerequisites (Docker, Docker Compose, etc.)
2. ✅ Set up environment configuration
3. ✅ Auto-generate secure secrets
4. ✅ Deploy all services with Docker Compose
5. ✅ Run database migrations
6. ✅ Display deployment status and next steps

## 📋 Prerequisites

Before deployment, ensure you have:

- **Docker** (version 20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (version 2.0+) - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Git** - For cloning the repository
- **A domain name** (optional, for production with SSL)
- **PostgreSQL database** (or use the included Docker container)

## 🎯 Quick Options

### Option 1: One-Command Deploy (Easiest)

```bash
# Clone the repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro

# Run the quick deploy script
./deploy-now.sh
```

The script will guide you through configuration and deploy everything automatically!

### Option 2: Development Mode

For local development without Docker:

```bash
# Navigate to the application
cd nextjs_space

# Install dependencies
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Access at: **http://localhost:3000**

### Option 3: Manual Docker Deployment

For more control over the deployment process:

```bash
# Navigate to deployment directory
cd deployment

# Create and configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Run deployment script
./deploy.sh
```

## ⚙️ Essential Configuration

### Minimum Required Settings

Edit `deployment/.env` with these essential values:

```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Authentication
NEXTAUTH_SECRET=auto_generated_by_script
NEXTAUTH_URL=https://your-domain.com

# Domain (for SSL)
DOMAIN=your-domain.com
SSL_EMAIL=admin@your-domain.com
```

### Optional Services

Configure these for full functionality:

```env
# AWS S3 (for file uploads)
AWS_BUCKET_NAME=your-bucket
AWS_REGION=us-west-2

# AbacusAI (for AI features)
ABACUSAI_API_KEY=your-api-key

# Google OAuth (for social login)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## 🔒 SSL/HTTPS Setup

After deployment, set up SSL for production:

```bash
cd deployment
./setup-ssl.sh your-domain.com admin@your-domain.com
```

This will:
- Request SSL certificates from Let's Encrypt
- Configure Nginx for HTTPS
- Set up automatic certificate renewal

## 🧪 Verify Deployment

### Check Service Status

```bash
cd deployment
docker-compose ps
```

All services should show "Up" status.

### Test API Endpoint

```bash
# Local
curl http://localhost:3000/api/auth/providers

# Production
curl https://your-domain.com/api/auth/providers
```

Should return authentication provider information.

### View Logs

```bash
# All services
docker-compose -f deployment/docker-compose.yml logs -f

# Specific service
docker-compose -f deployment/docker-compose.yml logs -f app
```

## 📊 Access Your Application

Once deployed, access these interfaces:

- **Main Application**: `https://your-domain.com` (or `http://localhost:3000`)
- **Admin Console**: `https://your-domain.com/admin`
- **API Health**: `https://your-domain.com/api/auth/providers`

### Default Access

Create your first user by visiting the signup page:
`https://your-domain.com/auth/signup`

## 🛠️ Common Commands

### Docker Management

```bash
# Start services
docker-compose -f deployment/docker-compose.yml up -d

# Stop services
docker-compose -f deployment/docker-compose.yml down

# Restart services
docker-compose -f deployment/docker-compose.yml restart

# View logs
docker-compose -f deployment/docker-compose.yml logs -f

# Rebuild application
docker-compose -f deployment/docker-compose.yml build app
```

### Database Operations

```bash
# Access database
docker-compose -f deployment/docker-compose.yml exec postgres psql -U cortexbuild -d cortexbuild

# Run migrations
docker-compose -f deployment/docker-compose.yml exec app sh -c "cd /app && npx prisma migrate deploy"

# Seed database
docker-compose -f deployment/docker-compose.yml exec app sh -c "cd /app && npx prisma db seed"

# Create backup
./deployment/backup.sh

# Restore backup
./deployment/restore.sh backups/backup_file.sql.gz
```

### Application Management

```bash
# Check configuration
./verify-config.sh

# Run diagnostics
cd nextjs_space
npx tsx scripts/system-diagnostics.ts

# Check health
npx tsx scripts/health-check.ts
```

## 🔧 Troubleshooting

### Services Won't Start

1. Check Docker is running: `docker ps`
2. Verify .env file exists and is configured
3. Check logs: `docker-compose logs`
4. Ensure ports 80, 443, 3000, 5432 are available

### Database Connection Issues

1. Verify PostgreSQL container is running: `docker-compose ps postgres`
2. Check DATABASE_URL in .env
3. Test connection: `docker-compose exec postgres psql -U cortexbuild -d cortexbuild`
4. Review logs: `docker-compose logs postgres`

### Application Won't Build

1. Check Node.js version: Should be 20+
2. Clear Docker cache: `docker-compose build --no-cache app`
3. Check for errors in: `docker-compose logs app`
4. Verify dependencies: Look for npm errors in logs

### SSL Certificate Issues

1. Ensure domain DNS is pointing to your server IP
2. Check firewall allows ports 80 and 443
3. Verify email in SSL_EMAIL is accessible
4. Review certbot logs: `docker-compose logs certbot`
5. Try manual certificate: `./deployment/setup-ssl.sh domain.com email@domain.com`

### Port Already in Use

If ports are already in use, you can modify them in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Change 8080 to any available port
```

## 📚 Additional Resources

### Documentation
- [Full Deployment Guide](DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [API Setup Guide](API_SETUP_GUIDE.md) - Configure API services
- [Build Status](BUILD_STATUS.md) - Build information and status
- [Configuration Checklist](CONFIGURATION_CHECKLIST.md) - Complete setup checklist
- [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md) - Tuning guide

### Need Help?

1. **Check documentation** in the project root directory
2. **Review logs** for error messages
3. **Run diagnostics**: `./verify-config.sh`
4. **Check system health**: `npx tsx scripts/health-check.ts`

## 🎉 You're Ready!

Your CortexBuild Pro installation should now be running!

### What's Next?

1. **Create your first organization** in the admin console
2. **Add team members** to your organization
3. **Create your first project** to start managing construction
4. **Explore features** - Tasks, RFIs, Submittals, Safety, and more!
5. **Set up integrations** - Configure AWS S3, Google OAuth, etc.

### Getting Started

1. Sign up at: `https://your-domain.com/auth/signup`
2. Access admin console: `https://your-domain.com/admin`
3. Create your first project: `https://your-domain.com/projects`

---

**Version**: 1.0.0  
**Last Updated**: January 25, 2025  
**Status**: Production Ready ✅

For detailed information, see [README.md](README.md) and [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
