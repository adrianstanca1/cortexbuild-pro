# CortexBuild Pro - API Endpoints Documentation

This document provides a comprehensive list of all available API endpoints in CortexBuild Pro.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Authentication

All API endpoints (except `/api/auth/*`, `/api/signup`, `/api/openapi`, and `/api/csrf-token`) require authentication via NextAuth.js session cookies.

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/providers` | Get available authentication providers |
| `POST` | `/api/auth/signin` | Sign in with credentials |
| `POST` | `/api/auth/signout` | Sign out current session |
| `GET` | `/api/auth/session` | Get current session information |
| `GET` | `/api/auth/csrf` | Get CSRF token |
| `POST` | `/api/signup` | Create new user account |

## Core Modules

### Projects API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects in organization |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/[id]` | Get project details |
| `PUT` | `/api/projects/[id]` | Update project |
| `DELETE` | `/api/projects/[id]` | Delete project |
| `GET` | `/api/projects/[id]/tasks` | Get project tasks |
| `GET` | `/api/projects/[id]/team` | Get project team members |
| `POST` | `/api/projects/[id]/team` | Add team member to project |
| `DELETE` | `/api/projects/[id]/team/[userId]` | Remove team member |

### Tasks API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks (supports filtering) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/[id]` | Get task details |
| `PUT` | `/api/tasks/[id]` | Update task |
| `DELETE` | `/api/tasks/[id]` | Delete task |
| `PUT` | `/api/tasks/[id]/status` | Update task status |
| `POST` | `/api/tasks/[id]/assign` | Assign task to user |
| `POST` | `/api/tasks/[id]/comments` | Add comment to task |

### RFIs (Request for Information) API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rfis` | List all RFIs |
| `POST` | `/api/rfis` | Create new RFI |
| `GET` | `/api/rfis/[id]` | Get RFI details |
| `PUT` | `/api/rfis/[id]` | Update RFI |
| `DELETE` | `/api/rfis/[id]` | Delete RFI |
| `POST` | `/api/rfis/[id]/response` | Add response to RFI |

### Submittals API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/submittals` | List all submittals |
| `POST` | `/api/submittals` | Create new submittal |
| `GET` | `/api/submittals/[id]` | Get submittal details |
| `PUT` | `/api/submittals/[id]` | Update submittal |
| `DELETE` | `/api/submittals/[id]` | Delete submittal |
| `POST` | `/api/submittals/[id]/review` | Submit review for submittal |

### Documents API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents` | List all documents |
| `POST` | `/api/documents` | Upload new document |
| `GET` | `/api/documents/[id]` | Get document details |
| `PUT` | `/api/documents/[id]` | Update document metadata |
| `DELETE` | `/api/documents/[id]` | Delete document |
| `GET` | `/api/documents/[id]/download` | Download document |
| `POST` | `/api/upload` | Upload file to S3 |

### Drawings API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/drawings` | List all drawings |
| `POST` | `/api/drawings` | Create new drawing |
| `GET` | `/api/drawings/[id]` | Get drawing details |
| `PUT` | `/api/drawings/[id]` | Update drawing |
| `DELETE` | `/api/drawings/[id]` | Delete drawing |

### Team Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/team` | List all team members |
| `POST` | `/api/team` | Add team member |
| `GET` | `/api/team/[id]` | Get team member details |
| `PUT` | `/api/team/[id]` | Update team member |
| `DELETE` | `/api/team/[id]` | Remove team member |
| `PUT` | `/api/team/[id]/role` | Update member role |

### Time Tracking API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/time-entries` | List time entries |
| `POST` | `/api/time-entries` | Create time entry |
| `GET` | `/api/time-entries/[id]` | Get time entry details |
| `PUT` | `/api/time-entries/[id]` | Update time entry |
| `DELETE` | `/api/time-entries/[id]` | Delete time entry |
| `GET` | `/api/time-entries/summary` | Get time summary report |

### Budget Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/budget` | List budget items |
| `POST` | `/api/budget` | Create budget item |
| `GET` | `/api/budget/[id]` | Get budget item details |
| `PUT` | `/api/budget/[id]` | Update budget item |
| `DELETE` | `/api/budget/[id]` | Delete budget item |
| `GET` | `/api/budget/forecast` | Get budget forecast |

### Safety Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/safety` | List safety incidents |
| `POST` | `/api/safety` | Report safety incident |
| `GET` | `/api/safety/[id]` | Get incident details |
| `PUT` | `/api/safety/[id]` | Update incident |
| `DELETE` | `/api/safety/[id]` | Delete incident |
| `GET` | `/api/safety/stats` | Get safety statistics |
| `GET` | `/api/toolbox-talks` | List toolbox talks |
| `POST` | `/api/toolbox-talks` | Create toolbox talk |

### Daily Reports API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/daily-reports` | List daily reports |
| `POST` | `/api/daily-reports` | Create daily report |
| `GET` | `/api/daily-reports/[id]` | Get report details |
| `PUT` | `/api/daily-reports/[id]` | Update report |
| `DELETE` | `/api/daily-reports/[id]` | Delete report |
| `POST` | `/api/daily-reports/[id]/photos` | Add photos to report |

### Change Orders API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/change-orders` | List change orders |
| `POST` | `/api/change-orders` | Create change order |
| `GET` | `/api/change-orders/[id]` | Get change order details |
| `PUT` | `/api/change-orders/[id]` | Update change order |
| `DELETE` | `/api/change-orders/[id]` | Delete change order |

### Permits API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/permits` | List permits |
| `POST` | `/api/permits` | Create permit |
| `GET` | `/api/permits/[id]` | Get permit details |
| `PUT` | `/api/permits/[id]` | Update permit |
| `DELETE` | `/api/permits/[id]` | Delete permit |
| `GET` | `/api/hot-work-permits` | List hot work permits |
| `POST` | `/api/hot-work-permits` | Create hot work permit |
| `GET` | `/api/confined-space-permits` | List confined space permits |
| `POST` | `/api/confined-space-permits` | Create confined space permit |

### Inspections API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inspections` | List inspections |
| `POST` | `/api/inspections` | Create inspection |
| `GET` | `/api/inspections/[id]` | Get inspection details |
| `PUT` | `/api/inspections/[id]` | Update inspection |
| `DELETE` | `/api/inspections/[id]` | Delete inspection |

### Equipment API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/equipment` | List equipment |
| `POST` | `/api/equipment` | Add equipment |
| `GET` | `/api/equipment/[id]` | Get equipment details |
| `PUT` | `/api/equipment/[id]` | Update equipment |
| `DELETE` | `/api/equipment/[id]` | Delete equipment |
| `GET` | `/api/mewp-checks` | List MEWP checks |
| `POST` | `/api/mewp-checks` | Create MEWP check |
| `GET` | `/api/tool-checks` | List tool checks |
| `POST` | `/api/tool-checks` | Create tool check |

### Materials API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/materials` | List materials |
| `POST` | `/api/materials` | Add material |
| `GET` | `/api/materials/[id]` | Get material details |
| `PUT` | `/api/materials/[id]` | Update material |
| `DELETE` | `/api/materials/[id]` | Delete material |

### Meetings API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/meetings` | List meetings |
| `POST` | `/api/meetings` | Create meeting |
| `GET` | `/api/meetings/[id]` | Get meeting details |
| `PUT` | `/api/meetings/[id]` | Update meeting |
| `DELETE` | `/api/meetings/[id]` | Delete meeting |
| `POST` | `/api/meetings/[id]/minutes` | Add meeting minutes |

### Milestones API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/milestones` | List milestones |
| `POST` | `/api/milestones` | Create milestone |
| `GET` | `/api/milestones/[id]` | Get milestone details |
| `PUT` | `/api/milestones/[id]` | Update milestone |
| `DELETE` | `/api/milestones/[id]` | Delete milestone |

### Progress Claims API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress-claims` | List progress claims |
| `POST` | `/api/progress-claims` | Create progress claim |
| `GET` | `/api/progress-claims/[id]` | Get claim details |
| `PUT` | `/api/progress-claims/[id]` | Update claim |
| `DELETE` | `/api/progress-claims/[id]` | Delete claim |

### Subcontractors API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subcontractors` | List subcontractors |
| `POST` | `/api/subcontractors` | Add subcontractor |
| `GET` | `/api/subcontractors/[id]` | Get subcontractor details |
| `PUT` | `/api/subcontractors/[id]` | Update subcontractor |
| `DELETE` | `/api/subcontractors/[id]` | Delete subcontractor |

### Defects API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/defects` | List defects |
| `POST` | `/api/defects` | Report defect |
| `GET` | `/api/defects/[id]` | Get defect details |
| `PUT` | `/api/defects/[id]` | Update defect |
| `DELETE` | `/api/defects/[id]` | Delete defect |

### Punch Lists API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/punch-lists` | List punch list items |
| `POST` | `/api/punch-lists` | Create punch list item |
| `GET` | `/api/punch-lists/[id]` | Get item details |
| `PUT` | `/api/punch-lists/[id]` | Update item |
| `DELETE` | `/api/punch-lists/[id]` | Delete item |

## Dashboard & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Get dashboard statistics |
| `GET` | `/api/dashboard/analytics` | Get analytics data |
| `GET` | `/api/dashboard/agenda` | Get user's agenda/schedule |

## Company Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/company/settings` | Get company settings |
| `PUT` | `/api/company/settings` | Update company settings |
| `GET` | `/api/company/stats` | Get company statistics |
| `GET` | `/api/company/analytics` | Get company analytics |
| `GET` | `/api/company/activity` | Get company activity feed |
| `GET` | `/api/company/team` | Get company team |
| `GET` | `/api/company/invitations` | List invitations |
| `POST` | `/api/company/invitations` | Send invitation |
| `POST` | `/api/company/invitations/accept` | Accept invitation |
| `POST` | `/api/company/invitations/validate` | Validate invitation token |

## Admin Console

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/system-health` | Get system health status |
| `GET` | `/api/admin/organizations` | List all organizations |
| `POST` | `/api/admin/organizations` | Create organization |
| `GET` | `/api/admin/organizations/[id]` | Get organization details |
| `PUT` | `/api/admin/organizations/[id]` | Update organization |
| `DELETE` | `/api/admin/organizations/[id]` | Delete organization |
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/users/[id]` | Get user details |
| `PUT` | `/api/admin/users/[id]` | Update user |
| `DELETE` | `/api/admin/users/[id]` | Delete user |
| `GET` | `/api/admin/stats` | Get admin statistics |
| `GET` | `/api/admin/activity` | Get platform activity |
| `GET` | `/api/admin/invitations` | List all invitations |
| `GET` | `/api/admin/audit-logs` | Get audit logs |
| `GET` | `/api/admin/live-feed` | Get live activity feed |
| `GET` | `/api/admin/platform-config` | Get platform configuration |
| `PUT` | `/api/admin/platform-config` | Update platform configuration |

### Admin API Connections

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/api-connections` | List API connections |
| `POST` | `/api/admin/api-connections` | Create API connection |
| `GET` | `/api/admin/api-connections/[id]` | Get connection details |
| `PUT` | `/api/admin/api-connections/[id]` | Update connection |
| `DELETE` | `/api/admin/api-connections/[id]` | Delete connection |
| `POST` | `/api/admin/api-connections/[id]/test` | Test connection |
| `POST` | `/api/admin/api-connections/[id]/rotate` | Rotate API keys |
| `GET` | `/api/admin/api-connections/health` | Get health status |
| `GET` | `/api/admin/api-connections/health-history` | Get health history |
| `GET` | `/api/admin/api-connections/rate-limits` | Get rate limits |
| `GET` | `/api/admin/api-connections/logs` | Get API logs |
| `GET` | `/api/admin/api-connections/analytics` | Get analytics |
| `GET` | `/api/admin/api-connections/services` | List services |
| `POST` | `/api/admin/api-connections/export` | Export configuration |
| `POST` | `/api/admin/api-connections/import` | Import configuration |

## Real-time & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/realtime` | SSE endpoint for real-time updates |
| `GET` | `/api/notifications` | Get user notifications |
| `POST` | `/api/notifications/mark-read` | Mark notification as read |
| `POST` | `/api/notifications/mark-all-read` | Mark all as read |
| `DELETE` | `/api/notifications/[id]` | Delete notification |

## AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai` | AI chat/assistant |
| `POST` | `/api/ai/analyze-document` | Analyze document with AI |

## Search & Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search` | Global search across entities |
| `GET` | `/api/activity` | Get activity feed |

## Reports & Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | Generate reports |
| `POST` | `/api/export` | Export data |
| `POST` | `/api/batch` | Batch operations |

## Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/webhooks` | List webhooks |
| `POST` | `/api/webhooks` | Create webhook |
| `DELETE` | `/api/webhooks/[id]` | Delete webhook |

## Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/csrf-token` | Get CSRF token |
| `GET` | `/api/openapi` | Get OpenAPI specification |

## WebSocket Connection

**Endpoint**: `wss://your-domain.com/api/socketio`

**Events (Client → Server)**:
- `authenticate` - Authenticate WebSocket connection
- `join_project` - Join project room
- `leave_project` - Leave project room
- `task_update` - Update task status
- `message_send` - Send chat message

**Events (Server → Client)**:
- `authenticated` - Authentication successful
- `authentication-error` - Authentication failed
- `project_created` - New project created
- `task_updated` - Task was updated
- `message_received` - New chat message
- `notification` - New notification

## Response Format

### Success Response
```json
{
  "data": { ... },
  "success": true
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "errors": {
    "field1": ["Error message 1"],
    "field2": ["Error message 2"]
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour

## API Count Summary

- **Total API Routes**: 145+
- **Authentication**: 6 endpoints
- **Project Management**: 30+ endpoints
- **Safety & Compliance**: 25+ endpoints
- **Admin Console**: 30+ endpoints
- **Real-time**: WebSocket + SSE

## Getting Started

1. **Authenticate**: Obtain a session by calling `/api/auth/signin`
2. **Get Projects**: Call `/api/projects` to list projects
3. **Create Resources**: Use POST endpoints to create entities
4. **Real-time Updates**: Connect to WebSocket for live updates
5. **Documentation**: Access OpenAPI spec at `/api/openapi`

## Testing the API

### Using cURL

```bash
# Get projects
curl -X GET http://localhost:3000/api/projects \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Project", "description": "Description"}'
```

### Using the Application

The application includes built-in API testing at:
- Swagger UI: `http://localhost:3000/api/openapi` (when integrated)
- Admin Console: `http://localhost:3000/admin/api-management`

## Need Help?

- Check the OpenAPI specification: `/api/openapi`
- Review the source code in `app/api/` directory
- See API setup guide: `API_SETUP_GUIDE.md`
- Contact support or open an issue on GitHub
