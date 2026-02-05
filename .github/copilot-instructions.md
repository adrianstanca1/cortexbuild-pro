# GitHub Copilot Instructions for CortexBuild Pro

## Project Overview
CortexBuild Pro is a comprehensive multi-tenant construction management platform built with Next.js 16, React 18, PostgreSQL, and Socket.IO for real-time collaboration.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 18.2, Tailwind CSS, Radix UI, shadcn/ui
- **State**: React Query, Zustand
- **Real-time**: Socket.IO client

### Backend
- **Runtime**: Node.js 20
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (credentials & Google OAuth)
- **Storage**: AWS S3
- **Real-time**: Socket.IO server

## Code Standards and Conventions

### TypeScript
- Use TypeScript for all new code
- Prefer type safety over `any` types
- Define interfaces for data structures
- Use proper typing for Prisma models

### React Components
- Use functional components with hooks
- Follow React Server Components pattern for Next.js 16
- Keep components small and focused
- Use proper prop typing with TypeScript

### File Structure
```
nextjs_space/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/            # Auth-related pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main application pages
│   └── admin/             # Admin console
├── components/            # Reusable React components
├── lib/                   # Utilities and configurations
├── prisma/               # Database schema and migrations
├── scripts/              # Utility scripts
└── server/               # WebSocket server implementation
```

### Naming Conventions
- Components: PascalCase (e.g., `ProjectCard.tsx`)
- Files: kebab-case for utilities (e.g., `auth-utils.ts`)
- API routes: lowercase with hyphens (e.g., `api/projects/[id]/route.ts`)
- Database models: PascalCase in Prisma schema

### API Routes
- Use Next.js 16 App Router API route handlers
- Implement proper error handling with try-catch
- Return consistent response formats
- Validate input data before processing
- Use middleware for authentication checks

### Database Operations
- Always use Prisma ORM for database queries
- Use transactions for multiple related operations
- Implement proper error handling
- Use connection pooling settings already configured
- Follow the existing schema patterns for multi-tenancy

### Authentication
- Use NextAuth.js for all authentication flows
- Verify user sessions in API routes
- Implement role-based access control (RBAC)
- Check organization membership for multi-tenant operations

### Real-time Features
- Use Socket.IO for real-time updates
- Authenticate WebSocket connections with JWT
- Emit events for task updates, messages, and notifications
- Handle disconnections gracefully

### Error Handling
- Always wrap async operations in try-catch
- Return appropriate HTTP status codes
- Log errors for debugging
- Provide user-friendly error messages

### Environment Variables
- Never commit `.env` files
- Use environment variables for all sensitive data
- Document required variables in `.env.example`
- Access via `process.env.VARIABLE_NAME`

## Important Features and Modules

### Core Modules
1. **Projects** - Project lifecycle management
2. **Tasks** - Kanban boards, Gantt charts, task lists
3. **RFIs** - Request for Information tracking
4. **Submittals** - Document submission workflows
5. **Time Tracking** - Labor hours tracking
6. **Budget Management** - Cost tracking and analysis
7. **Safety** - Incident reporting and metrics
8. **Daily Reports** - Site diary and progress logging
9. **Documents** - File management with S3
10. **Team Management** - Role-based access control

### Multi-tenancy
- All data is scoped to organizations
- Users can belong to multiple organizations
- Always filter queries by organization ID
- Use the `organizationId` field consistently

### Real-time Collaboration
- Task updates broadcast to relevant users
- Project chat with live messages
- User presence tracking
- Notification system

## Development Guidelines

### When Adding New Features
1. Check existing patterns in similar modules
2. Update Prisma schema if database changes needed
3. Run `npx prisma generate` after schema changes
4. Create API routes following existing patterns
5. Implement proper authentication and authorization
6. Add real-time updates if applicable
7. Update TypeScript types

### When Fixing Bugs
1. Identify the root cause before making changes
2. Check for similar issues in related code
3. Test the fix thoroughly
4. Consider edge cases
5. Don't break existing functionality

### When Refactoring
1. Make minimal changes
2. Ensure tests pass (if they exist)
3. Keep the same functionality
4. Update documentation if needed

## Testing

### Development
```bash
cd nextjs_space
npm run dev
```

### Production Build
```bash
cd nextjs_space
npm run build
npm start
```

### Docker Deployment
```bash
cd deployment
docker-compose up -d
```

## Common Commands

### Prisma
```bash
npx prisma generate          # Generate Prisma Client
npx prisma db push           # Push schema to database
npx prisma migrate deploy    # Run migrations
npx prisma studio            # Open database GUI
```

### Development
```bash
npm install --legacy-peer-deps  # Install dependencies
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run lint                    # Run linter
```

### Diagnostics
```bash
npx tsx scripts/system-diagnostics.ts  # Run diagnostics
npx tsx scripts/health-check.ts        # Check system health
./verify-config.sh                     # Verify configuration
```

## Deployment

### Prerequisites
- PostgreSQL database accessible
- AWS S3 credentials configured
- Environment variables set
- Docker and Docker Compose installed

### Deployment Process
1. Update `.env` in deployment directory
2. Run `docker-compose -f deployment/docker-compose.yml up -d`
3. Run migrations: `docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"`
4. Optionally seed data: `docker-compose exec app sh -c "cd /app && npx prisma db seed"`

### Monitoring
```bash
docker-compose logs -f           # View logs
docker-compose ps                # Check services
docker-compose restart           # Restart services
```

## Security Considerations
- Never expose API keys or secrets
- Use environment variables for sensitive data
- Implement proper authentication on all protected routes
- Validate all user input
- Use Prisma to prevent SQL injection
- Enable HTTPS in production
- Implement rate limiting for API endpoints

## Performance Optimization
- Use React Server Components where possible
- Implement proper caching strategies
- Optimize database queries
- Use connection pooling for database
- Minimize bundle sizes
- Use Next.js Image component for images

## Documentation
- Keep README.md updated
- Document API endpoints
- Comment complex logic
- Update changelog for major changes
- Maintain deployment guides

## Support Resources
- **API Setup**: `API_SETUP_GUIDE.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **Build Status**: `BUILD_STATUS.md`
- **Configuration**: `CONFIGURATION_CHECKLIST.md`
- **Performance**: `PERFORMANCE_OPTIMIZATIONS.md`

## When in Doubt
1. Check existing code for similar patterns
2. Review documentation in project root
3. Test changes in development environment
4. Follow the principle of minimal changes
5. Maintain consistency with existing codebase
