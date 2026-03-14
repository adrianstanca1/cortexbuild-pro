# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Test, and Development Commands

**Development:**
- `yarn dev` - Start development server with hot reload (uses `tsx watch server.ts`)
- `yarn build` - Build for production (Next.js build)
- `yarn start` - Start production server (`NODE_ENV=production tsx server.ts`)
- `yarn lint` - Run ESLint

**Database (Prisma):**
- `yarn prisma generate` - Generate Prisma client after schema changes
- `yarn prisma db push` - Push schema changes to database
- `yarn prisma db seed` - Seed database with initial data
- `yarn prisma migrate dev` - Create and apply migrations in development

**Testing:**
- Tests use Vitest with `@testing-library/react`
- Run tests via `vitest` (configured in `vitest.config.ts`)

**Environment Setup:**
- Copy `.env.example` to `.env` and configure database credentials
- Supports both SQLite (development) and PostgreSQL (production)

## Architecture Overview

**CortexBuild Pro** is a multi-tenant construction management SaaS platform built with Next.js 14.

### Core Architecture

**Multi-Tenancy:**
- Organizations are the top-level tenant boundary (`Organization` model in Prisma)
- Each organization has entitlements (JSON) defining enabled modules and limits
- Users belong to organizations via `OrganizationMember` with role-based access
- All data queries must filter by `organizationId` for security

**Authentication Flow:**
- NextAuth.js v4 with custom `auth-options.ts` in `lib/`
- JWT strategy with custom session callback for role injection
- Supports credentials provider (email/password) with bcrypt
- Multi-step company registration flow in `(auth)/register/`

**App Router Structure:**
- `(admin)/` - Super admin console (cross-organization)
- `(auth)/` - Authentication pages (login, register, forgot-password)
- `(company)/` - Company-level management (settings, team, billing)
- `(dashboard)/` - Main application modules (projects, tasks, RFIs, etc.)
- `api/` - API routes following RESTful patterns
- Route groups use parentheses for organization without affecting URL

**Backend Services Pattern:**
- `lib/services/` - Core business logic services (project-service.ts, task-service.ts, etc.)
- `lib/service-registry.ts` - Centralized service registration and health checks
- `lib/service-adapters.ts` - Database adapter pattern for data access
- `lib/service-entitlements.ts` - Entitlement checking utilities
- Services handle entitlements, audit logging, and data validation

**Database Layer:**
- Prisma ORM with schema in `prisma/schema.prisma`
- SQLite for local development, PostgreSQL for production
- Key models: Organization, User, Project, Task, RFI, Submittal, DailyReport, SafetyIncident
- JSON fields store flexible data (metadata, entitlements)

**Background Jobs:**
- BullMQ with Redis for job queuing (`lib/queue.ts`)
- Worker process in `worker.ts`
- Used for: email sending, file processing, exports, notifications

**Real-time Updates:**
- Server-Sent Events (SSE) via `lib/realtime.ts`
- Clients subscribe to organization-specific channels
- Used for live updates on tasks, RFIs, and notifications

**File Storage:**
- AWS S3 integration (`lib/s3.ts`, `lib/aws-s3.ts`)
- Presigned URLs for secure uploads/downloads
- File metadata stored in database, files in S3

**API Patterns:**
- Route handlers in `app/api/` with consistent error handling
- `lib/api-utils.ts` provides standardized response helpers
- Middleware for auth, entitlements, rate limiting in `lib/middleware/`
- Validation using Zod schemas in `lib/validations/`

**State Management:**
- React Query (TanStack Query) for server state
- Zustand for client state (selected project, UI state)
- Jotai for atomic state (user preferences)

**UI Architecture:**
- Tailwind CSS with custom theme
- Radix UI primitives via shadcn/ui components in `components/ui/`
- Feature components in `components/dashboard/`
- Recharts for charts and visualizations

**Security:**
- `lib/middleware/auth.ts` - Authentication middleware
- `lib/middleware/entitlements.ts` - Feature access control
- `lib/middleware/security.ts` - CSRF, security headers
- `lib/encryption.ts` - Data encryption utilities
- `lib/audit.ts` - Audit logging for sensitive operations

**Testing:**
- Vitest for unit tests
- Testing Library for React component tests
- Test files in `tests/` directory

### Important Conventions

- All service functions must check entitlements before operations
- Database queries must include `organizationId` filter for tenant isolation
- Use `lib/service-registry.ts` for accessing services (not direct imports)
- API routes should use `withAuth()` and `withEntitlements()` wrappers
- Audit log all create/update/delete operations via `audit.ts`
- Use Zod for all input validation
- Error responses should follow pattern in `lib/api-utils.ts`

### Key Files

- `lib/auth-options.ts` - NextAuth configuration
- `lib/service-registry.ts` - Service registration
- `lib/entitlements.ts` - Entitlement checking
- `prisma/schema.prisma` - Database schema
- `server.ts` - Custom Express server with Socket.io
- `middleware.ts` - Next.js middleware for auth redirects
