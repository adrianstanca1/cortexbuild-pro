# 🚀 Quick Integration Reference Guide

## Quick Start

### Start All Services

```bash
# Start MySQL
docker start final-mysql-1

# Start Node.js Backend (Port 5001)
docker start final-backend-1
# OR
cd server && npm run dev

# Start Java Backend (Port 4001)
cd backend/java && ./deploy-local.sh start

# Start Frontend (Port 80)
docker start final-frontend-1
# OR
npm run dev  # Development mode on port 5173
```

### Health Check Commands

```bash
# Check unified health (all services)
curl http://localhost:5001/api/integration/health/unified | jq

# Check Node.js backend
curl http://localhost:5001/api/system/health | jq

# Check Java backend
curl http://localhost:4001/api/enhanced/health | jq

# Check Frontend
curl http://localhost

# Check MySQL
docker exec final-mysql-1 mysqladmin ping
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | <http://localhost> | React application |
| **Node.js API** | <http://localhost:5001/api> | Main API endpoints |
| **Java API** | <http://localhost:4001/api> | Enterprise features |
| **Integration API** | <http://localhost:5001/api/integration> | Cross-backend integration |
| **MySQL** | localhost:3306 | Database |

## Common Integration Tasks

### 1. Forward Request to Specific Backend

```typescript
import { unifiedIntegration } from '@/services/UnifiedIntegrationService';

// Forward to Java backend
const javaResult = await unifiedIntegration.forwardToJava(
  '/api/enhanced/analytics',
  'GET'
);

// Forward to Node.js backend
const nodeResult = await unifiedIntegration.forwardToNode(
  '/api/projects',
  'GET'
);
```

### 2. Auto-Route with Failover

```typescript
// Automatically routes to correct backend with failover
const result = await unifiedIntegration.routeRequest(
  '/api/enhanced/dashboard',
  'GET'
);
```

### 3. Aggregate Data from Both Backends

```typescript
const aggregated = await unifiedIntegration.aggregateData(
  '/api/enhanced/analytics',  // Java
  '/api/dashboard/stats'       // Node.js
);

console.log(aggregated.java);  // Java backend data
console.log(aggregated.node);  // Node.js backend data
```

### 4. Process AI Request

```typescript
import { aiIntegration } from '@/services/AIIntegrationService';

const response = await aiIntegration.processAIRequest({
  prompt: "Analyze project risks",
  context: projectData,
  modelType: 'gemini',
  options: { cache: true, temperature: 0.7 }
});
```

### 5. Handle Multimodal Content

```typescript
const analysis = await aiIntegration.processMultimodal(
  fileBuffer,
  'image/jpeg',
  'full'
);
```

### 6. Check Circuit Breaker Status

```typescript
const status = unifiedIntegration.getCircuitBreakerStatus();

if (status.java?.state === 'open') {
  console.log('Java backend circuit breaker is open');
}
```

### 7. Reset Circuit Breaker

```bash
# Via API
curl -X POST http://localhost:5001/api/integration/circuit-breaker/reset \
  -H "Content-Type: application/json" \
  -d '{"backend":"java"}'
```

```typescript
// Via code
unifiedIntegration.manualResetCircuitBreaker('java');
```

## API Quick Reference

### Integration Endpoints

```http
# Unified health check
GET /api/integration/health/unified

# Integration status
GET /api/integration/status

# Route request
ANY /api/integration/route/*

# Aggregate data
POST /api/integration/aggregate
{
  "javaPath": "/api/enhanced/analytics",
  "nodePath": "/api/dashboard/stats"
}

# Broadcast to both
POST /api/integration/broadcast
{
  "path": "/api/test",
  "method": "POST",
  "data": {}
}

# Forward to Java
ANY /api/integration/java/*

# Forward to Node.js
ANY /api/integration/node/*

# Reset circuit breaker
POST /api/integration/circuit-breaker/reset
{
  "backend": "java"
}
```

### Authentication

```http
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Use token in headers
Authorization: Bearer <jwt-token>
```

### Projects

```http
GET    /api/projects           # List projects (Node.js)
POST   /api/projects           # Create project (Node.js)
GET    /api/projects/:id       # Get project (Node.js)
PUT    /api/projects/:id       # Update project (Node.js)
DELETE /api/projects/:id       # Delete project (Node.js)

# Enhanced project processing (Java)
POST   /api/enhanced/projects/process-multimodal
```

### Analytics

```http
GET /api/analytics/projects           # Node.js analytics
GET /api/enhanced/analytics/advanced  # Java advanced analytics
```

### AI Features

```http
# Node.js Gemini AI
POST /api/ai/gemini

# Java Enterprise AI
POST /api/enhanced/ai/process
POST /api/enhanced/ai/predict
POST /api/enhanced/ai/generate-report
```

## Troubleshooting

### Service Not Responding

```bash
# Check if service is running
docker ps | grep final
ps aux | grep java
ps aux | grep node

# Restart service
docker restart final-backend-1
cd backend/java && ./deploy-local.sh restart

# Check logs
docker logs final-backend-1
docker logs final-frontend-1
cd backend/java && ./deploy-local.sh logs
```

### Circuit Breaker Open

```bash
# Check status
curl http://localhost:5001/api/integration/status | jq .circuitBreakers

# Reset circuit breaker
curl -X POST http://localhost:5001/api/integration/circuit-breaker/reset \
  -H "Content-Type: application/json" \
  -d '{"backend":"java"}'

# Wait for auto-recovery (5 minutes) or restart service
```

### Database Connection Failed

```bash
# Check MySQL
docker exec final-mysql-1 mysqladmin ping

# Restart MySQL
docker restart final-mysql-1

# Check connection in backend
curl http://localhost:5001/api/system/health | jq .database
```

### Authentication Issues

```bash
# Verify JWT secret matches in both backends
echo $JWT_ACCESS_SECRET  # Node.js
# Check application.properties for Java

# Test authentication
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Environment Variables

### Node.js Backend

```bash
NODE_ENV=production
PORT=5001
DATABASE_URL=mysql://root:password@localhost:3306/asagents_db
JWT_ACCESS_SECRET=your-secret-key
JAVA_BACKEND_URL=http://localhost:4001
GEMINI_API_KEY=your-gemini-key
```

### Java Backend

```bash
SERVER_PORT=4001
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/asagents_db
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your-password
JWT_SECRET=your-secret-key
NODEJS_BACKEND_URL=http://localhost:5001
NODEJS_BACKEND_ENABLED=true
```

### Frontend

```bash
VITE_API_URL=http://localhost:5001
VITE_JAVA_API_URL=http://localhost:4001
VITE_ENABLE_MOCK_API=false
```

## Service Management

### Node.js Backend

```bash
# Development
cd server && npm run dev

# Production
cd server && npm run build && npm start

# Docker
docker start final-backend-1
docker stop final-backend-1
docker logs -f final-backend-1
```

### Java Backend

```bash
# Using deployment script
cd backend/java
./deploy-local.sh start        # Start service
./deploy-local.sh stop         # Stop service
./deploy-local.sh restart      # Restart service
./deploy-local.sh status       # Check status
./deploy-local.sh logs         # View logs
./deploy-local.sh build        # Build only
./deploy-local.sh deploy       # Build and start

# Manual
cd backend/java
mvn clean package
java -jar target/*.jar
```

### Frontend

```bash
# Development (hot reload)
npm run dev  # Port 5173

# Production build
npm run build
docker restart final-frontend-1

# Docker
docker start final-frontend-1
docker logs -f final-frontend-1
```

## Integration Patterns

### Pattern 1: Direct Backend Communication

```typescript
// Node.js calling Java
const javaService = new BackendIntegrationService();
const result = await javaService.postToNodeJs('/path', data);

// Java calling Node.js  
@Autowired
private BackendIntegrationService backendIntegration;
Map<String, Object> result = backendIntegration.getFromNodeJs("/path", Map.class);
```

### Pattern 2: Circuit Breaker

```typescript
// Automatic circuit breaker
// After 5 failures: Opens (stops requests for 60s)
// After 60s: Half-open (tests with 1 request)
// On success: Closes (normal operation)
```

### Pattern 3: Request Routing

```typescript
// Java backend routes:
// - /api/enhanced/*
// - /api/multimodal/*
// - /api/analytics/*
// - /api/reporting/*

// Node.js backend routes:
// - /api/auth/*
// - /api/projects/*
// - /api/tasks/*
// - /api/documents/*
// - Everything else
```

### Pattern 4: Failover

```typescript
// Automatic failover
try {
  // Try primary backend
  result = await primaryBackend.request();
} catch (error) {
  // Automatically fail over to secondary
  result = await secondaryBackend.request();
}
```

## Monitoring

### Health Checks

```bash
# Complete system health
curl http://localhost:5001/api/integration/health/unified | jq

# Response includes:
# - Overall status: healthy/degraded/unhealthy
# - MySQL status
# - Node.js status and response time
# - Java status and capabilities
# - Frontend status
# - System info (uptime, version)
```

### Metrics

```bash
# Circuit breaker status
curl http://localhost:5001/api/integration/status | jq

# Response includes:
# - Circuit breaker state for each backend
# - Failure counts
# - Configuration details
```

### Logs

```bash
# Node.js logs
docker logs -f final-backend-1

# Java logs
cd backend/java && ./deploy-local.sh logs

# Frontend logs
docker logs -f final-frontend-1

# MySQL logs
docker logs final-mysql-1
```

## Development Workflow

### 1. Make Changes

```bash
# Frontend
# Edit files in src/
# Changes hot-reload automatically if using npm run dev

# Node.js Backend
# Edit files in server/src/
# Restart: docker restart final-backend-1

# Java Backend
# Edit files in backend/java/src/
# Rebuild: cd backend/java && ./deploy-local.sh deploy
```

### 2. Test Changes

```bash
# Run integration tests
cd server && npm test

# Test specific endpoint
curl http://localhost:5001/api/integration/health/unified | jq

# Test frontend
open http://localhost
```

### 3. Deploy Changes

```bash
# Development (local)
# Just restart services after changes

# Production (IONOS/AWS/Azure)
./deploy-to-ionos.sh
# OR
docker-compose up -d --build
```

## Key Files

| File | Purpose |
|------|---------|
| `server/src/services/UnifiedIntegrationService.ts` | Main integration service |
| `server/src/services/AIIntegrationService.ts` | AI integration across backends |
| `server/src/routes/integration.ts` | Integration API routes |
| `backend/java/src/.../BackendIntegrationService.java` | Java integration service |
| `backend/java/src/.../EnhancedMultimodalController.java` | Java enhanced API |
| `INTEGRATION_COMPLETE.md` | Complete documentation |
| `server/tests/integration-complete.test.ts` | Integration tests |

## Support

For issues or questions:

1. Check logs: `docker logs <container>` or `./deploy-local.sh logs`
2. Check health: `curl http://localhost:5001/api/integration/health/unified | jq`
3. Check circuit breakers: `curl http://localhost:5001/api/integration/status | jq`
4. Reset if needed: Reset circuit breaker or restart services
5. Review documentation: `INTEGRATION_COMPLETE.md`

---

**Last Updated**: October 2, 2025
**Platform Version**: 1.0.0
**Integration Status**: ✅ Complete
