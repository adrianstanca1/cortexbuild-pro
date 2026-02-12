# API Integration Guide

## Overview

This guide provides comprehensive documentation for integrating with the CortexBuild Pro API. The API is RESTful, uses JSON for request/response payloads, and requires JWT authentication.

## Base URL

- **Production**: `https://api.cortexbuildpro.com/api/v1`
- **Development**: `http://localhost:3001/api/v1`

## Authentication

All API endpoints (except public endpoints like login/register) require authentication via JWT Bearer token.

### Obtaining a Token

**POST** `/auth/login`

```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "user123",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "COMPANY_ADMIN",
        "companyId": "company456"
    }
}
```

### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Using the API Client Library

The frontend includes a comprehensive API client library (`src/services/apiClient.ts`) that handles authentication, retries, and error handling.

### Basic Usage

```typescript
import { apiClient, projectsApi, tasksApi } from '@/services/apiClient';

// Get all projects
const response = await projectsApi.getAll({ status: 'active' });
if (response.success) {
    console.log('Projects:', response.data);
} else {
    console.error('Error:', response.error);
}

// Create a new task
const taskResponse = await tasksApi.create({
    title: 'New Task',
    projectId: 'project123',
    assigneeId: 'user456',
    status: 'pending'
});
```

### Direct API Calls

```typescript
import { apiClient } from '@/services/apiClient';

// GET request
const response = await apiClient.get('/projects', {
    params: { status: 'active' }
});

// POST request
const response = await apiClient.post('/projects', {
    name: 'New Project',
    status: 'active'
});

// PUT request
const response = await apiClient.put('/projects/123', {
    name: 'Updated Project'
});

// DELETE request
const response = await apiClient.delete('/projects/123');
```

### File Upload

```typescript
import { documentsApi } from '@/services/apiClient';

const file = document.querySelector('input[type="file"]').files[0];

const response = await documentsApi.upload(file, (progress) => {
    console.log(`Upload progress: ${progress}%`);
});
```

### File Download

```typescript
import { documentsApi } from '@/services/apiClient';

await documentsApi.download('document123', 'filename.pdf');
```

## API Response Format

All API responses follow a consistent format:

### Success Response

```json
{
    "success": true,
    "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "error": "Error message",
    "message": "Detailed error description"
}
```

### Paginated Response

```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "total": 100,
        "page": 1,
        "pageSize": 20,
        "hasMore": true
    }
}
```

## Available API Endpoints

### Projects

#### Get All Projects

**GET** `/projects`

Query Parameters:
- `status` (string): Filter by status (active, completed, on_hold)
- `search` (string): Search by name or description
- `page` (number): Page number for pagination
- `pageSize` (number): Items per page

```typescript
const response = await projectsApi.getAll({
    status: 'active',
    page: 1,
    pageSize: 20
});
```

#### Get Project by ID

**GET** `/projects/:id`

```typescript
const response = await projectsApi.getById('project123');
```

#### Create Project

**POST** `/projects`

```json
{
    "name": "New Project",
    "description": "Project description",
    "status": "active",
    "startDate": "2024-01-25",
    "endDate": "2024-12-31",
    "companyId": "company456"
}
```

```typescript
const response = await projectsApi.create({
    name: 'New Project',
    description: 'Project description',
    status: 'active'
});
```

#### Update Project

**PUT** `/projects/:id`

```typescript
const response = await projectsApi.update('project123', {
    name: 'Updated Project Name',
    status: 'completed'
});
```

#### Delete Project

**DELETE** `/projects/:id`

```typescript
const response = await projectsApi.delete('project123');
```

### Tasks

#### Get All Tasks

**GET** `/tasks`

Query Parameters:
- `projectId` (string): Filter by project
- `status` (string): Filter by status
- `assigneeId` (string): Filter by assignee
- `priority` (string): Filter by priority

```typescript
const response = await tasksApi.getAll({
    projectId: 'project123',
    status: 'in_progress'
});
```

#### Get Task by ID

**GET** `/tasks/:id`

```typescript
const response = await tasksApi.getById('task123');
```

#### Create Task

**POST** `/tasks`

```json
{
    "title": "New Task",
    "description": "Task description",
    "projectId": "project123",
    "assigneeId": "user456",
    "status": "pending",
    "priority": "high",
    "dueDate": "2024-02-01"
}
```

```typescript
const response = await tasksApi.create({
    title: 'New Task',
    projectId: 'project123',
    assigneeId: 'user456',
    status: 'pending'
});
```

#### Update Task

**PUT** `/tasks/:id`

```typescript
const response = await tasksApi.update('task123', {
    status: 'completed',
    completedAt: new Date().toISOString()
});
```

#### Update Task Status

**PATCH** `/tasks/:id/status`

```typescript
const response = await tasksApi.updateStatus('task123', 'completed');
```

#### Delete Task

**DELETE** `/tasks/:id`

```typescript
const response = await tasksApi.delete('task123');
```

### Users

#### Get All Users

**GET** `/users`

```typescript
const response = await usersApi.getAll({
    role: 'PROJECT_MANAGER',
    companyId: 'company456'
});
```

#### Get Current User

**GET** `/auth/me`

```typescript
const response = await usersApi.getCurrent();
```

#### Update User

**PUT** `/users/:id`

```typescript
const response = await usersApi.update('user123', {
    name: 'Updated Name',
    phone: '+1234567890'
});
```

### Companies

#### Get All Companies

**GET** `/companies`

```typescript
const response = await companiesApi.getAll();
```

#### Get Company by ID

**GET** `/companies/:id`

```typescript
const response = await companiesApi.getById('company123');
```

#### Create Company

**POST** `/companies`

```typescript
const response = await companiesApi.create({
    name: 'New Company',
    email: 'contact@company.com',
    phone: '+1234567890'
});
```

#### Update Company

**PUT** `/companies/:id`

```typescript
const response = await companiesApi.update('company123', {
    name: 'Updated Company Name'
});
```

### Daily Logs

#### Get All Daily Logs

**GET** `/daily-logs`

```typescript
const response = await dailyLogsApi.getAll({
    projectId: 'project123',
    date: '2024-01-25'
});
```

#### Create Daily Log

**POST** `/daily-logs`

```typescript
const response = await dailyLogsApi.create({
    projectId: 'project123',
    date: '2024-01-25',
    weather: 'Sunny',
    temperature: 75,
    workPerformed: 'Foundation work',
    equipmentUsed: ['Excavator', 'Concrete mixer'],
    laborHours: 40
});
```

### RFIs (Requests for Information)

#### Get All RFIs

**GET** `/rfis`

```typescript
const response = await rfisApi.getAll({
    projectId: 'project123',
    status: 'open'
});
```

#### Create RFI

**POST** `/rfis`

```typescript
const response = await rfisApi.create({
    projectId: 'project123',
    title: 'Clarification Needed',
    description: 'Need clarification on foundation depth',
    priority: 'high',
    submittedBy: 'user123'
});
```

### Safety Incidents

#### Get All Safety Incidents

**GET** `/safety`

```typescript
const response = await safetyApi.getAll({
    projectId: 'project123',
    severity: 'high'
});
```

#### Create Safety Incident

**POST** `/safety`

```typescript
const response = await safetyApi.create({
    projectId: 'project123',
    type: 'injury',
    severity: 'medium',
    description: 'Minor cut on hand',
    date: '2024-01-25',
    location: 'Building A, Floor 2'
});
```

### Notifications

#### Get All Notifications

**GET** `/notifications`

```typescript
const response = await notificationsApi.getAll({
    read: false
});
```

#### Mark Notification as Read

**PATCH** `/notifications/:id/read`

```typescript
const response = await notificationsApi.markAsRead('notification123');
```

#### Mark All as Read

**POST** `/notifications/read-all`

```typescript
const response = await notificationsApi.markAllAsRead();
```

### Analytics

#### Get Dashboard Analytics

**GET** `/analytics/dashboard`

```typescript
const response = await analyticsApi.getDashboard();
```

#### Get Project Metrics

**GET** `/analytics/projects/:projectId`

```typescript
const response = await analyticsApi.getProjectMetrics('project123');
```

## Error Handling

The API client automatically handles common errors and retries failed requests:

```typescript
const response = await projectsApi.getAll();

if (!response.success) {
    // Handle error
    console.error('API Error:', response.error);
    
    // Show user-friendly message
    showErrorToast(response.error);
}
```

### Common Error Codes

- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Server temporarily unavailable

## Rate Limiting

API endpoints have rate limits to prevent abuse:

- **Standard endpoints**: 100 requests per minute
- **Authentication endpoints**: 5 requests per minute
- **Upload endpoints**: 10 requests per minute

When rate limit is exceeded, the API returns a 429 status code with:

```json
{
    "success": false,
    "error": "Too many requests",
    "retryAfter": 60
}
```

## Best Practices

1. **Always check response.success**: Don't assume API calls succeed
2. **Use TypeScript types**: Leverage TypeScript for type safety
3. **Handle loading states**: Show loading indicators during API calls
4. **Implement retry logic**: The API client handles this automatically
5. **Cache responses**: Cache frequently accessed data
6. **Use pagination**: Don't load all data at once for large datasets
7. **Validate inputs**: Validate data before sending to API
8. **Handle offline mode**: Queue requests when offline
9. **Implement optimistic updates**: Update UI before API response
10. **Monitor errors**: Log and monitor API errors

## Advanced Features

### Request Cancellation

```typescript
import axios from 'axios';

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

apiClient.get('/projects', {
    cancelToken: source.token
});

// Cancel request
source.cancel('Request cancelled');
```

### Custom Headers

```typescript
const response = await apiClient.get('/projects', {
    headers: {
        'X-Custom-Header': 'value'
    }
});
```

### Request Timeout

```typescript
const response = await apiClient.get('/projects', {
    timeout: 5000 // 5 seconds
});
```

## WebSocket Integration

For real-time updates, use WebSocket connections in conjunction with REST API calls. See [WEBSOCKET_EVENTS.md](./WEBSOCKET_EVENTS.md) for details.

```typescript
import { useWebSocket } from '@/contexts/WebSocketContext';

const { lastMessage, isConnected } = useWebSocket();

useEffect(() => {
    if (lastMessage?.type === 'project_updated') {
        // Refresh project data
        projectsApi.getById(lastMessage.entityId);
    }
}, [lastMessage]);
```

## Testing

### Using Postman

1. Import the API collection (if available)
2. Set environment variables:
   - `baseUrl`: API base URL
   - `token`: JWT token
3. Test endpoints

### Using cURL

```bash
# Login
curl -X POST https://api.cortexbuildpro.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get projects (with token)
curl -X GET https://api.cortexbuildpro.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For API support or questions:
- Documentation: https://cortexbuildpro.com/docs
- Email: support@cortexbuildpro.com
- GitHub Issues: https://github.com/adrianstanca1/cortexbuildapp.com/issues
