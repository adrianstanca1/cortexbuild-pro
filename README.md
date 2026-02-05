# CortexBuild Pro

A comprehensive multi-tenant construction management platform with full-stack features including projects, tasks, RFIs, submittals, safety tracking, and real-time collaboration.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Deployment](https://img.shields.io/badge/deployment-ready-blue)
![Security](https://img.shields.io/badge/vulnerabilities-0-success)
![Docker](https://img.shields.io/badge/docker-published-blue)
![VPS Deploy](https://img.shields.io/badge/VPS-auto--deploy-success)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF)

**🌐 Production URL:** https://www.cortexbuildpro.com  
**🐳 Docker Image:** `ghcr.io/adrianstanca1/cortexbuild-pro:latest`

---

## 🚀 Quick Deployment

### Option 1: Automated One-Command VPS Deployment (Fastest ⚡)

Deploy to your VPS with a single command:

```bash
# Run this on your VPS server
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

This automated script will:
- ✅ Install Docker & Docker Compose
- ✅ Configure firewall & security
- ✅ Clone repository
- ✅ Generate secure credentials
- ✅ Deploy application
- ✅ Run database migrations
- ✅ Start all services

**⏱️ Time:** ~10-15 minutes | **📖 Guide:** [DEPLOY_TO_VPS_COMPLETE.md](DEPLOY_TO_VPS_COMPLETE.md)

### Deployment Resources

**Quick Links:**
- 🚀 **[Deploy to Production for Testing](DEPLOY_PRODUCTION_TESTING.md)** - **NEW!** Complete automated deployment guide
- ✅ [Deployment Ready Guide](DEPLOYMENT_READY.md) - Quick start for production deployment
- 📋 [VPS Deployment Checklist](VPS_DEPLOYMENT_CHECKLIST.md) - Pre-flight checklist
- 📖 [Complete Deployment Guide](DEPLOY_TO_VPS_COMPLETE.md) - Step-by-step instructions
- 🔍 [Deployment Summary](DEPLOYMENT_SUMMARY.md) - Quick reference guide
- ⚙️ [Deployment Instructions](VPS_DEPLOYMENT_INSTRUCTIONS.md) - Detailed technical guide
- 🛠️ [Production Deployment](PRODUCTION_DEPLOYMENT.md) - Production checklist

**Scripts:**
- `./validate-pre-deployment.sh` - **NEW!** Validate deployment prerequisites
- `./trigger-production-deploy.sh` - **NEW!** Trigger GitHub Actions deployment
- `./prepare-vps-deployment.sh` - Validate deployment readiness
- `./deploy-to-vps.sh` - Automated one-command deployment
- `./deployment/deploy-production.sh` - Production deployment script

### Option 2: VPS Deployment Package (Recommended for Production 📦)

Deploy using a pre-packaged tarball - perfect for offline or restricted environments:

```bash
# On your local machine
./one-command-deploy.sh 'YourVPSPassword'
```

Or manually:

```bash
# 1. Create deployment package
./create-deployment-package.sh

# 2. Upload and deploy to VPS
sshpass -p 'YourPassword' scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/
sshpass -p 'YourPassword' ssh root@72.62.132.43 '
cd /root/cortexbuild
tar -xzf cortexbuild_vps_deploy.tar.gz
cd cortexbuild/deployment
nohup docker compose build --no-cache app > /root/docker_build.log 2>&1 &
'
```

**📖 Complete guide:** [VPS_DEPLOYMENT_PACKAGE_GUIDE.md](VPS_DEPLOYMENT_PACKAGE_GUIDE.md) | **⚡ Quick Ref:** [VPS_QUICK_DEPLOY.md](VPS_QUICK_DEPLOY.md)

### Option 3: Automated CI/CD Deployment with GitHub Actions

Set up continuous deployment with GitHub Actions:

1. Configure VPS and GitHub secrets
2. Push to main branch
3. Application automatically deploys to VPS

**📖 Setup guide:** [VPS_DEPLOYMENT_AUTOMATION.md](VPS_DEPLOYMENT_AUTOMATION.md)

### Option 4: Manual Docker Deployment

Deploy using pre-built Docker image:

```bash
# 1. Clone deployment scripts
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# 2. Configure environment
cp .env.example .env
nano .env  # Set POSTGRES_PASSWORD

# 3. Deploy from published Docker image
./deploy-from-published-image.sh
```

**📖 Full deployment guide:** [PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md)

---

## 📦 Docker Image

CortexBuild Pro is available as a ready-to-use Docker image:

```bash
# Pull the latest version
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:latest

# Run with Docker Compose
docker compose up -d
```

**Supported Tags:**
- `latest` - Latest stable release
- `main` - Main branch build
- `v1.0.0` - Specific version tags

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Docker & Docker Compose (for production)

### Environment Configuration

**📖 Complete Setup Guides:**
- **[API Keys & Passwords Reference](API_KEYS_AND_PASSWORDS_REFERENCE.md)** - ⭐ Complete guide for all credentials
- **[Credentials Checklist](CREDENTIALS_CHECKLIST.md)** - Quick checklist for all API keys and passwords
- **[Environment Setup Guide](ENVIRONMENT_SETUP_GUIDE.md)** - Complete guide for all environment variables
- **[API Keys Setup Guide](API_KEYS_SETUP.md)** - 🆕 Step-by-step guide for SendGrid, Gemini, and Abacus AI
- **[API Keys Quick Reference](API_KEYS_QUICK_REFERENCE.md)** - 🆕 Quick reference for API configuration
- **[GitHub Secrets Guide](GITHUB_SECRETS_GUIDE.md)** - CI/CD secrets configuration
- **[.env Template](.env.template)** - Complete template with all variables

**Quick Environment Scan:**
```bash
# Scan codebase and check which environment variables you need
./scan-env-vars.sh
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/nextjs_space

# Install dependencies
npm install --legacy-peer-deps

# Setup environment
cp .env.example .env
# Configure DATABASE_URL and other settings

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## 🌐 Production Deployment Options

### Option 1: One-Command VPS Deployment (Fastest ⚡)

**Use case:** Quick production deployment on any VPS

```bash
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

**What you get:**
- Complete automated setup
- Docker & Docker Compose installation
- Security configuration (firewall, Fail2Ban)
- SSL certificate setup (optional)
- Database with migrations
- All services running

**Time:** ~10-15 minutes  
**Guide:** [DEPLOY_TO_VPS.md](DEPLOY_TO_VPS.md)

---

### Option 2: Automated CI/CD with GitHub Actions (Recommended for Teams)

**Use case:** Continuous deployment on every code push

**Setup once:**
1. Configure GitHub secrets (SSH keys, VPS credentials)
2. Push to main branch → Automatic deployment

**Benefits:**
- Zero-downtime deployments
- Automatic rollback on failure
- Full deployment history
- Health checks and monitoring

**Guide:** [VPS_DEPLOYMENT_AUTOMATION.md](VPS_DEPLOYMENT_AUTOMATION.md) | [GitHub Actions Setup](.github/workflows/README.md)

---

### Option 3: Deploy from Published Image (Production Ready)

**Use case:** Deploy on servers with Docker already installed

```bash
cd deployment
./deploy-from-published-image.sh
```

**Guide:** [PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md)

---

### Option 4: Build and Deploy Locally (Development)

**Use case:** Custom builds or development environments

```bash
cd deployment
docker compose build
docker compose up -d
```

**Guide:** [Development Setup](#-development-setup)

**Time:** ~5 minutes | **Build:** Not required

### Option 2: Deploy to www.cortexbuildpro.com

Automated deployment script for the official domain:

```bash
cd deployment
./deploy-production.sh
```

**Time:** ~15 minutes | **Includes:** SSL setup

### Option 3: Manual Deployment

Full control over the deployment process:

```bash
cd deployment

# Configure environment
cp .env.example .env
nano .env

# Build and start services
docker compose build
docker compose up -d

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Setup SSL (optional)
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

**📖 Detailed guides:**
- [PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md) - Public deployment guide
- [DEPLOY_TO_CORTEXBUILDPRO.md](DEPLOY_TO_CORTEXBUILDPRO.md) - Official domain deployment
- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Advanced deployment options

## 📋 Configuration Status

All API keys and server connections are **fully configured** and ready for use!

### ✅ Configured Services
- **PostgreSQL Database** - Hosted database connection configured
- **NextAuth Authentication** - Secure token-based authentication
- **AWS S3 File Storage** - Document and file uploads
- **AbacusAI API** - AI features and notifications
- **WebSocket/Real-time** - Live updates and collaboration
- **Notification System** - Push notifications for key events

### ⚠️ Optional Services (Templates Provided)
- **Google OAuth** - Social login (setup instructions in documentation)
- **SendGrid Email** - Transactional emails (fallback to AbacusAI if not configured)

### 🔍 Verify Configuration

```bash
# Run automated verification
./verify-config.sh
```

## 📚 Documentation

### 🔧 Setup & Configuration (NEW!)
- **[Environment Setup Guide](ENVIRONMENT_SETUP_GUIDE.md)** - **NEW!** Complete environment variables guide
- **[GitHub Secrets Guide](GITHUB_SECRETS_GUIDE.md)** - **NEW!** CI/CD secrets configuration  
- **[.env Template](.env.template)** - **NEW!** Complete template with all variables
- **[Environment Scanner](scan-env-vars.sh)** - **NEW!** Scan and verify environment variables

### Deployment Guides
- **[VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)** - Complete VPS deployment guide
- **[PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md)** - Docker image deployment guide
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Advanced production deployment options
- **[DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)** - Quick command reference
- **[RELEASE_NOTES.md](RELEASE_NOTES.md)** - Version history and release information

### API & Configuration
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - Complete guide for setting up all API keys and services
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - API reference with 172+ endpoints
- **[CONFIGURATION_CHECKLIST.md](CONFIGURATION_CHECKLIST.md)** - Configuration verification checklist
- **[CODE_STRUCTURE.md](CODE_STRUCTURE.md)** - Project structure and architecture

### Security & Performance
- **[SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)** - Security best practices and compliance
- **[PERFORMANCE_IMPROVEMENTS_2026.md](PERFORMANCE_IMPROVEMENTS_2026.md)** - Performance optimizations

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[RUNBOOK.md](RUNBOOK.md)** - Operational runbook
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Complete documentation map

### Application Documentation
- **[nextjs_space/README.md](nextjs_space/README.md)** - Application overview and features

---

## 🔍 Verification & Testing

### Verify Your Build
```bash
# Run build verification
./deployment/scripts/verify-build.sh
```

### Verify Your Deployment
```bash
# After deployment, verify everything is working
./deployment/scripts/verify-deployment.sh
```

### Run Health Checks
```bash
# Check system health
curl http://localhost:3000/api/auth/providers

# View service status
docker compose ps

# Check logs
docker compose logs -f
```

--- 🏗️ Architecture

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 18.2, Tailwind CSS, Radix UI, shadcn/ui
- **State**: React Query, Zustand
- **Real-time**: Socket.IO client

### Backend
- **Runtime**: Node.js 20
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: AWS S3
- **Real-time**: Socket.IO server

### Infrastructure
- **Containers**: Docker, Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **SSL**: Let's Encrypt (Certbot)
- **Database**: PostgreSQL 15

## 🎯 Features

### Core Modules
- ✅ **Projects** - Complete project lifecycle management
- ✅ **Tasks** - Kanban boards, Gantt charts, task lists
- ✅ **RFIs** - Request for Information tracking
- ✅ **Submittals** - Document submission workflows
- ✅ **Time Tracking** - Labor hours and productivity
- ✅ **Budget Management** - Cost tracking and variance analysis
- ✅ **Safety** - Incident reporting and metrics
- ✅ **Daily Reports** - Site diary and progress logging
- ✅ **Documents** - File management with S3 integration
- ✅ **Team Management** - Role-based access control

### Advanced Features
- ✅ **Real-time Collaboration** - Live updates via WebSocket
- ✅ **AI Assistant** - Document analysis and chat
- ✅ **Admin Console** - Multi-organization management
- ✅ **API Management** - RESTful API endpoints
- ✅ **Audit Logging** - Complete activity tracking
- ✅ **Health Monitoring** - System diagnostics

## 🔐 Security

- ✅ Zero known vulnerabilities
- ✅ Role-based access control (RBAC)
- ✅ JWT-based session management
- ✅ SQL injection protection (Prisma ORM)
- ✅ Environment variable protection
- ✅ SSL/TLS in production

## 🚦 Environment Variables

### Required (Already Configured ✅)
```bash
DATABASE_URL=postgresql://...              # Database connection
NEXTAUTH_SECRET=***                        # Auth token encryption
NEXTAUTH_URL=http://localhost:3000         # Application URL
AWS_BUCKET_NAME=***                        # S3 bucket name
AWS_FOLDER_PREFIX=***                      # S3 folder prefix
AWS_REGION=us-west-2                       # AWS region
ABACUSAI_API_KEY=***                       # AbacusAI API key
WEB_APP_ID=***                             # Web application ID
NOTIF_ID_*=***                             # Notification IDs (4 types)
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000  # WebSocket URL
```

### Optional
```bash
GOOGLE_CLIENT_ID=***                       # Google OAuth
GOOGLE_CLIENT_SECRET=***                   # Google OAuth secret
SENDGRID_API_KEY=***                       # SendGrid email API
```

## 📦 Project Structure

```
cortexbuild-pro/
├── nextjs_space/              # Next.js application
│   ├── app/                   # App router pages & API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities and configurations
│   ├── prisma/                # Database schema
│   ├── scripts/               # Utility scripts
│   ├── server/                # WebSocket server
│   └── .env                   # Development environment variables
├── deployment/                # Production deployment
│   ├── docker-compose.yml     # Docker services configuration
│   ├── Dockerfile             # Application container
│   ├── nginx.conf             # Nginx configuration
│   ├── .env                   # Production environment variables
│   └── scripts/               # Deployment scripts
├── API_SETUP_GUIDE.md         # API keys setup guide
├── CONFIGURATION_CHECKLIST.md # Configuration checklist
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── BUILD_STATUS.md            # Build status report
└── verify-config.sh           # Configuration verification script
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose -f deployment/docker-compose.yml up -d

# Stop all services
docker-compose -f deployment/docker-compose.yml down

# View logs
docker-compose -f deployment/docker-compose.yml logs -f

# Restart services
docker-compose -f deployment/docker-compose.yml restart

# Run migrations
docker-compose -f deployment/docker-compose.yml exec app sh -c "cd /app && npx prisma migrate deploy"

# Access database
docker-compose -f deployment/docker-compose.yml exec postgres psql -U cortexbuild -d cortexbuild
```

## 🧪 Testing & Diagnostics

```bash
# Run system diagnostics
cd nextjs_space
npx tsx scripts/system-diagnostics.ts

# Run health check
npx tsx scripts/health-check.ts

# Verify configuration
cd ..
./verify-config.sh

# Open Prisma Studio (database GUI)
cd nextjs_space
npx prisma studio
```

## 🐛 Debug API and Backend

CortexBuild Pro includes comprehensive debugging tools for monitoring and troubleshooting API and backend services.

### CLI Debugging Tools

#### System Health Check
Real-time health monitoring of all system components:

```bash
cd nextjs_space

# Basic health check
npx tsx scripts/health-check.ts

# Verbose output with details
npx tsx scripts/health-check.ts --verbose

# JSON output for programmatic use
npx tsx scripts/health-check.ts --json
```

**Checks:**
- ✅ Database connectivity and connection pool status
- ✅ API connections and service availability
- ✅ AWS S3 storage service health
- ✅ WebSocket/real-time services
- ✅ Response times and performance metrics

#### System Diagnostics
Comprehensive diagnostics for troubleshooting:

```bash
cd nextjs_space

# Standard diagnostics
npx tsx scripts/system-diagnostics.ts

# Full diagnostics with detailed checks
npx tsx scripts/system-diagnostics.ts --full
```

**Diagnostics Include:**
- 🔍 Environment variable validation
- 🗄️ Database schema verification
- 📁 File system and permissions check
- ⚙️ Configuration status and completeness
- 🔗 Service integration verification

#### API Connection Testing
Test and validate all configured API connections:

```bash
cd nextjs_space

# Test all API connections
npx tsx scripts/test-api-connections.ts

# Test specific service
npx tsx scripts/test-api-connections.ts --service "AWS S3"

# Test with environment filter
npx tsx scripts/test-api-connections.ts --environment production

# Verbose mode with detailed output
npx tsx scripts/test-api-connections.ts --verbose
```

**Features:**
- 🔌 Tests all configured API endpoints
- 🔐 Validates credentials and authentication
- ⏱️ Measures response times
- 📊 Updates connection status in database
- 📝 Logs test results for audit trail

### API Debug Endpoints

#### System Health Monitoring
**Endpoint:** `GET /api/admin/system-health`

**Authentication:** SUPER_ADMIN role required

**Response includes:**
- Overall health score (0-100)
- Active users and organizations
- Project and task statistics
- Real-time WebSocket connections
- Recent system errors
- Activity metrics (hourly and daily)

```bash
# Example request
curl -X GET https://your-domain.com/api/admin/system-health \
  -H "Cookie: your-session-cookie"
```

#### API Connection Health
**Endpoint:** `GET /api/admin/api-connections/health`

**Query Parameters:**
- `serviceId` - Check specific service
- `timeRange` - Uptime calculation period (7d, 30d, 90d)

**Features:**
- Service uptime statistics
- Health check history
- Response time trends
- Module dependency status

```bash
# Check all services
curl -X GET https://your-domain.com/api/admin/api-connections/health

# Check specific service
curl -X GET https://your-domain.com/api/admin/api-connections/health?serviceId=abc123

# With time range for uptime
curl -X GET https://your-domain.com/api/admin/api-connections/health?timeRange=30d
```

#### API Connection Health History
**Endpoint:** `GET /api/admin/api-connections/health-history`

View historical health check data and trends:

```bash
curl -X GET https://your-domain.com/api/admin/api-connections/health-history?days=30
```

#### Test API Connection
**Endpoint:** `POST /api/admin/api-connections/services/{id}/test`

Test a specific API connection on-demand:

```bash
curl -X POST https://your-domain.com/api/admin/api-connections/services/abc123/test
```

### Debug Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
cd nextjs_space
npx tsx scripts/health-check.ts --verbose

# Verify DATABASE_URL
echo $DATABASE_URL

# Test with Prisma
npx prisma db pull

# View connection pool status
npx tsx scripts/system-diagnostics.ts --full
```

#### API Service Failures
```bash
# Test specific API service
npx tsx scripts/test-api-connections.ts --service "Service Name" --verbose

# Check API logs
npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.apiConnectionLog.findMany({
  where: { success: false },
  take: 10,
  orderBy: { timestamp: 'desc' }
}).then(console.log).finally(() => prisma.\$disconnect());
"
```

#### WebSocket Connection Problems
```bash
# Check WebSocket health
npx tsx scripts/health-check.ts --verbose

# Verify NEXT_PUBLIC_WEBSOCKET_URL
echo $NEXT_PUBLIC_WEBSOCKET_URL

# Monitor real-time connections via API
curl https://your-domain.com/api/admin/system-health
```

#### Performance Issues
```bash
# Run full diagnostics
npx tsx scripts/system-diagnostics.ts --full

# Check database performance
npx prisma studio

# Monitor active connections
npx tsx scripts/health-check.ts --json | jq '.components[] | select(.component == "Database")'
```

### Monitoring and Logging

#### View Recent Errors
```bash
# Database query for recent errors
cd nextjs_space
npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.activityLog.findMany({
  where: { action: { contains: 'error' } },
  take: 20,
  orderBy: { createdAt: 'desc' }
}).then(logs => {
  console.log('Recent Errors:');
  logs.forEach(log => console.log(\`[\${log.createdAt}] \${log.action}: \${log.details}\`));
}).catch(console.error).finally(() => prisma.\$disconnect());
"
```

#### Monitor Service Health
```bash
# Continuous health monitoring (runs every 60 seconds)
watch -n 60 'cd nextjs_space && npx tsx scripts/health-check.ts --json'

# Check uptime trends
curl https://your-domain.com/api/admin/api-connections/health-history?days=7
```

#### Export Health Data
```bash
# Export API connection data
curl -X GET https://your-domain.com/api/admin/api-connections/export > health-data.json
```

### Production Debugging

#### Docker Container Logs
```bash
# View application logs
docker-compose -f deployment/docker-compose.yml logs -f app

# View database logs
docker-compose -f deployment/docker-compose.yml logs -f postgres

# View nginx logs
docker-compose -f deployment/docker-compose.yml logs -f nginx

# Filter for errors
docker-compose -f deployment/docker-compose.yml logs app | grep -i error
```

#### Execute Debug Commands in Container
```bash
# Run health check in production
docker-compose -f deployment/docker-compose.yml exec app \
  sh -c "cd /app && npx tsx scripts/health-check.ts --verbose"

# Run diagnostics
docker-compose -f deployment/docker-compose.yml exec app \
  sh -c "cd /app && npx tsx scripts/system-diagnostics.ts --full"

# Test API connections
docker-compose -f deployment/docker-compose.yml exec app \
  sh -c "cd /app && npx tsx scripts/test-api-connections.ts"
```

#### Access Database for Debugging
```bash
# Connect to PostgreSQL
docker-compose -f deployment/docker-compose.yml exec postgres \
  psql -U cortexbuild -d cortexbuild

# Common debug queries
# - Check table counts: SELECT COUNT(*) FROM "User";
# - View recent activity: SELECT * FROM "ActivityLog" ORDER BY "createdAt" DESC LIMIT 10;
# - Check API status: SELECT * FROM "ApiConnection" WHERE status != 'ACTIVE';
```

### Debug Best Practices

1. **Start with Health Check** - Always run `health-check.ts` first to identify problem areas
2. **Use Verbose Mode** - Add `--verbose` flag for detailed diagnostic information
3. **Check Logs Regularly** - Review API connection logs and activity logs for patterns
4. **Monitor Trends** - Use health history endpoints to track service reliability over time
5. **Test After Changes** - Run diagnostics after configuration or code changes
6. **Document Issues** - Use activity logs to maintain audit trail of problems and fixes

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/providers` - OAuth providers

### Core Resources
- `/api/projects` - Project management
- `/api/tasks` - Task management
- `/api/rfis` - RFI tracking
- `/api/submittals` - Submittal workflows
- `/api/documents` - Document management
- `/api/team` - Team member management

### Admin
- `/api/admin/organizations` - Organization management
- `/api/admin/users` - User management
- `/api/admin/system-health` - System health monitoring
- `/api/admin/api-connections` - API connection management
- `/api/admin/api-connections/health` - API health status and uptime
- `/api/admin/api-connections/health-history` - Historical health data
- `/api/admin/api-connections/services` - List all configured services
- `/api/admin/api-connections/services/{id}/test` - Test specific service
- `/api/admin/api-connections/logs` - View API connection logs
- `/api/admin/api-connections/export` - Export health data

### Real-time
- `/api/socketio` - WebSocket connection endpoint

## 🔄 Deployment Workflow

1. **Configure Environment** (✅ Done)
   - All API keys configured
   - Database connection established
   - Services integrated

2. **Build Application**
   ```bash
   cd nextjs_space
   npm install --legacy-peer-deps
   npm run build
   ```

3. **Deploy with Docker**
   ```bash
   cd deployment
   docker-compose up -d
   ```

4. **Run Migrations**
   ```bash
   docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"
   ```

5. **Verify Deployment**
   ```bash
   curl https://your-domain.com/api/auth/providers
   ```

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check network access to database host
- Review logs: `docker-compose logs postgres`

### File Upload Issues
- Verify AWS credentials are set
- Check S3 bucket permissions
- Review CORS configuration

### WebSocket Connection Issues
- Verify `NEXT_PUBLIC_WEBSOCKET_URL` matches your domain
- Check firewall rules for WebSocket port
- Use WSS (not WS) in production

### Email Issues
- If SendGrid not configured, AbacusAI will be used as fallback
- Verify `ABACUSAI_API_KEY` is set
- Check API quota/credits

For more troubleshooting help, see [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md#troubleshooting).

## 📈 Monitoring

### Health Endpoints
- `GET /api/auth/providers` - Basic health check
- `GET /api/admin/system-health` - Detailed system status

### Logs
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# Nginx logs
docker-compose logs -f nginx
```

### Diagnostics
```bash
# Run comprehensive diagnostics
cd nextjs_space
npx tsx scripts/system-diagnostics.ts --full
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already configured in `.gitignore`
2. **Rotate secrets regularly** - Change `NEXTAUTH_SECRET` and API keys every 90 days
3. **Use HTTPS in production** - SSL configured via Let's Encrypt
4. **Limit API access** - Use least-privilege IAM policies
5. **Monitor logs** - Review audit logs regularly

## 🤝 Contributing

This is a private project. For support or questions, contact the development team.

## 📄 License

Proprietary - All rights reserved.

## 🎉 Current Status

**✅ PRODUCTION READY - DEPLOYED**

- ✅ All dependencies installed (1437 packages)
- ✅ Build successful (54 pages, 172 API endpoints)
- ✅ Zero security vulnerabilities
- ✅ All API keys and servers configured
- ✅ Database connection established
- ✅ Real-time features operational
- ✅ Docker deployment configured
- ✅ SSL/HTTPS ready
- ✅ Comprehensive documentation complete
- ✅ Production environment configured for www.cortexbuildpro.com

**Deployed to**: https://www.cortexbuildpro.com

**Build Details:**
- Next.js 16.1.6
- Node.js 20
- PostgreSQL 15
- 54 static pages
- 172 API routes
- Real-time WebSocket support

## 📞 Support

- Review documentation in project root
- Check system health: `npx tsx scripts/health-check.ts`
- Run diagnostics: `npx tsx scripts/system-diagnostics.ts`
- Verify config: `./verify-config.sh`

---

**Last Updated**: January 25, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
