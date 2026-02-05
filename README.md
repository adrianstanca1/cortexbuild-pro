# CortexBuild Pro

**Version 2.3.0**

Complete UK construction management platform built with Next.js, React, and PostgreSQL. Manage projects, resources, timesheets, tasks, and more with powerful features designed for construction businesses.

## 🚀 Quick Start

### For Production VPS Deployment

```bash
# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# One-click deployment (fresh install)
sudo bash one-click-deploy.sh

# OR Production update workflow (recommended for updates)
./production-deploy.sh
```

**See [deployment/QUICKSTART.md](deployment/QUICKSTART.md) for complete instructions.**

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
- [Quick Start Guide](deployment/QUICKSTART.md) - Get up and running in minutes
- [Production Deployment Guide](deployment/PRODUCTION-DEPLOY-GUIDE.md) ⭐ **NEW** - Complete production workflow
- [Complete Deployment Guide](deployment/README.md) - Full deployment documentation
- [CloudPanel Guide](deployment/CLOUDPANEL-GUIDE.md) - Deploy with CloudPanel

### Feature Documentation
- [Admin UI Pages](ADMIN_UI_PAGES_SUMMARY.md) - Admin interface overview
- [Advanced Features](ADVANCED_FEATURES_SUMMARY.md) - Advanced functionality
- [Super Admin Features](SUPER_ADMIN_FEATURES.md) - Super admin capabilities
- [UI Visual Guide](UI_VISUAL_GUIDE.md) - Visual interface guide

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
- `one-click-deploy.sh` - Fresh VPS setup with prerequisites
- `deploy.sh` - Basic deployment without extras
- `cloudpanel-deploy.sh` - CloudPanel-specific deployment

**Maintenance:**
- `cleanup-repos.sh` - Clean Docker and Git artifacts
- `health-check.sh` - Verify deployment health
- `backup.sh` - Create database backup
- `restore.sh` - Restore from backup
- `rollback.sh` - Rollback to previous version
- `scripts-help.sh` - Show all available scripts

**Setup:**
- `setup-ssl.sh` - Configure SSL certificates
- `seed-db.sh` - Seed database with initial data

Run `./scripts-help.sh` in the deployment directory to see all available commands.

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

## 🔀 Branch Management

Automate branch merging and cleanup:

```bash
# Merge all remote branches and delete after sync
./merge-and-delete-branches.sh

# Test without making changes (dry run)
./merge-and-delete-branches.sh cortexbuildpro true

# Merge into a specific branch
./merge-and-delete-branches.sh main
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
./cleanup-branches.sh
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
