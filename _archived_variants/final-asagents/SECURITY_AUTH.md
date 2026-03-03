# Security & Authentication Guide

## Overview

The ASAgents platform implements a **unified JWT-based authentication system** that spans both Node.js AI backend (port 4000) and Java Enterprise backend (port 4001). This guide covers the authentication flow, tenant isolation, environment setup, and security best practices.

## Authentication Flow

### 1. Login Process
```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Node as Node.js Backend (4000)
    participant Java as Java Backend (4001)
    participant DB as Database
    
    Client->>Node: POST /api/auth/login {email, password}
    Node->>DB: Verify user credentials
    DB-->>Node: User + Company data
    Node->>Node: Generate JWT (HS256)
    Node-->>Client: {token, user, company, expires_in}
    
    Note over Client: Store token for subsequent requests
    
    Client->>Java: GET /api/enhanced/projects (Bearer token)
    Java->>Java: Verify JWT signature & claims
    Java->>Java: Extract tenant from companyId claim
    Java->>DB: Query projects WHERE tenant_id = ?
    DB-->>Java: Tenant-scoped results
    Java-->>Client: Protected data
```

### 2. JWT Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "uuid-string",
  "email": "user@company.com",
  "role": "admin|manager|worker|client",
  "companyId": "company-uuid",
  "tenantId": "company-uuid",
  "iss": "asagents-api",
  "aud": "asagents-client",
  "exp": 1727500800,
  "iat": 1727414400
}
```

## Environment Configuration

### Required Environment Variables

#### Node.js Backend (.env)
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-256-bits
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=mysql://user:pass@localhost:3306/asagents_db

# AI Services
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

#### Java Backend (application.properties)
```properties
# Server Configuration
server.port=4001

# JWT Configuration (maps to @Value annotations)
app.security.jwt.secret=${JWT_SECRET:your-super-secret-jwt-key-change-in-production}
app.security.jwt.expected-issuer=asagents-api
app.security.jwt.expected-audience=asagents-client

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/asagents_db
spring.datasource.username=root
spring.datasource.password=yourpassword
```

#### Docker Compose Environment
```yaml
# docker-compose.dual.yml
services:
  node-backend:
    environment:
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
  
  java-backend:
    environment:
      APP_SECURITY_JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      APP_SECURITY_JWT_EXPECTED_ISSUER: asagents-api
      APP_SECURITY_JWT_EXPECTED_AUDIENCE: asagents-client
```

### Environment Variable Precedence
1. System environment variables
2. `.env` files (Node.js)
3. `application.properties` defaults (Java)
4. Docker Compose environment section
5. Hardcoded fallbacks (development only)

## Multi-Tenant Architecture

### Tenant Isolation Strategy

**Node.js Implementation:**
- `tenantContext` middleware extracts tenant from JWT `companyId` claim or `X-Tenant-ID` header
- All database queries include `WHERE company_id = ?` filtering
- `requireCompanyAccess` middleware enforces tenant presence

**Java Implementation:**
- `JwtAuthenticationFilter` extracts `companyId`/`tenantId` and sets request attributes
- `TenantFilter` populates `TenantContext` ThreadLocal
- `TenantScopedService` base class provides `requireTenantId()` helper
- Repository layer uses tenant-aware queries: `findByTenantIdAndStatus(...)`

### Tenant Context Flow
```java
// Java Service Example
@Service
public class ProjectTenantService extends TenantScopedService {
    
    public Page<Project> listProjects(int page, int size) {
        Long tenantId = requireTenantId(); // From ThreadLocal
        return projectRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size));
    }
}
```

## Security Features

### JWT Security
- **Algorithm:** HMAC-SHA256 (HS256)
- **Secret Length:** Minimum 256 bits recommended
- **Expiration:** 24 hours (configurable)
- **Claims Validation:** Issuer, audience, expiration enforced

### Request Security
- **CSRF Protection:** Disabled for API-only backends
- **CORS:** Configured for frontend origins
- **Rate Limiting:** Implemented in Node.js middleware
- **Input Validation:** Joi schemas for all endpoints

### Database Security
- **Tenant Isolation:** All queries scoped by `company_id`/`tenant_id`
- **SQL Injection Protection:** Parameterized queries only
- **Connection Pooling:** Managed by Spring Boot / Node.js drivers

## Role-Based Access Control (RBAC)

### Current Roles
- `admin` → Full system access
- `manager` → Project and team management
- `worker` → Task execution and time tracking
- `client` → Read-only project visibility

### Authorization Patterns

**Node.js:**
```javascript
// Role-based middleware
router.get('/admin-only', authenticate, authorize(['admin']), handler);

// Company access required
router.get('/projects', authenticate, requireCompanyAccess, handler);
```

**Java:**
```java
// Spring Security authorities from JWT role claim
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<User>> getAllUsers() { ... }

// Tenant-aware service access
public List<Project> getUserProjects() {
    Long tenantId = requireTenantId();
    return projectRepository.findByTenantIdAndOwnerId(tenantId, getCurrentUserId());
}
```

## Development Setup

### Quick Start
```bash
# 1. Set environment variables
export JWT_SECRET="your-256-bit-secret-key-here"

# 2. Start backends
cd backend && npm run dev          # Node.js on :4000
cd backend/java && mvn spring-boot:run  # Java on :4001

# 3. Start frontend with backend integration
echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local
npm run dev                        # Frontend on :5173
```

### Docker Compose Setup
```bash
# Set shared JWT secret
export JWT_SECRET="$(openssl rand -base64 32)"

# Start all services
docker-compose -f docker-compose.dual.yml up --build

# Access via Nginx reverse proxy
open http://localhost  # Frontend
curl http://localhost/api/health  # API health check
```

## Security Best Practices

### Production Deployment
1. **JWT Secret Management**
   - Use environment variables, never commit secrets
   - Minimum 256-bit entropy: `openssl rand -base64 32`
   - Rotate periodically (requires app restart)

2. **HTTPS Enforcement**
   - Always use TLS in production
   - Secure cookie flags for session tokens
   - HSTS headers recommended

3. **Database Security**
   - Connection encryption (SSL/TLS)
   - Principle of least privilege for DB users
   - Regular security updates

4. **Monitoring & Logging**
   - Failed authentication attempts
   - Tenant isolation violations
   - Token expiration/refresh patterns

### Key Rotation Strategy
For production key rotation:
1. Deploy new secret as `JWT_SECRET_NEW`
2. Update token issuer to sign with new key
3. Update verifiers to accept both old and new keys
4. Wait for old tokens to expire (24h)
5. Remove old key support

## Troubleshooting

### Common Issues

**"Invalid or expired token"**
- Check JWT secret consistency between Node.js and Java
- Verify token hasn't expired (24h default)
- Ensure issuer/audience claims match expectations

**"Tenant context required"**
- User missing `company_id` in database
- JWT missing `companyId`/`tenantId` claim
- TenantFilter not properly configured

**Cross-tenant data access**
- Review repository queries for tenant scoping
- Check TenantContext ThreadLocal population
- Verify middleware order (auth → tenant → business logic)

### Debug Commands
```bash
# Decode JWT token (requires jq)
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq .

# Test authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/auth/validate
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4001/api/enhanced/health

# Check tenant isolation
curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Tenant-ID: different-tenant" http://localhost:4001/api/enhanced/projects
```

For additional security questions or implementation details, refer to the main [README.md](./README.md) or the [DUAL-BACKEND-IMPLEMENTATION.md](./DUAL-BACKEND-IMPLEMENTATION.md) architecture guide.