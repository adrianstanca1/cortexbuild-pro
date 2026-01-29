# CortexBuild Pro - API Server & Backend Setup

This guide explains how to set up and run the full API server, database connection, and backend infrastructure for CortexBuild Pro.

## 🏗️ Architecture Overview

CortexBuild Pro is built on:
- **Frontend**: Next.js 14 (React 18) with App Router
- **API Server**: Next.js API routes with REST endpoints
- **Real-time**: Socket.IO WebSocket server for live updates
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with session-based auth
- **File Storage**: AWS S3 (optional)

## 📋 Prerequisites

### Required
- **Node.js** 20.x or higher
- **PostgreSQL** 15.x or higher
- **npm** or **yarn** package manager

### Optional
- **Docker** (for containerized PostgreSQL)
- **AWS Account** (for S3 file storage)
- **Google Cloud Account** (for OAuth)
- **SendGrid Account** (for emails)

## 🚀 Quick Start (Development)

### 1. Install PostgreSQL

#### Option A: Using Docker (Recommended for Development)
```bash
docker run --name cortexbuild-postgres \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=cortexbuild \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### Option B: Install Locally
- **Ubuntu/Debian**: `sudo apt-get install postgresql`
- **macOS**: `brew install postgresql@15`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

### 2. Configure Environment

The `.env` file has been created in `nextjs_space/.env` with default development settings:

```bash
cd nextjs_space
cat .env  # Review the configuration
```

**Key configurations:**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Auto-generated secure secret
- `NEXTAUTH_URL`: Application URL (http://localhost:3000)

### 3. Setup Database

Run the database setup script:

```bash
cd nextjs_space
./setup-database.sh
```

This will:
- ✅ Test database connection
- ✅ Generate Prisma Client
- ✅ Create database tables
- ✅ Optionally seed initial data

### 4. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 5. Start Development Server

```bash
./start-dev.sh
```

Or manually:
```bash
npm run dev
```

The application will be available at:
- **Web App**: http://localhost:3000
- **API**: http://localhost:3000/api/*
- **Health Check**: http://localhost:3000/api/health
- **WebSocket**: ws://localhost:3000/api/socketio

## 🏭 Production Deployment

### Using Docker Compose (Recommended)

1. **Navigate to deployment directory**:
```bash
cd deployment
```

2. **Review and update environment**:
```bash
nano .env  # Update production values
```

**Important**: Change these values for production:
- `POSTGRES_PASSWORD`: Strong password
- `NEXTAUTH_SECRET`: Generate new: `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your production domain

3. **Start services**:
```bash
docker-compose up -d
```

4. **Setup database**:
```bash
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

5. **Seed database (optional)**:
```bash
docker-compose exec app sh -c "cd /app && npx prisma db seed"
```

6. **Check status**:
```bash
docker-compose ps
docker-compose logs -f app
```

### Manual Production Deployment

1. **Build the application**:
```bash
cd nextjs_space
npm run build
```

2. **Start production server** (includes WebSocket):
```bash
node production-server.js
```

Or use the standard Next.js server:
```bash
npm start
```

## 🔌 API Endpoints

### Core Endpoints

- `GET /api/health` - Health check (no auth required)
- `GET /api/auth/providers` - Available auth providers
- `GET /api/auth/session` - Current session info

### Project Management

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks

- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Documents

- `GET /api/documents` - List documents
- `POST /api/upload` - Upload file
- `GET /api/documents/[id]` - Download document

### Real-time

- `GET /api/realtime` - Server-Sent Events stream
- `WS /api/socketio` - WebSocket connection

For complete API documentation, see [API_ENDPOINTS.md](../API_ENDPOINTS.md)

## 🔐 Authentication & Security

### Session-based Authentication

CortexBuild uses NextAuth.js for authentication:

1. **Sign In**: `POST /api/auth/signin`
2. **Session Cookie**: Automatically set on successful login
3. **Protected Routes**: Check session in API routes

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... authorized logic
}
```

### CSRF Protection

CSRF tokens are automatically handled by NextAuth for form submissions.

### Organization Scoping

All data is scoped to organizations for multi-tenancy:

```typescript
const orgId = session.user.organizationId;
const projects = await prisma.project.findMany({
  where: { organizationId: orgId }
});
```

## 🔄 Real-time Features (WebSocket)

### Server Setup

WebSocket server is automatically started with `production-server.js`:

```javascript
const io = new Server(httpServer, {
  path: '/api/socketio',
  cors: {
    origin: process.env.NEXTAUTH_URL,
    credentials: true
  }
});
```

### Client Connection

```typescript
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
  path: '/api/socketio'
});

socket.on('connect', () => {
  socket.emit('authenticate', {
    token: sessionToken,
    userId: userId
  });
});

socket.on('authenticated', () => {
  console.log('Connected to real-time server');
});
```

### Available Events

- `authenticate` - Authenticate WebSocket connection
- `join-project` - Join project room
- `leave-project` - Leave project room
- `task-update` - Broadcast task updates
- `project-message` - Send chat messages
- `user-status-update` - Update user presence

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name description

# Deploy migrations (production)
npx prisma migrate deploy

# View data in GUI
npx prisma studio

# Seed database
npx prisma db seed
```

### Connection Pooling

The application uses connection pooling for optimal database performance:

```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T14:00:00.000Z",
  "services": {
    "database": "connected",
    "api": "operational"
  },
  "responseTime": "15ms"
}
```

### System Health (Admin)

```bash
curl http://localhost:3000/api/admin/system-health
```

Requires SUPER_ADMIN role. Returns:
- User statistics
- Project counts
- Task metrics
- Real-time connection counts
- System errors

### Logs

**Development**:
```bash
npm run dev  # Console output
```

**Production (Docker)**:
```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

## 🔧 Troubleshooting

### Database Connection Fails

**Problem**: `Error: Can't reach database server`

**Solutions**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Check network connectivity
4. Ensure port 5432 is not blocked

**Docker**: 
```bash
docker ps | grep postgres  # Check if running
docker logs cortexbuild-db  # View logs
```

### WebSocket Connection Fails

**Problem**: Real-time updates not working

**Solutions**:
1. Check `NEXT_PUBLIC_WEBSOCKET_URL` matches your domain
2. Verify production server is running (not just `next start`)
3. Check CORS configuration in production-server.js
4. Ensure firewall allows WebSocket connections

### Build Fails

**Problem**: `Error: Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
npm install --legacy-peer-deps
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

## 📝 Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_SECRET` | Secret for encrypting sessions | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |

### Optional

| Variable | Description |
|----------|-------------|
| `AWS_*` | AWS S3 configuration for file uploads |
| `GOOGLE_CLIENT_*` | Google OAuth credentials |
| `SENDGRID_*` | Email service configuration |
| `ABACUSAI_API_KEY` | AI features API key |
| `GEMINI_API_KEY` | Alternative AI provider |

See `.env.example` for complete list.

## 🎯 Next Steps

1. ✅ **API Server Running** - All endpoints operational
2. ✅ **Database Connected** - PostgreSQL with Prisma
3. ✅ **Authentication Working** - NextAuth.js configured
4. ✅ **WebSocket Active** - Real-time features enabled

### Optional Enhancements

- [ ] Configure AWS S3 for file uploads
- [ ] Enable Google OAuth for social login
- [ ] Set up SendGrid for email notifications
- [ ] Configure AI features (AbacusAI or Gemini)
- [ ] Set up SSL certificates for production
- [ ] Configure monitoring and alerting

## 📚 Additional Resources

- [API Endpoints Documentation](../API_ENDPOINTS.md)
- [Backend-Frontend Connectivity](../BACKEND_FRONTEND_CONNECTIVITY.md)
- [Production Deployment Guide](../PRODUCTION_DEPLOYMENT.md)
- [Security Checklist](../SECURITY_CHECKLIST.md)

## 🆘 Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
2. Review application logs
3. Test with health check endpoint
4. Check database connectivity

## 📄 License

CortexBuild Pro - Construction Management Platform
