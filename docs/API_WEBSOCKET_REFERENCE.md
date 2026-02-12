# 🔌 CortexBuild Pro - API & WebSocket Endpoints Reference

**Last Updated:** January 26, 2026  
**Version:** 1.0

Complete reference for all API endpoints and WebSocket events in CortexBuild Pro.

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Project Management](#project-management)
3. [Task Management](#task-management)
4. [Document Management](#document-management)
5. [Team Management](#team-management)
6. [Real-time Communication (WebSocket)](#real-time-communication-websocket)
7. [Admin Endpoints](#admin-endpoints)
8. [Health & Monitoring](#health-monitoring)

---

## 🌐 Base URLs

### Development
```
HTTP API: http://localhost:3000/api
WebSocket: ws://localhost:3000/api/socketio
```

### Production
```
HTTP API: https://www.cortexbuildpro.com/api
WebSocket: wss://www.cortexbuildpro.com/api/socketio
```

---

## 🔐 Authentication Endpoints

### NextAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/providers` | Get authentication providers |
| POST | `/api/auth/signin` | Sign in with credentials |
| POST | `/api/auth/signout` | Sign out current user |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/csrf` | Get CSRF token |
| POST | `/api/auth/callback/credentials` | Credentials callback |
| GET | `/api/auth/callback/google` | Google OAuth callback |

### Session Management

**Get Current Session**
```http
GET /api/auth/session
```

Response:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "organizationId": "org_id"
  },
  "expires": "2026-01-27T00:00:00.000Z"
}
```

---

## 📊 Dashboard Endpoints

### Dashboard Stats

**Get Dashboard Statistics**
```http
GET /api/dashboard/stats
```

Response:
```json
{
  "projects": {
    "total": 10,
    "active": 7,
    "completed": 3
  },
  "tasks": {
    "total": 50,
    "completed": 30,
    "inProgress": 15,
    "todo": 5
  },
  "team": {
    "totalMembers": 25,
    "activeToday": 15
  }
}
```

### Dashboard Analytics

**Get Analytics Data**
```http
GET /api/dashboard/analytics?period=30
```

Query Parameters:
- `period` - Time period in days (default: 30)

Response:
```json
{
  "projectProgress": [...],
  "taskCompletion": [...],
  "teamActivity": [...]
}
```

### Dashboard Agenda

**Get User Agenda**
```http
GET /api/dashboard/agenda
```

Response:
```json
{
  "tasks": [...],
  "meetings": [...],
  "deadlines": [...]
}
```

---

## 🏗️ Project Management

### Projects

**List Projects**
```http
GET /api/projects
```

Query Parameters:
- `status` - Filter by status (PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, ARCHIVED)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

Response:
```json
{
  "projects": [
    {
      "id": "project_id",
      "name": "Project Name",
      "status": "IN_PROGRESS",
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "budget": 1000000,
      "organizationId": "org_id"
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

**Get Project by ID**
```http
GET /api/projects/[id]
```

**Create Project**
```http
POST /api/projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "status": "PLANNING",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "budget": 1000000,
  "location": "123 Main St, City, State"
}
```

**Update Project**
```http
PUT /api/projects/[id]
Content-Type: application/json

{
  "name": "Updated Project Name",
  "status": "IN_PROGRESS"
}
```

**Delete Project**
```http
DELETE /api/projects/[id]
```

---

## ✅ Task Management

### Tasks

**List Tasks**
```http
GET /api/tasks?projectId=project_id
```

Query Parameters:
- `projectId` - Filter by project (required)
- `status` - Filter by status (TODO, IN_PROGRESS, REVIEW, COMPLETE)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)
- `assignedTo` - Filter by assigned user ID

**Get Task by ID**
```http
GET /api/tasks/[id]
```

**Create Task**
```http
POST /api/tasks
Content-Type: application/json

{
  "projectId": "project_id",
  "title": "Task Title",
  "description": "Task description",
  "status": "TODO",
  "priority": "MEDIUM",
  "assignedTo": "user_id",
  "dueDate": "2026-02-01"
}
```

**Update Task**
```http
PUT /api/tasks/[id]
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

**Delete Task**
```http
DELETE /api/tasks/[id]
```

---

## 📁 Document Management

### Documents

**List Documents**
```http
GET /api/documents?projectId=project_id
```

Query Parameters:
- `projectId` - Filter by project (required)
- `type` - Filter by document type (PLANS, DRAWINGS, PERMITS, PHOTOS, REPORTS, etc.)

**Get Document by ID**
```http
GET /api/documents/[id]
```

**Upload Document**
```http
POST /api/documents
Content-Type: multipart/form-data

projectId: project_id
type: PLANS
file: [binary data]
description: Document description
```

**Get Signed Upload URL (S3 Direct Upload)**
```http
POST /api/documents/upload-url
Content-Type: application/json

{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "projectId": "project_id"
}
```

Response:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "fileKey": "cortexbuild/documents/...",
  "fileUrl": "https://s3.amazonaws.com/..."
}
```

**Delete Document**
```http
DELETE /api/documents/[id]
```

---

## 👥 Team Management

### Team Members

**List Team Members**
```http
GET /api/team
```

Response:
```json
{
  "members": [
    {
      "id": "member_id",
      "userId": "user_id",
      "user": {
        "name": "User Name",
        "email": "user@example.com"
      },
      "role": "PROJECT_MANAGER",
      "isActive": true
    }
  ]
}
```

**Add Team Member**
```http
POST /api/team
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "FIELD_WORKER",
  "projectIds": ["project_id_1", "project_id_2"]
}
```

**Update Team Member**
```http
PUT /api/team/[id]
Content-Type: application/json

{
  "role": "PROJECT_MANAGER",
  "isActive": true
}
```

**Remove Team Member**
```http
DELETE /api/team/[id]
```

---

## 🔌 Real-time Communication (WebSocket)

### Connection

**Connect to WebSocket**
```javascript
import { io } from 'socket.io-client';

const socket = io('wss://www.cortexbuildpro.com', {
  path: '/api/socketio',
  transports: ['websocket', 'polling']
});
```

### Authentication

**Authenticate Socket Connection**
```javascript
socket.emit('authenticate', {
  token: 'nextauth_session_token',
  userId: 'user_id'
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});

socket.on('authentication-error', (error) => {
  console.error('Auth error:', error);
});
```

### Join Project Room

**Join Project for Real-time Updates**
```javascript
socket.emit('join-project', {
  projectId: 'project_id'
});

socket.on('project-joined', (data) => {
  console.log('Joined project:', data);
});

socket.on('user-joined-project', (data) => {
  console.log('User joined:', data.userId);
});
```

### Leave Project Room

**Leave Project**
```javascript
socket.emit('leave-project', {
  projectId: 'project_id'
});

socket.on('project-left', (data) => {
  console.log('Left project:', data);
});
```

### Task Updates

**Broadcast Task Update**
```javascript
socket.emit('task-update', {
  projectId: 'project_id',
  task: {
    id: 'task_id',
    status: 'IN_PROGRESS',
    // ... other task data
  }
});
```

**Receive Task Updates**
```javascript
socket.on('task-updated', (data) => {
  console.log('Task updated:', data.task);
  console.log('By user:', data.userId);
  console.log('At:', data.timestamp);
});
```

### Project Messages

**Send Project Message**
```javascript
socket.emit('project-message', {
  projectId: 'project_id',
  message: 'Hello team!',
  senderName: 'User Name'
});
```

**Receive Messages**
```javascript
socket.on('new-message', (data) => {
  console.log('New message:', data.message);
  console.log('From:', data.senderName);
  console.log('Sender ID:', data.senderId);
});
```

### User Status

**Update User Status**
```javascript
socket.emit('user-status-update', {
  projectId: 'project_id',
  status: 'online' // or 'away', 'busy', 'offline'
});
```

**Receive Status Updates**
```javascript
socket.on('user-status-changed', (data) => {
  console.log('User status:', data.userId, data.status);
});
```

### Notifications

**Send Notification**
```javascript
socket.emit('notification', {
  projectId: 'project_id',
  notification: {
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned a new task'
  }
});
```

**Receive Notifications**
```javascript
socket.on('notification-received', (data) => {
  console.log('Notification:', data.notification);
});
```

### Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

---

## 🛠️ Admin Endpoints

### System Health

**Get System Health**
```http
GET /api/admin/system-health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 86400,
  "database": {
    "connected": true,
    "responseTime": 5
  },
  "memory": {
    "used": 500000000,
    "total": 2000000000
  }
}
```

### Organizations

**List Organizations**
```http
GET /api/admin/organizations
```

**Get Organization**
```http
GET /api/admin/organizations/[id]
```

**Update Organization**
```http
PUT /api/admin/organizations/[id]
```

### API Connections

**Get API Connection Status**
```http
GET /api/admin/api-connections
```

**Test API Service**
```http
POST /api/admin/api-connections/services/[id]/test
```

---

## 🏥 Health & Monitoring

### Health Check

**Basic Health Check**
```http
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-26T00:00:00.000Z"
}
```

### Auth Providers (Health Check)

```http
GET /api/auth/providers
```

Response:
```json
{
  "credentials": {
    "id": "credentials",
    "name": "Credentials",
    "type": "credentials"
  },
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth"
  }
}
```

---

## 🔒 Authentication & Authorization

### Headers

All authenticated requests require:

```http
Cookie: next-auth.session-token=your_session_token
```

Or for API clients:

```http
Authorization: Bearer your_session_token
```

### Permissions

User roles and their permissions:

| Role | Projects | Tasks | Documents | Team | Admin |
|------|----------|-------|-----------|------|-------|
| SUPER_ADMIN | Full | Full | Full | Full | Full |
| COMPANY_OWNER | Full | Full | Full | Full | Limited |
| ADMIN | Full | Full | Full | Full | No |
| PROJECT_MANAGER | Assigned | Full | Full | View | No |
| FIELD_WORKER | View | Assigned | View | View | No |

---

## 📝 Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  }
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🧪 Testing Endpoints

### Using cURL

**Test Authentication**
```bash
curl http://localhost:3000/api/auth/providers
```

**Test with Session Cookie**
```bash
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  http://localhost:3000/api/projects
```

### Using Postman

1. Import environment variables
2. Set base URL: `http://localhost:3000/api`
3. Add session token to cookies
4. Make requests to endpoints

---

## 📚 Related Documentation

- [Production Deployment Guide](../deployment/PRODUCTION-DEPLOY-GUIDE.md)
- [API Setup Guide](API_SETUP_GUIDE.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

**Note:** All endpoints require proper authentication except for health checks and auth endpoints.
