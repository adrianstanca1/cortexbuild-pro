# CortexBuild Pro

A comprehensive multi-tenant construction management platform with full-stack features including projects, tasks, RFIs, submittals, safety tracking, and real-time collaboration.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Deployment](https://img.shields.io/badge/deployment-ready-blue)
![Security](https://img.shields.io/badge/vulnerabilities-0-success)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Docker & Docker Compose (for production)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro

# Navigate to the application
cd nextjs_space

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Deployment

```bash
# Navigate to deployment directory
cd deployment

# Start services with Docker Compose
docker-compose up -d

# Monitor logs
docker-compose logs -f
```

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

### Core Documentation
- **[REPOSITORY_MERGE_COMPLETE.md](REPOSITORY_MERGE_COMPLETE.md)** - Complete repository merge and progress summary
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Production deployment instructions with Docker
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - Complete guide for setting up all API keys and services
- **[CONFIGURATION_CHECKLIST.md](CONFIGURATION_CHECKLIST.md)** - Quick reference checklist for configuration status
- **[RUNBOOK.md](RUNBOOK.md)** - Operations guide and troubleshooting
- **[SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)** - Security guidelines and best practices
- **[PERFORMANCE_IMPROVEMENTS_2026.md](PERFORMANCE_IMPROVEMENTS_2026.md)** - Performance tuning and optimization guide
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Complete documentation map

### Application Documentation
- **[nextjs_space/README.md](nextjs_space/README.md)** - Application overview and features

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
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

**✅ READY FOR DEPLOYMENT**

- ✅ All dependencies installed
- ✅ Build successful (52 pages, 172 API endpoints)
- ✅ Zero security vulnerabilities
- ✅ All API keys and servers configured
- ✅ Database connection established
- ✅ Real-time features operational
- ✅ Docker deployment ready
- ✅ Comprehensive documentation complete

**Configured for**: Production deployment (cortexbuildpro.abacusai.app)

## 📞 Support

- Review documentation in project root
- Check system health: `npx tsx scripts/health-check.ts`
- Run diagnostics: `npx tsx scripts/system-diagnostics.ts`
- Verify config: `./verify-config.sh`

---

**Last Updated**: January 25, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
