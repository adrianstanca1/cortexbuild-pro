# CortexBuild Pro

**Version 2.3.0**

Complete UK construction management platform built with Next.js, React, and PostgreSQL. Manage projects, resources, timesheets, tasks, and more with powerful features designed for construction businesses.

## 🚀 Quick Start

### For Production VPS Deployment

**Option 1: Automated Deployment via GitHub Actions (Recommended)**

Deploy directly from GitHub with one click - no SSH required!

1. Configure GitHub secrets (VPS_SSH_KEY, VPS_HOST, VPS_USER)
2. Go to Actions → Deploy to VPS → Run workflow
3. Watch the automated deployment complete

**See [deployment/AUTOMATED-DEPLOYMENT.md](deployment/AUTOMATED-DEPLOYMENT.md) for setup instructions.**

**Option 2: Manual Deployment on VPS**

```bash
# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# Quick start deployment (fresh install)
sudo bash quick-start.sh

# OR Production update workflow (recommended for updates)
./production-deploy.sh
```

**See [deployment/QUICKSTART.md](deployment/QUICKSTART.md) for complete instructions.**


**Option 3: Remote Docker Manager redeploy from your local machine**

```bash
# Build package, upload to VPS, rebuild image and redeploy via Docker Manager flow
./scripts/remote-redeploy.sh --mode docker-manager --host <your-vps-ip> --user root --key ~/.ssh/<your-key>
# or password auth (requires sshpass)
./scripts/remote-redeploy.sh --mode docker-manager --host <your-vps-ip> --user root --password <ssh-password>
```

Use `--skip-package` if `cortexbuild_vps_deploy.tar.gz` is already built locally.
Use `--mode compose` to redeploy with standard Docker Compose.


## 📦 What's Included

### Core Features
- **Project Management** - Track construction projects with milestones, budgets, and timelines
- **Resource Management** - Manage equipment, materials, and human resources
- **Time Tracking** - Employee timesheets and payroll integration
- **Task Management** - Assign and track tasks across teams
- **Document Management** - Store and organize project documents
- **Financial Tracking** - Budget management and expense tracking
- **Client Portal** - Client access to project updates and documents
- **Team Collaboration** - Internal communication and file sharing

### Technical Stack
- **Frontend**: Next.js 16, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS, shadcn/ui components
- **Deployment**: Docker, Docker Compose

## 📖 Documentation

### Deployment Guides
- [Automated Deployment Guide](deployment/AUTOMATED-DEPLOYMENT.md) - ⭐ NEW: Deploy from GitHub Actions
- [Quick Start Guide](deployment/QUICKSTART.md) - Get up and running in minutes
- [Complete Deployment Guide](deployment/README.md) - Full deployment documentation
- [Production Deployment Guide](deployment/PRODUCTION-DEPLOY-GUIDE.md) - Production workflow and updates
- [Docker Manager Guide](deployment/README-DOCKER-MANAGER.md) - Visual Docker management with Portainer
- [CloudPanel Guide](deployment/CLOUDPANEL-GUIDE.md) - Deploy with CloudPanel
- [Quick Reference](deployment/QUICK-REFERENCE.md) - Command reference

### API & Configuration
- [API Setup Guide](docs/API_SETUP_GUIDE.md) - API configuration
- [API Endpoints](docs/API_ENDPOINTS.md) - Complete API reference
- [API WebSocket Reference](docs/API_WEBSOCKET_REFERENCE.md) - WebSocket API reference
- [Quick Start](docs/QUICKSTART.md) - Quick start guide
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Documentation Index](docs/DOCUMENTATION_INDEX.md) - Full documentation index

### Security & Operations
- [Security Compliance](docs/SECURITY_COMPLIANCE.md) - Security best practices
- [Security Checklist](docs/SECURITY_CHECKLIST.md) - Pre-deployment security checklist
- [Security Advisory](docs/SECURITY_ADVISORY.md) - Security status and vulnerabilities
- [Production Deployment Checklist](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production readiness
- [Runbook](docs/RUNBOOK.md) - Operational procedures
- [Disaster Recovery Runbook](docs/DISASTER_RECOVERY_RUNBOOK.md) - Emergency procedures

### Feature Documentation
- [Admin UI Pages](docs/ADMIN_UI_PAGES_SUMMARY.md) - Admin interface overview
- [Advanced Features](docs/ADVANCED_FEATURES_SUMMARY.md) - Advanced functionality
- [Super Admin Features](docs/SUPER_ADMIN_FEATURES.md) - Super admin capabilities
- [UI Visual Guide](docs/UI_VISUAL_GUIDE.md) - Visual interface guide
- [Performance Optimizations](docs/PERFORMANCE_OPTIMIZATIONS.md) - Performance improvements
- [Security Notes](docs/SECURITY_NOTES.md) - Security considerations
- [Version Tracking](docs/VERSION_TRACKING_IMPLEMENTATION.md) - Version management
- [Integration Check Guide](docs/INTEGRATION_CHECK_GUIDE.md) - CI/CD and integration validation

## 🛠️ Development

### Prerequisites
- Node.js 20+ 
- PostgreSQL 15+
- Yarn or npm

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/nextjs_space

# Install dependencies
yarn install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
yarn dev
```

Application will be available at `http://localhost:3000`

### Development Commands

```bash
# Development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linter
yarn lint

# Database operations
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create/run migrations
npx prisma generate        # Generate Prisma Client
npx prisma db seed         # Seed database
```

## 🚀 Production Deployment

### New: Automated Production Workflow

We've added a complete production deployment workflow that handles:
1. ✅ Committing all changes
2. ✅ Rebuilding in production mode (no cache)
3. ✅ Deploying to VPS with migrations
4. ✅ Cleaning repositories and Docker artifacts
5. ✅ Verifying deployment health

**Usage:**
```bash
cd cortexbuild-pro/deployment
./production-deploy.sh
```

See [deployment/PRODUCTION-DEPLOY-GUIDE.md](deployment/PRODUCTION-DEPLOY-GUIDE.md) for complete details.

### Deployment Scripts

All deployment scripts are located in the `deployment/` directory:

**Main Deployment:**
- `production-deploy.sh` - ⭐ Complete production workflow (recommended)
- `quick-start.sh` - Quick start VPS deployment
- `deploy-from-github.sh` - Deploy from GitHub repository
- `cloudpanel-deploy.sh` - CloudPanel-specific deployment

**Maintenance:**
- `cleanup-repos.sh` - Clean Docker and Git artifacts
- `health-check.sh` - Verify deployment health
- `enterprise-backup.sh` - Create database backup
- `enterprise-restore.sh` - Restore from backup
- `rollback.sh` - Rollback to previous version

**Setup:**
- `setup-ssl.sh` - Configure SSL certificates
- `seed-db.sh` - Seed database with initial data

See [deployment/README.md](deployment/README.md) for all available deployment scripts.

## 🧹 Repository Cleanup

Keep your VPS clean and optimized:

```bash
cd deployment

# Standard cleanup (safe)
./cleanup-repos.sh

# Aggressive cleanup (removes all unused Docker images/volumes)
./cleanup-repos.sh --aggressive
```

Cleanup removes:
- Stopped Docker containers
- Dangling/unused Docker images
- Docker build cache
- Old logs (7+ days)
- Temporary files
- Optimizes Git repository

## ✅ Integration Checks

Comprehensive validation of all committed and uncommitted changes:

```bash
# Run all integration checks
./scripts/integration-check.sh

# Run specific checks
./scripts/integration-check.sh git      # Git status
./scripts/integration-check.sh types    # TypeScript
./scripts/integration-check.sh lint     # ESLint
./scripts/integration-check.sh build    # Next.js build
./scripts/integration-check.sh docker   # Docker config
```

### What Gets Checked

- **Git Status** - Uncommitted/unpushed changes
- **Dependencies** - Node modules up to date
- **TypeScript** - Type checking and compilation
- **Linting** - Code quality and style
- **Prisma Schema** - Database validation
- **Build** - Production build success
- **Docker** - Configuration validation
- **Environment** - Config file checks
- **Security** - Sensitive file detection

### GitHub Actions CI/CD

Automated workflows run on every push:
- ✅ Lint and type checking
- ✅ Build validation
- ✅ Docker build check
- ✅ Prisma schema validation

**See [Integration Check Guide](docs/INTEGRATION_CHECK_GUIDE.md) for complete documentation.**

### Pre-commit Hooks

Setup automatic validation before commits:

```bash
./scripts/setup-pre-commit-hook.sh
```

## 🔀 Branch Management

Automate branch merging and cleanup:

```bash
# Merge all remote branches and delete after sync
./scripts/merge-and-delete-branches.sh

# Test without making changes (dry run)
./scripts/merge-and-delete-branches.sh cortexbuildpro true

# Merge into a specific branch
./scripts/merge-and-delete-branches.sh main
```

Features:
- Automatically merges all remote branches into target branch
- Commits changes after each successful merge
- Pushes merged changes to remote
- Deletes remote branches after successful sync
- Handles conflicts with interactive prompts
- Provides dry run mode for testing

### Simple Branch Deletion

If branches are already merged, use the simple cleanup script:

```bash
# Delete specific pre-merged branches
./scripts/cleanup-branches.sh
```

## 📊 Monitoring

### Health Check
```bash
cd deployment
./health-check.sh
```

### View Logs
```bash
# Application logs
docker compose logs -f app

# All services
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100
```

### Container Status
```bash
docker compose ps
docker stats
```

## 🔐 Security

### Environment Variables

Never commit `.env` files! Always use `.env.example` as a template.

**Required variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cortexbuild
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://your-domain.com
```

### Best Practices
- Change default passwords immediately after deployment
- Use strong, unique secrets for `NEXTAUTH_SECRET`
- Enable SSL/HTTPS in production
- Set up firewall rules (UFW)
- Regular backups (automated recommended)
- Keep Docker images and system packages updated

## 💾 Backup & Restore

### Create Backup
```bash
cd deployment
./backup.sh
```

Backups stored in `/root/cortexbuild_backups/`

### Restore Backup
```bash
cd deployment
./restore.sh backups/cortexbuild_backup_20240123.sql.gz
```

### Automated Backups

Add to crontab for daily backups:
```bash
crontab -e
# Add: 0 3 * * * cd /root/cortexbuild-pro/deployment && ./backup.sh
```

## 🔄 Updates

### Production Update (Recommended)
```bash
cd /root/cortexbuild-pro
git pull origin main
cd deployment
./production-deploy.sh
```

### Manual Update
```bash
cd /root/cortexbuild-pro
git pull origin main
cd deployment
docker compose build --no-cache app
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check logs
docker compose logs app

# Verify environment
docker compose exec app env | grep DATABASE

# Restart application
docker compose restart app
```

### Database Issues
```bash
# Check database status
docker compose logs db

# Test connection
docker compose exec db pg_isready -U cortexbuild

# Access database
docker compose exec db psql -U cortexbuild -d cortexbuild
```

### Disk Space Issues
```bash
# Check usage
df -h
docker system df

# Clean up aggressively
cd deployment
./cleanup-repos.sh --aggressive
```

### Rollback Deployment
```bash
cd deployment
./rollback.sh
```

## 📞 Support

- **Documentation**: Check the guides in `deployment/` directory
- **Health Check**: Run `./health-check.sh` to diagnose issues
- **Logs**: Review logs with `docker compose logs -f`
- **GitHub Issues**: Open an issue on GitHub

## 🎯 Quick Reference

```bash
# Integration Checks
./scripts/integration-check.sh  # Run all integration checks
./scripts/integration-check.sh build  # Check build only

# Deploy/Update
./production-deploy.sh         # Complete production workflow

# Maintenance
./cleanup-repos.sh            # Clean up repositories
./health-check.sh             # Check system health
./backup.sh                   # Create backup

# Monitoring
docker compose ps             # Container status
docker compose logs -f app    # View logs
docker stats                  # Resource usage

# Emergency
./rollback.sh                 # Rollback deployment
```

## 📄 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private repository. For authorized contributors:
1. Create feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit pull request

## 📈 Version History

- **2.3.0** - Comprehensive verification and TypeScript improvements, Next.js 16 stable
- **2.2.0** - Production deployment automation, repository cleanup scripts
- **2.1.0** - Version tracking, deployment improvements
- **2.0.0** - Major feature updates and UI improvements
- **1.0.0** - Initial release

---

**CortexBuild Pro** - Professional construction management for the modern era.

For complete deployment instructions, see [deployment/QUICKSTART.md](deployment/QUICKSTART.md) or [deployment/PRODUCTION-DEPLOY-GUIDE.md](deployment/PRODUCTION-DEPLOY-GUIDE.md).
