# Backend to Frontend Connectivity Guide

This document explains how the backend and frontend are connected in CortexBuild Pro.

## Architecture Overview

CortexBuild Pro uses a **Next.js 14 App Router** architecture with:
- **Server-Side**: API routes in `app/api/` (Next.js API routes)
- **Client-Side**: React components with hooks for data fetching
- **Real-time**: Socket.IO for WebSocket connections
- **Database**: PostgreSQL with Prisma ORM

## Connection Components

### 1. API Routes (Backend)

**Location**: `nextjs_space/app/api/`

All API routes are Next.js route handlers following the App Router pattern:

```typescript
// Example: app/api/projects/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  // ... logic
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  // ... logic
  return NextResponse.json({ data });
}
```

**Key Features**:
- Automatic API endpoint creation based on file structure
- Built-in request/response handling
- Session-based authentication via NextAuth.js
- Prisma ORM for database operations

### 2. Frontend Data Fetching

**Location**: `nextjs_space/components/`, `nextjs_space/app/`

The frontend uses multiple patterns for API communication:

#### A. React Query (Recommended)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: async () => {
    const res = await fetch('/api/projects');
    return res.json();
  }
});

// Mutate data
const mutation = useMutation({
  mutationFn: async (newProject) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject)
    });
    return res.json();
  }
});
```

#### B. Native Fetch API

```typescript
// Simple GET request
const response = await fetch('/api/projects');
const data = await response.json();

// POST request
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(projectData)
});
```

#### C. Custom Hooks

```typescript
// hooks/useProjects.ts
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });
}
```

### 3. Authentication Layer

**Location**: `nextjs_space/lib/auth-options.ts`

Authentication connects backend and frontend through:

```typescript
// Server-side (API routes)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... authorized logic
}

// Client-side (React components)
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Access Denied</div>;
  
  return <div>Welcome {session.user.name}</div>;
}
```

**Authentication Flow**:
1. User signs in via `/api/auth/signin`
2. NextAuth creates encrypted session cookie
3. Cookie automatically sent with all requests
4. Backend validates session on each API call
5. Frontend checks session status with `useSession()`

### 4. Real-time Connectivity (WebSocket)

**Backend**: `nextjs_space/server/socket-io-server.ts` or `nextjs_space/production-server.js`

**Frontend**: `nextjs_space/lib/websocket-client.ts`

#### WebSocket Server Setup

```javascript
// production-server.js
const io = new Server(httpServer, {
  path: '/api/socketio',
  cors: {
    origin: process.env.NEXTAUTH_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  // Authentication
  socket.on('authenticate', async (data) => {
    const decoded = await decode({
      token: data.token,
      secret: process.env.NEXTAUTH_SECRET
    });
    // ... validate and store connection
  });
  
  // Handle events
  socket.on('task_update', (data) => {
    // Broadcast to organization
    io.to(`org_${orgId}`).emit('task_updated', data);
  });
});
```

#### WebSocket Client Usage

```typescript
// Client-side component
import { useEffect } from 'react';
import { io } from 'socket.io-client';

function RealtimeComponent() {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
      path: '/api/socket'
    });
    
    socket.on('connect', () => {
      socket.emit('authenticate', {
        token: sessionToken,
        userId: userId
      });
    });
    
    socket.on('task_updated', (data) => {
      // Update UI
    });
    
    return () => socket.disconnect();
  }, []);
}
```

### 5. Server-Sent Events (SSE)

**Backend**: `nextjs_space/app/api/realtime/route.ts`

**Frontend**: Components subscribing to `/api/realtime`

```typescript
// Backend (SSE endpoint)
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      addClient(userId, controller, organizationId);
    },
    cancel() {
      removeClient(userId);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Frontend (SSE client)
useEffect(() => {
  const eventSource = new EventSource('/api/realtime');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle update
  };
  
  return () => eventSource.close();
}, []);
```

### 6. Broadcasting Updates

**Location**: `nextjs_space/lib/realtime-clients.ts`

Backend can broadcast updates to connected clients:

```typescript
import { broadcastToOrganization } from "@/lib/realtime-clients";

// In API route after creating/updating resource
broadcastToOrganization(organizationId, {
  type: 'project_created',
  timestamp: new Date().toISOString(),
  payload: {
    project: { id, name, status }
  }
});
```

## Data Flow Examples

### Example 1: Creating a Project

```mermaid
Frontend → Backend → Database → Broadcasting
```

1. **Frontend**: User fills form and clicks "Create Project"
   ```typescript
   const handleSubmit = async (data) => {
     const response = await fetch('/api/projects', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     });
     const result = await response.json();
   };
   ```

2. **Backend API**: Validates, creates in database
   ```typescript
   export async function POST(request: Request) {
     const session = await getServerSession(authOptions);
     const body = await request.json();
     
     const project = await prisma.project.create({
       data: { ...body, organizationId: session.user.organizationId }
     });
     
     broadcastToOrganization(session.user.organizationId, {
       type: 'project_created',
       payload: { project }
     });
     
     return NextResponse.json({ project });
   }
   ```

3. **Broadcasting**: Real-time update sent to all org members
4. **Frontend**: Other users see new project appear

### Example 2: Real-time Task Updates

1. **User A** updates task status
2. **API** saves to database
3. **API** broadcasts via WebSocket: `task_updated` event
4. **User B** receives WebSocket event
5. **User B's UI** automatically updates

## Environment Configuration

### Backend Configuration

**File**: `nextjs_space/.env`

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3000"
```

### Frontend Configuration

Frontend reads from `process.env.NEXT_PUBLIC_*` variables:

```typescript
const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000';
```

**Important**: Only variables prefixed with `NEXT_PUBLIC_` are accessible in client-side code.

## Middleware

**Location**: `nextjs_space/middleware.ts`

Middleware runs before API routes and pages:

```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
};
```

## Error Handling

### Backend Error Responses

```typescript
try {
  // ... logic
} catch (error) {
  console.error("API Error:", error);
  return NextResponse.json(
    { error: "Internal Server Error", message: error.message },
    { status: 500 }
  );
}
```

### Frontend Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  onError: (error) => {
    toast.error(error.message);
  }
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

## Security Features

### 1. CSRF Protection

```typescript
// Backend: app/api/csrf-token/route.ts
import { NextResponse } from "next/server";
import { getCsrfTokenForClient } from "@/lib/csrf";

export async function GET() {
  const csrfToken = await getCsrfTokenForClient();
  return NextResponse.json({ csrfToken });
}

// Frontend: fetch token, then include in mutations
const csrfResponse = await fetch("/api/csrf-token", {
  method: "GET",
  credentials: "include",
});
const { csrfToken } = await csrfResponse.json();

await fetch("/api/projects", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken,
  },
  body: JSON.stringify(payload),
});
```

### 2. Session Validation

Every API route validates the session:

```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 3. Organization Scoping

All queries are scoped to user's organization:

```typescript
const orgId = session.user.organizationId;
const projects = await prisma.project.findMany({
  where: { organizationId: orgId }
});
```

## Testing Connectivity

### 1. Test API Endpoint

```bash
# Development
curl http://localhost:3000/api/projects

# Check health
curl http://localhost:3000/api/admin/system-health
```

### 2. Test Authentication

```bash
# Get providers
curl http://localhost:3000/api/auth/providers

# Check session
curl http://localhost:3000/api/auth/session \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### 3. Test WebSocket

Open browser console:

```javascript
const socket = io('http://localhost:3000', {
  path: '/api/socketio'
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('authenticate', {
    token: 'YOUR_TOKEN',
    userId: 'YOUR_USER_ID'
  });
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});
```

## Development Workflow

### Starting the Development Server

```bash
cd nextjs_space

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

### Building for Production

```bash
# Build application
npm run build

# Start production server with WebSocket
node production-server.js
```

## Troubleshooting

### Issue: API Returns 401 Unauthorized

**Solution**: Check session cookie is being sent
```typescript
// Ensure credentials are included
fetch('/api/projects', {
  credentials: 'include'
});
```

### Issue: WebSocket Connection Failed

**Solution**: Verify WebSocket URL and path
```typescript
// Check environment variable
console.log(process.env.NEXT_PUBLIC_WEBSOCKET_URL);

// Verify correct path
path: '/api/socketio' // Must match server
```

### Issue: Real-time Updates Not Working

**Solution**: Check authentication and room joining
```typescript
socket.on('connect', () => {
  // Must authenticate first
  socket.emit('authenticate', { token, userId });
  
  // Then join rooms
  socket.emit('join_project', { projectId });
});
```

### Issue: CORS Errors

**Solution**: Configure CORS in Socket.IO server
```javascript
cors: {
  origin: process.env.NEXTAUTH_URL,
  credentials: true
}
```

## Key Files Reference

| Component | File Location |
|-----------|--------------|
| API Routes | `app/api/**/route.ts` |
| Auth Config | `lib/auth-options.ts` |
| Database Client | `lib/db.ts` |
| WebSocket Server | `server/socket-io-server.ts` or `production-server.js` |
| WebSocket Client | `lib/websocket-client.ts` |
| SSE Clients | `lib/realtime-clients.ts` |
| Auth Middleware | `middleware.ts` |
| Environment | `.env` |

## Summary

CortexBuild Pro connects backend and frontend through:

1. **REST API**: Next.js API routes (`app/api/`)
2. **Authentication**: NextAuth.js with session cookies
3. **Real-time**: Socket.IO WebSocket + SSE
4. **Database**: Prisma ORM with PostgreSQL
5. **State Management**: React Query + Zustand
6. **Security**: Session validation + CSRF + org scoping

All components work together to provide a seamless, secure, and real-time experience.

For more information:
- API Endpoints: See `API_ENDPOINTS.md`
- API Setup: See `API_SETUP_GUIDE.md`
- Deployment: See `PRODUCTION_DEPLOYMENT.md`
