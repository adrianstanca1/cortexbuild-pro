# 🔗 Complete Integration Guide - ASAgents Platform

## Overview

This document describes the complete integration of all tools and functions across the ASAgents Construction Management Platform, including frontend React application, Node.js backend, Java backend, and all AI services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ASAgents Platform Architecture                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER (Port 80)                           │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + Vite                                  │   │
│  │  - PWA with offline support                                    │   │
│  │  - Intelligent API fallback (backend/mock)                     │   │
│  │  - Encrypted mock data storage                                 │   │
│  │  - Real-time WebSocket updates                                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                    HTTP/WebSocket Requests
                              ↓ ↑
┌───────────────────────────────────────────────────────────────────────┐
│               INTEGRATION LAYER (Port 5001)                            │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Unified Integration Service                                   │   │
│  │  - Circuit breaker pattern                                     │   │
│  │  - Automatic failover                                          │   │
│  │  - Request routing                                             │   │
│  │  - Response aggregation                                        │   │
│  │  - Health monitoring                                           │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
              ↓ ↑                                    ↓ ↑
         Port 5001                                Port 4001
              ↓ ↑                                    ↓ ↑
┌─────────────────────────────┐    ┌──────────────────────────────────┐
│   NODE.JS BACKEND (5001)    │    │   JAVA BACKEND (4001)            │
│  ┌───────────────────────┐  │    │  ┌──────────────────────────┐   │
│  │ Express + TypeScript  │  │    │  │ Spring Boot 3.4.1        │   │
│  │                       │  │    │  │ Java 21 LTS              │   │
│  │ Features:             │  │    │  │                          │   │
│  │ - Authentication      │  │    │  │ Features:                │   │
│  │ - CRUD Operations     │  │    │  │ - Enterprise Analytics  │   │
│  │ - Real-time (WS)      │  │    │  │ - Compliance Tracking   │   │
│  │ - Document Management │  │    │  │ - Advanced Reporting    │   │
│  │ - Gemini AI           │  │    │  │ - Multimodal Processing │   │
│  │ - 5-Manager System    │  │    │  │ - Workflow Engine       │   │
│  └───────────────────────┘  │    │  └──────────────────────────┘   │
└─────────────────────────────┘    └──────────────────────────────────┘
              ↓ ↑                                    ↓ ↑
         Port 3306                               Port 3306
              ↓ ↑                                    ↓ ↑
┌───────────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (Port 3306)                             │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  MySQL 8.0 Database                                            │   │
│  │  - Multi-tenant architecture                                   │   │
│  │  - RBAC security                                               │   │
│  │  - Audit logging                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │  Google        │  │  AWS Services  │  │  Azure Services        │  │
│  │  Gemini AI     │  │  (Optional)    │  │  (Optional)            │  │
│  └────────────────┘  └────────────────┘  └────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Integration

### 1. Frontend Integration

#### Authentication System
```typescript
// Intelligent API fallback
const connection = getAuthConnectionInfo();
if (connection.mode === 'backend') {
  // Real backend with JWT tokens (Port 5001 or 4001)
  await authClient.login(credentials);
} else {
  // Encrypted mock API with localStorage
  await mockApi.login(credentials);
}
```

#### Multi-Backend Communication
```typescript
// Frontend services automatically route to appropriate backend
import { backendGateway } from '@/services/backendGateway';

// This will be routed through integration layer
const data = await backendGateway.get('/api/projects');

// Integration layer decides: Node.js (5001) or Java (4001)
```

#### Real-Time Updates
```typescript
// WebSocket connection for real-time updates
import { realTimeService } from '@/services/realTimeService';

realTimeService.subscribe('project-updates', (data) => {
  // Handle real-time project updates
});
```

### 2. Backend Integration Layer (Node.js - Port 5001)

#### Unified Integration Service
```typescript
import { unifiedIntegration } from '@/services/UnifiedIntegrationService';

// Unified health check across all services
const health = await unifiedIntegration.getUnifiedHealth();

// Route request to appropriate backend with failover
const result = await unifiedIntegration.routeRequest('/api/analytics', 'GET');

// Aggregate data from both backends
const aggregated = await unifiedIntegration.aggregateData(
  '/api/enhanced/analytics',  // Java
  '/api/dashboard/stats'       // Node.js
);
```

#### Circuit Breaker Pattern
```typescript
// Automatic circuit breaker for failed services
// After 5 failures: circuit opens (60s timeout)
// After timeout: moves to half-open (test request)
// On success: circuit closes

// Manual reset if needed
unifiedIntegration.manualResetCircuitBreaker('java');
```

### 3. Java Backend Integration (Port 4001)

#### Backend Integration Service
```java
@Autowired
private BackendIntegrationService backendIntegration;

// Check Node.js availability
boolean available = backendIntegration.isNodeJsAvailable();

// Forward request to Node.js
Map<String, Object> result = backendIntegration.postToNodeJs(
    "/api/projects",
    projectData,
    Map.class
);

// Aggregate data from both backends
Map<String, Object> aggregated = backendIntegration.aggregateBackendData(
    "/api/dashboard/stats",
    javaData
);
```

### 4. AI Integration Across Backends

#### AI Integration Service
```typescript
import { aiIntegration } from '@/services/AIIntegrationService';

// Process AI request (auto-routes to best backend)
const response = await aiIntegration.processAIRequest({
  prompt: "Analyze construction project risks",
  context: projectData,
  modelType: 'gemini',  // or 'enterprise' for Java backend
  options: { temperature: 0.7, cache: true }
});

// Process multimodal content (Java backend)
const analysis = await aiIntegration.processMultimodal(
  fileBuffer,
  'image/jpeg',
  'full'
);

// Generate construction insights (both backends)
const insights = await aiIntegration.generateConstructionInsights(projectData);
```

## API Endpoints

### Integration Endpoints (Node.js - Port 5001)

```http
# Unified health check
GET /api/integration/health/unified

# Integration service status
GET /api/integration/status

# Reset circuit breaker
POST /api/integration/circuit-breaker/reset
Body: { "backend": "java" | "nodejs" }

# Route request with automatic failover
ANY /api/integration/route/*

# Aggregate data from both backends
POST /api/integration/aggregate
Body: { "javaPath": "/path", "nodePath": "/path" }

# Broadcast to both backends
POST /api/integration/broadcast
Body: { "path": "/path", "method": "POST", "data": {} }

# Forward to specific backend
ANY /api/integration/java/*
ANY /api/integration/node/*
```

### Node.js Backend Endpoints (Port 5001)

```http
# Authentication
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile

# Projects
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

# Tasks
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id

# Documents
GET    /api/documents
POST   /api/documents/upload
GET    /api/documents/:id
DELETE /api/documents/:id

# Dashboard
GET /api/dashboard/overview
GET /api/dashboard/stats

# System
GET /api/system/health
GET /api/system/status

# Analytics
GET /api/analytics/projects
GET /api/analytics/performance
```

### Java Backend Endpoints (Port 4001)

```http
# Enhanced Health
GET /api/enhanced/health

# Enhanced Authentication
POST /api/enhanced/auth/enhanced-login

# Multimodal Processing
POST /api/multimodal/upload
GET  /api/multimodal/:id
POST /api/multimodal/analyze-document

# Enhanced Dashboard
GET /api/enhanced/dashboard/unified

# Projects (Enhanced)
POST /api/enhanced/projects/process-multimodal

# Analytics
GET /api/enhanced/analytics/advanced
GET /api/enhanced/analytics/predictions

# Reporting
POST /api/enhanced/ai/generate-report
POST /api/enhanced/ai/predict
```

## Service Routing Rules

### Automatic Routing Logic

```typescript
// Integration layer automatically routes based on endpoint:

// Java Backend (4001):
- /api/enhanced/*
- /api/multimodal/*
- /api/analytics/*
- /api/reporting/*
- /api/compliance/*

// Node.js Backend (5001):
- /api/auth/*
- /api/projects/*
- /api/tasks/*
- /api/documents/*
- /api/users/*
- /api/dashboard/*
```

### Failover Strategy

1. **Primary Backend**: Request sent to designated backend
2. **Failure Detection**: Circuit breaker detects failure
3. **Automatic Fallback**: Request retried on alternate backend
4. **Circuit Breaker**: Opens after 5 consecutive failures
5. **Auto-Recovery**: Tests connection after 60 seconds
6. **Full Recovery**: Circuit closes on successful request

## Authentication Integration

### Shared JWT Authentication

```typescript
// JWT tokens work across both backends

// Login (Node.js generates token)
POST /api/auth/login
Response: { "token": "jwt-token", "user": {...} }

// Token validated by both backends:
// - Node.js: JwtAuthenticationFilter
// - Java: JwtAuthenticationFilter.java

// Headers for authenticated requests:
Authorization: Bearer <jwt-token>
```

### Session Management

```typescript
// Sessions managed in frontend AuthContext
// Token stored in localStorage (encrypted for mock mode)
// Auto-refresh before expiration
// Single sign-on across all services
```

## Health Monitoring

### Unified Health Check

```http
GET /api/integration/health/unified
```

```json
{
  "overall": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-10-02T10:00:00Z",
  "services": {
    "mysql": {
      "service": "MySQL Database",
      "status": "healthy",
      "details": { "connection": "connected" }
    },
    "nodejs": {
      "service": "Node.js Backend",
      "status": "healthy",
      "responseTime": 45,
      "details": { "uptime": 3600 }
    },
    "java": {
      "service": "Java Backend",
      "status": "healthy",
      "responseTime": 38,
      "capabilities": ["enterprise", "analytics", "compliance", "reporting"]
    },
    "frontend": {
      "service": "React Frontend",
      "status": "healthy",
      "responseTime": 12
    }
  },
  "systemInfo": {
    "environment": "production",
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

## Deployment Configuration

### Environment Variables

```bash
# Node.js Backend (Port 5001)
NODE_ENV=production
PORT=5001
DATABASE_URL=mysql://user:pass@localhost:3306/asagents_db
JWT_ACCESS_SECRET=your-secret
JAVA_BACKEND_URL=http://localhost:4001
GEMINI_API_KEY=your-gemini-key

# Java Backend (Port 4001)
SERVER_PORT=4001
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/asagents_db
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your-password
JWT_SECRET=your-secret
NODEJS_BACKEND_URL=http://localhost:5001
NODEJS_BACKEND_ENABLED=true

# Frontend (Port 80)
VITE_API_URL=http://localhost:5001
VITE_JAVA_API_URL=http://localhost:4001
VITE_ENABLE_MOCK_API=false
```

### Docker Compose Full Stack

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: asagents_db

  nodejs-backend:
    build: ./server
    ports:
      - "5001:5001"
    depends_on:
      - mysql
    environment:
      DATABASE_URL: mysql://root:rootpassword@mysql:3306/asagents_db
      JAVA_BACKEND_URL: http://java-backend:4001

  java-backend:
    build: ./backend/java
    ports:
      - "4001:4001"
    depends_on:
      - mysql
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/asagents_db
      NODEJS_BACKEND_URL: http://nodejs-backend:5001

  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - nodejs-backend
      - java-backend
    environment:
      VITE_API_URL: http://nodejs-backend:5001
      VITE_JAVA_API_URL: http://java-backend:4001
```

## Testing Integration

### Health Check Test

```bash
# Test unified health
curl http://localhost:5001/api/integration/health/unified | jq

# Test individual backends
curl http://localhost:5001/api/system/health | jq
curl http://localhost:4001/api/enhanced/health | jq

# Test circuit breaker status
curl http://localhost:5001/api/integration/status | jq
```

### Integration Test

```bash
# Test routing with failover
curl -X POST http://localhost:5001/api/integration/route/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project"}'

# Test data aggregation
curl -X POST http://localhost:5001/api/integration/aggregate \
  -H "Content-Type: application/json" \
  -d '{"javaPath":"/api/enhanced/health","nodePath":"/api/system/health"}'

# Test broadcast
curl -X POST http://localhost:5001/api/integration/broadcast \
  -H "Content-Type: application/json" \
  -d '{"path":"/api/test","method":"POST","data":{"test":true}}'
```

## Monitoring & Logging

### Centralized Logging

```typescript
// All services log to centralized system
import { logger } from '@/utils/logger';

logger.info('Request processed');
logger.error({ error }, 'Request failed');
logger.debug({ data }, 'Debug info');
```

### Metrics Collection

```typescript
// Metrics tracked automatically:
- Request count per endpoint
- Response times
- Error rates
- Circuit breaker state changes
- Cache hit/miss ratios
- AI processing times
```

## Best Practices

### 1. Error Handling
- Always use try-catch blocks
- Provide meaningful error messages
- Log errors with context
- Return appropriate HTTP status codes

### 2. Performance
- Enable caching where appropriate
- Use connection pooling
- Implement request debouncing
- Optimize database queries

### 3. Security
- Always validate JWT tokens
- Sanitize user inputs
- Use HTTPS in production
- Implement rate limiting
- Encrypt sensitive data

### 4. Reliability
- Use circuit breakers
- Implement retry logic
- Handle partial failures gracefully
- Monitor health continuously

## Troubleshooting

### Backend Not Responding

```bash
# Check service status
docker ps
ps aux | grep java
ps aux | grep node

# Check circuit breaker
curl http://localhost:5001/api/integration/status | jq .circuitBreakers

# Reset circuit breaker
curl -X POST http://localhost:5001/api/integration/circuit-breaker/reset \
  -H "Content-Type: application/json" \
  -d '{"backend":"java"}'
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -h localhost -u root -p -e "SHOW DATABASES;"

# Check backend database connectivity
curl http://localhost:5001/api/system/health | jq .database
curl http://localhost:4001/api/enhanced/health | jq .nodejsBackend
```

### AI Integration Issues

```bash
# Check AI service availability
curl http://localhost:5001/api/integration/health/unified | jq .services.java.capabilities

# Clear AI cache
# (Add endpoint to clear cache if needed)
```

## Summary

The ASAgents platform is now fully integrated with:

✅ **Unified Integration Layer** - Intelligent routing with circuit breakers
✅ **Backend-to-Backend Communication** - Java ↔ Node.js with retry logic
✅ **Comprehensive Health Monitoring** - All services monitored continuously
✅ **AI Service Integration** - Gemini AI + Enterprise AI with caching
✅ **Automatic Failover** - Seamless fallback between backends
✅ **Shared Authentication** - JWT tokens work across all services
✅ **Real-Time Updates** - WebSocket support for live data
✅ **Production-Ready** - Docker deployment with full stack orchestration

All tools and functions are now integrated and working together seamlessly!
