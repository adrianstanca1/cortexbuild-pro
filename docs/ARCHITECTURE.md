# 🏗️ CortexBuild Pro - Technical Architecture & Roadmap

**Version:** 2.0.0 | **Last Updated:** 2026-01-17 | **Status:** Production Live

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Feature Inventory](#feature-inventory)
4. [Development Roadmap](#development-roadmap)
5. [Security & Compliance](#security--compliance)

---

## Technology Stack

### Frontend

- React 19.2.0 + TypeScript + Vite 6.2.0
- TailwindCSS 4.1.14 for styling
- Tanstack Query 5.90.2 for state management
- Socket.io Client 4.8.3 for real-time features
- Leaflet 1.9.4 for maps, Recharts 3.6.0 for analytics

### Backend

- Node.js 22.x on CloudLinux 8 (Hostinger VPS)
- Express 5.1.0 REST API framework
- Socket.io 4.7.4 for real-time collaboration
- MySQL (production) / SQLite (development)
- JWT authentication with bcryptjs

### Infrastructure

- **Hosting:** Hostinger VPS (72.62.132.43)
- **Frontend:** Static files via Nginx
- **Backend:** PM2 process manager
- **Database:** Remote Hostinger MySQL
- **Monitoring:** Sentry 10.32.1
- **Email:** SendGrid 8.1.6
- **AI:** Google Gemini 3 Pro

---

## Architecture Overview

### Multi-Tenancy Pattern

**Row-level isolation** with `companyId` on all tables:

- Companies table serves as tenant registry
- Middleware (`contextMiddleware` + `tenantRoutingMiddleware`) enforces isolation
- Database queries filter by `companyId`
- Storage files organized by tenant with signed URLs

### Authentication Flow

```
1. User Login → JWT Token (userId, companyId, role)
2. authenticateToken middleware → Validates JWT, sets req.userId
3. contextMiddleware → Resolves tenant context
4. tenantRoutingMiddleware → Validates tenant scope
5. Controller → Executes business logic with tenant filtering
```

### Real-time Architecture

**Socket.io with tenant-scoped rooms:**

- Connections authenticated via JWT in handshake
- Rooms: `company:{companyId}`, `project:{projectId}`
- Server-side authorization for subscriptions and publishing
- Events: `entity_create`, `entity_update`, `entity_delete`, `presence_update`

---

## Feature Inventory

### ✅ Completed (Production)

**Core Platform:**

- Multi-tenant company management
- User authentication (login, register, password reset)
- RBAC with custom roles and permissions
- Team member invitations and onboarding
- Trial system (30-day automated trials)
- Stripe subscription management

**Projects & Tasks:**

- Project CRUD with locations, phases, zones
- Task management with dependencies
- Gantt chart visualization
- Team assignment and availability
- Document upload and management
- Client portal (shared links)

**Construction Features:**

- Daily logs (weather, manpower, notes)
- RFIs (create, list, workflow)
- Safety incidents and hazards
- Equipment tracking
- Inspections and quality issues
- Change orders (basic)
- Submittals (basic)

**AI Features:**

- AI chat assistant (Gemini integration)
- Project launchpad (site analysis)
- Predictive analytics (project delays)

**Platform Admin:**

- SuperAdmin dashboard
- Company management
- User impersonation
- System settings and feature flags
- Audit logs

### 🚧 In Progress

- Enhanced Submittals workflow (approval chains, versioning)
- Change Orders workflow (PCO → CO transitions)
- Quality & Safety NCRs
- Meeting minutes and action items
- AI tenant-scoped RAG retrieval
- Integration tests for tenant isolation

---

## Development Roadmap

### Phase 2: Construction Feature Completion (Week 2)

**Submittals Module:**

- Approval workflow: draft → submitted → reviewed → approved/rejected
- Revision tracking with version history
- Distribution list management
- Real-time notifications

**Change Orders Module:**

- PCO (Potential Change Order) management
- CO approval workflow with budget impact
- Cost breakdown with line items
- Schedule impact tracking

**Quality Module:**

- Inspection scheduler with checklists
- Punch list Kanban board
- NCR workflow with corrective actions
- Photo upload and annotations

### Phase 3: AI Tenant Isolation (Week 3)

**Infrastructure:**

- Per-tenant document ingestion pipeline
- Namespace-isolated embedding storage
- Permission-aware RAG retrieval
- Comprehensive audit logging

**Applications:**

- RFI draft assistant with spec citations
- Submittal review assistant (compliance checks)
- Change order impact summarization
- Daily report generation from logs
- Safety incident triage

### Phase 4: Real-time Upgrades (Week 4)

**Event Standardization:**

- Event naming convention: `domain.entity.action`
- Zod schemas for event payloads
- Idempotency with dedupe keys

**Resilience:**

- Exponential backoff for reconnections
- Server state sync on reconnect
- Message persistence (optional)
- Typing indicators and presence tracking

### Phase 5: Observability & Testing (Week 5)

**Monitoring:**

- Trace IDs in all logs
- Structured logging (JSON format)
- Metrics dashboard (latency, errors)
- Sentry context enrichment

**Testing:**

- Unit tests for tenant isolation
- Integration tests for workflows
- E2E tests (Playwright)
- Load tests for WebSocket infrastructure

### Phase 6: Cleanup & Documentation (Week 6)

- Remove dead code and duplicates
- Standardize error handling
- Update API documentation
- Create developer onboarding guide

---

## Security & Compliance

### Tenant Isolation

**Database Level:**

- All tables include `companyId` column
- Foreign keys enforce referential integrity
- Queries always filter by tenant: `WHERE companyId = ?`

**API Level:**

- `contextMiddleware` resolves tenant from JWT
- `tenantRoutingMiddleware` validates tenant scope
- Controllers validate `record.companyId === req.tenantId`

**File Storage:**

- HMAC-signed URLs with expiration
- Tenant ownership validation before serving
- Document metadata includes tenantId reference

**Real-time:**

- Authenticated WebSocket connections
- Tenant-scoped rooms: `company:{companyId}:*`
- Server-side subscription authorization

### Authentication & Authorization

**JWT Tokens:**

- Access tokens (15min expiry)
- Refresh tokens (7 days)
- Claims: userId, companyId, role, permissions

**RBAC:**

- Roles: SUPERADMIN, ADMIN, PROJECT_MANAGER, USER, OPERATIVE
- Permissions stored per role
- Membership-based access control

### Monitoring

**Sentry Integration:**

- Error tracking for frontend and backend
- Performance monitoring
- User context enrichment

**Audit Logs:**

- All critical operations logged
- User actions tracked
- Cross-tenant access audited

---

## Recent Changes

### Phase 1: Tenant Isolation Hardening (2026-01-17) ✅

**Completed:**

- Created storage validation middleware (`server/middleware/storageValidation.ts`)
- HMAC signature verification for file access
- Tenant ownership validation
- Document access controls
- Comprehensive repository audit

**Verified:**

- Existing middleware architecture is robust
- Controllers properly scope by `companyId`
- WebSocket connections properly authenticated

**Security Improvements:**

- File access now validates tenant ownership
- Signed URLs require HMAC signatures
- Cross-tenant file access blocked

---

## API Reference

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint reference.

**Base URL:** `https://api.cortexbuildpro.com/api`

**Key Endpoints:**

- `POST /auth/login` - Authenticate
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /rfis` - List RFIs
- `POST /daily-logs` - Create daily log
- `GET /analytics` - Platform analytics

---

## Contributing

### Development Setup

```bash
# Install dependencies
npm install
cd server && npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run development servers
npm run dev:all
```

### Code Standards

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with React hooks rules
- **Formatting:** Prettier
- **Testing:** Jest (unit) + Playwright (E2E)

### Git Workflow

- `main` - Production-ready code
- `develop` - Integration branch
- `feat/*` - Feature branches
- `fix/*` - Bug fix branches

---

## Support & Documentation

**Guides:**

- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Member Management](./docs/MEMBER_MANAGEMENT.md)
- [Tenant Management](./docs/TENANT_MANAGEMENT.md)
- [Security Decisions](./docs/SECURITY_DECISIONS.md)

**Production Environment:**

- Frontend: <https://cortexbuildpro.com>
- API: <https://api.cortexbuildpro.com>
- Health Check: <https://api.cortexbuildpro.com/api/health>

---

**Last Updated:** January 17, 2026  
**Maintained By:** CortexBuild Team
