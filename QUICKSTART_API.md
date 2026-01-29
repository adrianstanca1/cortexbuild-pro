# 🚀 Quick Start Guide - CortexBuild Pro

Get your API server and backend running in 5 minutes!

## Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 15.x or higher (or Docker)
- **npm** package manager

## Step 1: Start PostgreSQL (Choose One)

### Option A: Docker (Easiest)
```bash
docker run --name cortexbuild-postgres \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=cortexbuild \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Option B: Existing PostgreSQL
Make sure PostgreSQL is running and you have:
- Database name: `cortexbuild`
- Username and password
- Connection accessible on port 5432

## Step 2: Navigate to Project
```bash
cd nextjs_space
```

## Step 3: Verify Setup
```bash
# Run validation test (optional but recommended)
npx tsx scripts/test-setup.ts

# Or run the validation script
./validate-setup.sh
```

Expected output: ✅ All tests passed!

## Step 4: Setup Database
```bash
./setup-database.sh
```

This will:
- Install dependencies (if needed)
- Generate Prisma Client
- Create database tables
- Optionally seed sample data

**First-time users**: Answer `y` when asked to seed the database.

## Step 5: Start Server
```bash
./start-dev.sh
```

Or manually:
```bash
npm install --legacy-peer-deps
npm run dev
```

## Step 6: Access Application

Open your browser and navigate to:
- **Web App**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **API Docs**: http://localhost:3000/api/openapi

## Default Login (After Seeding)

- **Email**: adrian.stanca1@gmail.com
- **Password**: ChangeMe123! (or check ADMIN_PASSWORD in .env)
- **Role**: SUPER_ADMIN

## Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "api": "operational"
  }
}
```

### 2. Auth Providers
```bash
curl http://localhost:3000/api/auth/providers
```

### 3. List Projects (Requires Authentication)
```bash
# First sign in through the web interface
# Then check the API
curl http://localhost:3000/api/projects \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

## WebSocket Testing

Open browser console and run:
```javascript
const socket = io('http://localhost:3000', {
  path: '/api/socketio'
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('authenticate', {
    token: 'YOUR_SESSION_TOKEN',
    userId: 'YOUR_USER_ID'
  });
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Database Connection Fails
1. Check PostgreSQL is running: `docker ps` or `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Build Errors
```bash
# Regenerate Prisma Client
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run build
```

## Next Steps

### Configure Optional Services

1. **AWS S3** (File Uploads)
   - Create S3 bucket
   - Add credentials to `.env`
   - See [API_SETUP_GUIDE.md](../API_SETUP_GUIDE.md)

2. **Google OAuth** (Social Login)
   - Create OAuth credentials
   - Add to `.env`
   - See [API_SETUP_GUIDE.md](../API_SETUP_GUIDE.md)

3. **Email Service** (Notifications)
   - Setup SendGrid or SMTP
   - Add credentials to `.env`

### Deploy to Production

See [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md) for:
- Docker Compose deployment
- Environment configuration
- SSL/HTTPS setup
- Monitoring and logging

## Available Scripts

| Script | Purpose |
|--------|---------|
| `./start-dev.sh` | Start development server |
| `./setup-database.sh` | Initialize database |
| `./validate-setup.sh` | Validate configuration |
| `npm run dev` | Next.js dev server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npx prisma studio` | Database GUI |

## Documentation

- 📖 [API Server Setup](../API_SERVER_SETUP.md) - Detailed setup guide
- 📡 [API Endpoints](../API_ENDPOINTS.md) - Complete API reference
- 🔌 [Backend Connectivity](../BACKEND_FRONTEND_CONNECTIVITY.md) - Architecture
- 🚀 [Deployment Guide](../PRODUCTION_DEPLOYMENT.md) - Production setup
- 🔒 [Security](../SECURITY_CHECKLIST.md) - Security best practices

## Support

Having issues? Check:
1. [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
2. Application logs: `npm run dev` output
3. Database connection: `npx prisma studio`
4. Health endpoint: http://localhost:3000/api/health

## Success Indicators

You'll know everything is working when:
- ✅ Server starts without errors
- ✅ Health endpoint returns "healthy"
- ✅ You can sign in to the web interface
- ✅ Database shows data in Prisma Studio
- ✅ Real-time updates work (try creating a task)

---

**Ready to build? Start coding! 🎉**
