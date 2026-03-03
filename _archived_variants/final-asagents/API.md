# ASAgents Platform - API Documentation

## 🌐 Base URL

- **Development**: `http://localhost:5001`
- **Production**: `https://api.your-domain.com`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login Flow

1. **POST** `/api/auth/login` - Get JWT token
2. Include token in subsequent requests
3. Token expires after 24 hours

## 📋 API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@buildcorp.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "admin@buildcorp.com",
    "first_name": "John",
    "last_name": "Admin",
    "role": "admin",
    "company_id": "1"
  },
  "company": {
    "id": "1",
    "name": "BuildCorp Construction",
    "type": "general_contractor"
  }
}
```

#### POST /api/auth/logout
Logout user (invalidate token).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "1",
  "email": "admin@buildcorp.com",
  "first_name": "John",
  "last_name": "Admin",
  "role": "admin",
  "company_id": "1",
  "phone": "+1-555-0101",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Project Endpoints

#### GET /api/projects
List projects with optional filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search in project name/description
- `status` (string): Filter by status (planning, active, on_hold, completed, cancelled)
- `priority` (string): Filter by priority (low, medium, high, critical)
- `sort` (string): Sort field (name, status, created_at, etc.)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "projects": [
    {
      "id": "1",
      "name": "Downtown Office Complex",
      "description": "Modern 15-story office building",
      "status": "active",
      "priority": "high",
      "progress": 65,
      "budget": 2500000,
      "start_date": "2024-01-15",
      "end_date": "2024-12-15",
      "address": "123 Main St, Downtown",
      "client_name": "Metro Properties",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

#### POST /api/projects
Create a new project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Construction Project",
  "description": "Project description",
  "start_date": "2024-02-01",
  "end_date": "2024-08-01",
  "budget": 1500000,
  "address": "456 Oak Ave, Suburb"
}
```

**Response:**
```json
{
  "id": "4",
  "name": "New Construction Project",
  "description": "Project description",
  "status": "planning",
  "priority": "medium",
  "progress": 0,
  "budget": 1500000,
  "start_date": "2024-02-01",
  "end_date": "2024-08-01",
  "address": "456 Oak Ave, Suburb",
  "company_id": "1",
  "created_at": "2024-01-20T10:30:00.000Z"
}
```

#### GET /api/projects/:id
Get project details by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "1",
  "name": "Downtown Office Complex",
  "description": "Modern 15-story office building",
  "status": "active",
  "priority": "high",
  "progress": 65,
  "budget": 2500000,
  "start_date": "2024-01-15",
  "end_date": "2024-12-15",
  "address": "123 Main St, Downtown",
  "client_name": "Metro Properties",
  "company_id": "1",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-20T10:30:00.000Z"
}
```

#### PUT /api/projects/:id
Update project by ID.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "status": "active",
  "progress": 75
}
```

**Response:** Updated project object (same as GET response)

#### DELETE /api/projects/:id
Delete project by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Invoice Endpoints

#### GET /api/invoices
List invoices with optional filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status (draft, sent, paid, overdue, cancelled)
- `date_from` (string): Filter from date (YYYY-MM-DD)
- `date_to` (string): Filter to date (YYYY-MM-DD)
- `sort` (string): Sort field
- `order` (string): Sort order

**Response:**
```json
{
  "invoices": [
    {
      "id": "1",
      "invoice_number": "INV-2024-001",
      "status": "paid",
      "total_amount": 125000,
      "due_date": "2024-02-15",
      "client_name": "Metro Properties",
      "project_name": "Downtown Office Complex",
      "created_at": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

#### POST /api/invoices
Create a new invoice.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "project_id": "1",
  "client_id": "3",
  "due_date": "2024-03-15",
  "notes": "Monthly progress billing",
  "items": [
    {
      "description": "Foundation work",
      "quantity": 1,
      "unit_price": 50000
    },
    {
      "description": "Steel framing",
      "quantity": 2,
      "unit_price": 25000
    }
  ]
}
```

**Response:**
```json
{
  "id": "4",
  "invoice_number": "INV-2024-004",
  "status": "draft",
  "total_amount": 100000,
  "due_date": "2024-03-15",
  "notes": "Monthly progress billing",
  "project_id": "1",
  "client_id": "3",
  "company_id": "1",
  "created_at": "2024-01-20T10:30:00.000Z"
}
```

#### GET /api/invoices/:id
Get invoice details with items.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "1",
  "invoice_number": "INV-2024-001",
  "status": "paid",
  "total_amount": 125000,
  "due_date": "2024-02-15",
  "notes": "Initial project payment",
  "client_name": "Metro Properties",
  "project_name": "Downtown Office Complex",
  "items": [
    {
      "id": "1",
      "description": "Project planning and design",
      "quantity": 1,
      "unit_price": 75000,
      "total_price": 75000
    },
    {
      "id": "2",
      "description": "Site preparation",
      "quantity": 1,
      "unit_price": 50000,
      "total_price": 50000
    }
  ],
  "created_at": "2024-01-15T00:00:00.000Z"
}
```

#### GET /api/invoices/summary
Get invoice statistics and summary.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_invoices": 3,
  "total_amount": 275000,
  "total_paid": 125000,
  "draft_count": 1,
  "sent_count": 1,
  "paid_count": 1,
  "overdue_count": 0
}
```

### System Endpoints

#### GET /api/health
System health check and status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "tables": 8,
    "total_records": 156
  },
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB",
    "percentage": 8.8
  },
  "services": {
    "api": "running",
    "websocket": "running",
    "database": "connected"
  }
}
```

## 🔌 WebSocket API

### Connection
Connect to WebSocket at: `ws://localhost:5001/ws`

### Authentication
Send authentication message after connection:
```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

### Message Types

#### Real-time Updates
```json
{
  "type": "project_updated",
  "data": {
    "id": "1",
    "name": "Updated Project Name",
    "progress": 75
  }
}
```

#### Notifications
```json
{
  "type": "notification",
  "data": {
    "message": "New invoice created",
    "type": "info",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

#### System Status
```json
{
  "type": "system_status",
  "data": {
    "status": "healthy",
    "active_users": 5
  }
}
```

## 📊 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## 🔄 Rate Limiting

- **General API**: 100 requests per minute per IP
- **Authentication**: 5 login attempts per minute per IP
- **WebSocket**: 50 messages per minute per connection

## 📝 Request/Response Examples

### cURL Examples

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@buildcorp.com","password":"password123"}'

# Get projects
curl -X GET http://localhost:5001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create project
curl -X POST http://localhost:5001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Project","description":"Test project"}'
```

### JavaScript Examples

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@buildcorp.com',
    password: 'password123'
  })
});

// Get projects with token
const projects = await fetch('/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: ASAgents Development Team
