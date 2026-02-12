# API Integration & Connectivity Guide

## Overview
This document provides a comprehensive guide to the CortexBuild Pro platform's API integration and connectivity architecture.

## Architecture

### Backend (Node.js + Express)
- **Location**: `/server`
- **Entry Point**: `server/index.ts`
- **Port**: 3001 (default)
- **Database**: SQLite (local) / PostgreSQL (production)

### Frontend (React + Vite)
- **Location**: `/src`
- **Entry Point**: `src/App.tsx`
- **Port**: 5173 (default)
- **Build Output**: `/dist`

## API Endpoints

### Base URL
- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://api.cortexbuildpro.com/api/v1`

### Public Endpoints (No Auth Required)

#### Health Check
```
GET /api/health
```
Returns server health status, database connectivity, and WebSocket statistics.

#### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
GET  /api/v1/auth/verify
```

#### Client Portal
```
GET /api/v1/client-portal/:token
```

### Protected Endpoints (Auth Required)

All protected endpoints require:
- `Authorization: Bearer <token>` header
- `x-company-id: <companyId>` header (for tenant context)

#### Projects
```
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

#### Tasks
```
GET    /api/v1/tasks
POST   /api/v1/tasks
PUT    /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
```

#### Construction Module
```
GET    /api/v1/construction/inspections
POST   /api/v1/construction/inspections
GET    /api/v1/construction/materials
POST   /api/v1/construction/materials
GET    /api/v1/construction/submittals
POST   /api/v1/construction/submittals
```

#### Daily Logs & RFIs
```
GET    /api/v1/daily-logs
POST   /api/v1/daily-logs
PUT    /api/v1/daily-logs/:id
DELETE /api/v1/daily-logs/:id

GET    /api/v1/rfis
POST   /api/v1/rfis
PUT    /api/v1/rfis/:id
DELETE /api/v1/rfis/:id
```

#### Safety
```
GET    /api/v1/safety
POST   /api/v1/safety
PUT    /api/v1/safety/:id
DELETE /api/v1/safety/:id

GET    /api/v1/safety_hazards
POST   /api/v1/safety_hazards
```

#### Financial
```
GET    /api/v1/financials/cost-codes
POST   /api/v1/financials/cost-codes
GET    /api/v1/financials/invoices
POST   /api/v1/financials/invoices
GET    /api/v1/financials/expenses
POST   /api/v1/financials/expenses
```

#### AI & Automation
```
POST   /api/v1/ai/chat
GET    /api/v1/ai/chat/history
POST   /api/v1/ocr/extract
GET    /api/v1/automations
POST   /api/v1/automations
GET    /api/v1/predictive/:projectId
```

#### Analytics
```
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/projects
GET    /api/v1/analytics/trends
```

#### Platform Admin (Superadmin Only)
```
# Core platform admin endpoints
GET    /api/v1/platform/users
GET    /api/v1/platform/stats
GET    /api/v1/platform/audit-logs
POST   /api/v1/platform/sql

# Database management (see server/routes/platformRoutes.ts and server/routes/databaseRoutes.ts for full list)
*      /api/v1/platform/database/*
```

## WebSocket Integration

### Connection URL
- **Development**: `ws://localhost:3001/live`
- **Production**: `wss://api.cortexbuildpro.com/live`

### Socket.IO Configuration
```typescript
import { io } from 'socket.io-client';

const socket = io('https://api.cortexbuildpro.com', {
  path: '/live',
  auth: {
    token: localStorage.getItem('token')
  },
  transports: ['polling'], // For maximum compatibility
  reconnectionAttempts: 10
});
```

### WebSocket Events

#### Client → Server
- `join_company`: Join company room for real-time updates
- `join_project`: Join project-specific room
- `leave_project`: Leave project room
- `send_message`: Send chat message
- `update_presence`: Update user presence

#### Server → Client
- `company_presence`: List of online users in company
- `project_updated`: Project data changed
- `task_updated`: Task data changed
- `message`: New chat message
- `system_alert`: System notification

## Frontend API Integration

### Service Layer
The frontend uses a centralized `DatabaseService` class in `src/services/db.ts`:

```typescript
import { db } from '@/services/db';

// Fetch projects
const projects = await db.fetch<Project>('projects');

// Create project
await db.create('projects', newProject);

// Update project
await db.update('projects', projectId, updates);

// Delete project
await db.delete('projects', projectId);
```

### Context Providers
- **AuthContext**: User authentication state
- **ProjectContext**: Project data and CRUD operations
- **WebSocketContext**: Real-time connectivity
- **TenantContext**: Multi-tenant data isolation
- **NotificationContext**: In-app notifications

### API Error Handling
Global error handler in `src/utils/apiErrorHandler.ts`:
- Automatic 401 (Unauthorized) → Redirect to login
- 403 (Forbidden) → Show permission error
- 500+ (Server Error) → Show generic error
- Network errors → Show connectivity error

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=cortexbuild

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key

# External Services
GEMINI_API_KEY=your-gemini-key
SENDGRID_API_KEY=your-sendgrid-key
STRIPE_SECRET_KEY=your-stripe-key
SENTRY_DSN=your-sentry-dsn

# Storage
STORAGE_ROOT=/path/to/storage
FILE_UPLOAD_MAX_SIZE=50MB
```

### Frontend (.env)
```bash
VITE_API_URL=https://api.cortexbuildpro.com/api
VITE_WS_URL=wss://api.cortexbuildpro.com/live
VITE_SENTRY_DSN=your-frontend-sentry-dsn
```

## Running the Stack

### Development
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev

# Or run both together:
npm run dev:all
```

### Production Build
```bash
# Build both frontend and backend
npm run build:prod

# Deploy
npm run deploy:vps
```

## Testing Integration

### Manual Testing
1. Start backend: `npm run server`
2. Start frontend: `npm run dev`
3. Open http://localhost:5173
4. Login with test credentials
5. Verify:
   - Projects load correctly
   - Create/update operations work
   - WebSocket indicator shows "Connected"
   - Real-time updates appear

### Automated Testing
```bash
# Run integration verification
npx tsx scripts/verify-integration.ts

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Common Issues & Solutions

### CORS Errors
- Ensure backend CORS is configured for frontend URL
- Check that `Access-Control-Allow-Origin` headers are present

### WebSocket Connection Fails
- Verify WS URL is correct (wss:// for HTTPS, ws:// for HTTP)
- Check firewall/proxy allows WebSocket connections
- Ensure authentication token is valid

### 401 Unauthorized
- Token expired → User needs to re-login
- Token missing → Check localStorage for 'token'
- Token invalid → Clear storage and re-authenticate

### Database Connection Failed
- SQLite: Check file permissions on `server/database.db`
- PostgreSQL: Verify DATABASE_URL is correct
- Check database initialization: `npm run init-db`

## Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Role-based access control (RBAC)
3. **Data Isolation**: Multi-tenant architecture with companyId filtering
4. **Rate Limiting**: Applied to auth and API endpoints
5. **Input Validation**: Joi schemas on all endpoints
6. **SQL Injection**: Parameterized queries only
7. **XSS Protection**: Content Security Policy headers
8. **HTTPS**: Required in production

## Performance Optimization

1. **Response Caching**: Implemented for read-heavy endpoints
2. **Connection Pooling**: Database connection reuse
3. **Lazy Loading**: Frontend components loaded on demand
4. **Image Optimization**: Automatic compression and resizing
5. **Bundle Splitting**: Vite code splitting
6. **Database Indexing**: Optimized indexes on frequently queried columns

## Monitoring & Observability

### Health Monitoring
```bash
curl https://api.cortexbuildpro.com/api/health
```

### Metrics Endpoint
```bash
curl https://api.cortexbuildpro.com/api/metrics
```

### Error Tracking
- Backend: Sentry integration
- Frontend: Sentry integration
- Logs: Winston logger (server/utils/logger.ts)

## Additional Resources

- API Documentation: `/API_DOCUMENTATION.md`
- Setup Guide: `/README.md`
- Deployment Guide: `/docs/DEPLOYMENT_GUIDE.md`
- Database Schema: `/server/schema.sql`
- Custom Instructions: `/.agent/instructions.md`

---

**Last Updated**: 2026-01-25
**Version**: 2.0.0
