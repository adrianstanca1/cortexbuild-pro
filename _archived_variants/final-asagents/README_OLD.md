<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ASAgents Construction Management Platform

🚀 **Production-Ready** | ⚡ **High Performance** | 🔒 **Enterprise Security** | 🌍 **Multi-Tenant**

A full-stack construction management platform built with React 18 + TypeScript frontend, Node.js/Express backend, MySQL database, and advanced AI integration featuring Google Gemini API.

## 📊 Performance Highlights

- **93% faster loading** with advanced code splitting and lazy loading
- **17 optimized chunks** for superior caching and performance  
- **Core Web Vitals monitoring** built-in for production insights
- **Memory leak detection** and automatic cleanup
- **Offline-first architecture** with automatic fallback modes

## 🏗️ Architecture Overview

<<<<<<< HEAD
### Full-Stack Enterprise Architecture
- **Frontend**: React 18 + TypeScript with Vite build system (5173) → proxies to backend API (4000)
- **Backend**: Node.js + Express with TypeScript using 5-manager enterprise pattern
- **Database**: MySQL with migration system and multi-tenant schema isolation
- **AI Integration**: Google Gemini API with construction-specific domain knowledge
- **Authentication**: JWT-based with refresh tokens, OAuth (GitHub/Google), role-based access
- **Real-time**: WebSocket integration for live dashboard updates and notifications
- **Security**: AES-256-GCM encryption, OWASP headers, rate limiting, input validation
=======
1. Install dependencies:
   `npm install`
<<<<<<< HEAD
<<<<<<< HEAD
2. Copy `.env.example` to `.env.local` and set `VITE_GEMINI_API_KEY` to your Gemini API key
3. Run the app:
   `npm run dev`
>>>>>>> df64595 (Log sixth autonomous deployment run)

### Performance Features
- **Advanced Lazy Loading**: All major components load on-demand
- **Code Splitting**: Vendor libraries, AI services, and tools isolated into separate chunks
- **Performance Monitoring**: Real-time Core Web Vitals tracking with automated alerts
- **Bundle Optimization**: Main bundle reduced from 335kB to 24kB (93% improvement)
- **Caching Strategy**: Sophisticated chunk organization for optimal browser caching

View the hosted experience: https://ai.studio/apps/drive/1bxBJgk2nuKF5tvtdT-YfJQL4PdtvzUvq

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, MySQL 8.0+ (for full-stack mode)

### Frontend-Only Mode (Recommended for Development)
## 🛠️ Development

### Project Structure
```
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Dashboard views
│   ├── layout/             # Layout and navigation
│   ├── tools/              # Construction tools
│   ├── ui/                 # Reusable UI components
│   └── views/              # Feature-specific views
├── contexts/               # React contexts (Auth, etc.)
├── services/               # API clients and services
│   ├── authClient.ts       # Production authentication
│   ├── mockApi.ts          # Development/offline API
│   ├── backendApiService.ts # Backend integration
│   └── validationService.ts # Security validation
├── server/                 # Express backend
│   ├── src/managers/       # Enterprise manager pattern
│   ├── src/routes/         # API endpoints
│   ├── migrations/         # Database migrations
│   └── tests/              # Backend tests
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

### Development Commands
```bash
# Development
npm run dev              # Start dev server with hot reload
npm run dev:full-stack   # Start both frontend and backend
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # Run test suite
npm run test:coverage    # Run tests with coverage

# Backend
cd server && npm run dev        # Start backend API
cd server && npm run migrate    # Run database migrations  
cd server && npm run test       # Backend tests
cd server && npm run typecheck  # TypeScript validation

# Quality & Performance
npm run lint             # ESLint code analysis
npm run lint:fix         # Auto-fix linting issues
npm run typecheck        # TypeScript validation
npm run performance      # Performance analysis
npm run bundle-analyzer  # Bundle size analysis

# Deployment
npm run build:production  # Optimized production build
npm run deploy:vercel     # Deploy to Vercel
npm run deploy:ionos      # Deploy to IONOS
```

<<<<<<< HEAD
### Architecture Patterns

**Enterprise Manager Pattern (Backend)**
```typescript
// 5-manager architecture in server/src/managers/
import { SecurityManager } from '../managers/SecurityManager.js';
import { APIManager } from '../managers/APIManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { DatabaseManager } from '../managers/DatabaseManager.js';
import { TenantManager } from '../managers/TenantManager.js';
```

**Dual Data Layer (Frontend)**
```typescript
// Production: Backend API integration
import { backendApiService } from '../services/backendApiService';

// Development: Offline mock API  
import { api } from '../services/mockApi';

// Automatic fallback if backend unavailable
const result = await backendApiService.createProject(data)
  .catch(() => api.createProject(data)); // Falls back to mock
```

## 🔧 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**Performance Issues**
```bash
# Analyze bundle size
npm run build
npm run bundle-analyzer

# Check for memory leaks
npm run dev
# Open browser dev tools → Performance tab → Record
```

**Backend Connection Issues**
```bash
# Check backend is running
curl http://localhost:4000/health

# Verify environment variables
cd server && node -e "console.log(process.env.DB_HOST)"

# Test database connection
cd server && npm run test:db
```

**Authentication Problems**
```bash
# Clear browser storage
localStorage.clear();
sessionStorage.clear();

# Check OAuth configuration
console.log(window.location.href); // Should contain auth callback
```

### Development Tips

**Performance Optimization**
- Use React DevTools Profiler to identify slow components
- Monitor Core Web Vitals in development console  
- Use `PerformanceMonitor` component wrapper for detailed metrics
- Check bundle size with `npm run bundle-analyzer`

**Security Best Practices**
- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Validate all user inputs with `validationService.ts`
- Test authentication flows in incognito/private browsing

**Deployment Verification**
```bash
# Test production build locally
npm run build && npm run preview

# Verify environment variables are set
vercel env ls

# Check deployment logs
vercel logs [deployment-url]
```

## 📚 Additional Resources

- **[Architecture Guide](/.github/copilot-instructions.md)** - Detailed technical architecture
- **[Deployment Guide](DEPLOYMENT.md)** - Complete deployment instructions
- **[Security Guide](SECURITY.md)** - Security implementation details
- **[API Documentation](docs/api/)** - Backend API reference
- **[Performance Guide](docs/performance.md)** - Optimization strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Built with ❤️ for the construction industry**

🚀 Ready for production • ⚡ Optimized for performance • 🔒 Secured by design````
Opens at `http://localhost:5173` with encrypted mock API and offline capabilities.

### Full-Stack Mode (Production-like)
```bash
# Terminal 1 - Backend API Server
cd server
npm install
cp .env.example .env
# Configure MySQL credentials and JWT secrets in server/.env
npm run migrate  # Setup database schema
npm run dev      # Starts API at localhost:4000

# Terminal 2 - Frontend with Backend Integration  
cp .env.example .env.local
echo "VITE_API_BASE_URL=http://localhost:4000" >> .env.local
echo "VITE_GEMINI_API_KEY=your_gemini_key_here" >> .env.local
npm run dev      # Starts frontend at localhost:5173 with proxy to :4000/api
```

### Performance Development Mode
```bash
# Build and preview optimized production build locally
npm run build
npm run preview  # Test performance optimizations
```

## 🔧 Environment Configuration

### Frontend Environment Variables (.env.local)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | ✅ Yes | Client-exposed Gemini key for AI features |
| `VITE_API_BASE_URL` | ⚪ Optional | Backend API endpoint (defaults to mock API) |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | ⚪ Optional | Enable performance monitoring (default: development only) |

### Backend Environment Variables (server/.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | ✅ Yes | MySQL database host |
| `DB_PORT` | ✅ Yes | MySQL database port (default: 3306) |
| `DB_USER` | ✅ Yes | MySQL database username |
| `DB_PASSWORD` | ✅ Yes | MySQL database password |
| `DB_NAME` | ✅ Yes | MySQL database name |
| `JWT_ACCESS_SECRET` | ✅ Yes | JWT access token signing secret (256-bit) |
| `JWT_REFRESH_SECRET` | ✅ Yes | JWT refresh token signing secret (256-bit) |
| `GEMINI_API_KEY` | ✅ Yes | Server-side Gemini API key |
| `UPLOAD_ROOT` | ⚪ Optional | File upload directory (default: ./uploads) |
| `RATE_LIMIT_WINDOW_MS` | ⚪ Optional | Rate limit window in milliseconds (default: 900000) |
| `RATE_LIMIT_MAX` | ⚪ Optional | Max requests per window (default: 100) |
| `ENCRYPTION_KEY` | ✅ Yes | AES-256-GCM encryption key for sensitive data |
| `CORS_ORIGINS` | ⚪ Optional | Allowed CORS origins (default: localhost:5173) |

### Production Deployment Variables
| Variable | Platform | Description |
|----------|----------|-------------|
| `VERCEL_TOKEN` | Vercel | Deployment token for GitHub Actions |
| `VERCEL_ORG_ID` | Vercel | Organization ID for deployments |
| `VERCEL_PROJECT_ID` | Vercel | Project ID for deployments |

## 🚀 Production Deployment

### Vercel Deployment (Recommended)
```bash
# Automated deployment via GitHub Actions
git push origin main  # Deploys to production
git push origin feature-branch  # Creates preview deployment
```

**Manual Vercel Setup:**
1. Create new Vercel project and link this repository
2. Configure environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY` (required)
   - `GEMINI_API_KEY` (optional, for build-time features)
3. Deploy automatically triggers on push to main
4. Preview deployments created for all pull requests

### Alternative Deployment Platforms

**IONOS Hosting:**
```bash
npm run build:production
npm run deploy:ionos  # Uses SFTP deployment script
```

**GitHub Pages:**
```bash
npm run deploy:github-pages  # Static export to gh-pages branch
```

**Docker Deployment:**
```bash
docker build -t asagents-platform .
docker run -p 3000:3000 asagents-platform
```

### Backend Deployment

**Production Backend Setup:**
1. Deploy MySQL 8.0+ database with multi-tenant schema
2. Configure environment variables on your hosting platform
3. Run database migrations: `npm run migrate`  
4. Deploy Express server to cloud provider (Railway, Render, Digital Ocean)
5. Update frontend `VITE_API_BASE_URL` to point to deployed backend

**Database Migration:**
```bash
cd server
npm run migrate           # Apply schema migrations
npm run seed:production   # Optional: Add seed data
```

### Performance & Monitoring

The platform includes built-in performance monitoring:
- **Core Web Vitals tracking** in production
- **Performance budgets** enforced during builds
- **Bundle analysis** with detailed chunk reports
- **Memory leak detection** and automated cleanup
- **Error boundary recovery** with automatic retries

Monitor these metrics in production using the built-in performance dashboard.

## ✨ Key Features

### 🏗️ Construction Management
- **Multi-tenant architecture** with company isolation
- **Project lifecycle management** from planning to completion
- **Task management** with Kanban boards and dependencies
- **Resource scheduling** and equipment tracking
- **Financial tracking** with budgets, expenses, and invoicing
- **Safety management** with incident reporting and compliance
- **Team collaboration** with real-time updates and notifications

### 🤖 AI-Powered Features
- **AI Site Inspector** for automated quality assessments
- **Cost Estimation** with ML-powered predictions
- **Risk Analysis** with predictive modeling
- **Daily Summary Generation** with intelligent insights
- **Bid Package Generation** with AI optimization
- **Document Analysis** and automated data extraction

### 🔒 Enterprise Security
- **Multi-factor authentication** (OAuth + JWT)
- **Role-based access control** with granular permissions
- **AES-256-GCM encryption** for sensitive data
- **OWASP security headers** and CSP policies
- **Rate limiting** and DDoS protection
- **Audit logging** with compliance tracking
- **Data isolation** per tenant with secure boundaries

### ⚡ Performance & Reliability
- **93% faster loading** with advanced optimizations
- **Offline-first architecture** with automatic fallbacks
- **Real-time performance monitoring** with alerts
- **Memory leak detection** and automated cleanup
- **Error boundary recovery** with intelligent retries
- **Progressive loading** with skeleton UIs
- **Optimistic updates** for better UX

## 🔄 CI/CD & Automation

### Automated Deployment Pipeline
- **GitHub Actions CI/CD** with comprehensive testing
- **Automated Vercel deployments** for main and feature branches
- **Preview deployments** for all pull requests with QA URLs
- **Performance budgets** enforced during builds
- **Security scanning** with dependency vulnerability checks
- **Code quality gates** with ESLint and TypeScript validation

### Available Workflows
- [`CI Workflow`](.github/workflows/ci.yml) - Tests and builds on every PR
- [`Vercel Deploy`](.github/workflows/vercel-deploy.yml) - Production and preview deployments  
- [`Security Scan`](.github/workflows/security.yml) - Dependency and code security analysis
- [`Performance Tests`](.github/workflows/performance.yml) - Lighthouse and bundle size checks

### Operations & Monitoring
- **Health checks** with automated alerts and recovery
- **Performance monitoring** with Core Web Vitals tracking
- **Error tracking** with automated issue creation
- **Uptime monitoring** with synthetic transaction tests
- **Resource monitoring** with memory and CPU alerts
- **Deployment rollback** capabilities with one-click recovery

### Required Secrets
Set these in your GitHub repository secrets:
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID  
- `VERCEL_PROJECT_ID` - Vercel project ID
- `VITE_GEMINI_API_KEY` - Gemini AI API key for production
- `GEMINI_API_KEY` - Server-side Gemini key for builds
=======
After the first build completes, visit the generated Vercel URL to confirm the
application loads and AI powered features work with your configured API key.
=======
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Optional) Point authentication at a deployed backend by setting `VITE_API_BASE_URL` in `.env.local`. When omitted the app runs in secure local demo mode and persists accounts in browser storage.
4. Run the app:
   `npm run dev`
=======
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Optional) Point authentication at a deployed backend by setting `VITE_API_BASE_URL` in `.env.local`. When omitted the app runs in secure local demo mode and persists accounts in browser storage.
4. Run the app:
   `npm run dev`
>>>>>>> e7ec06c (Log sixth autonomous deployment run)

### Configure authentication backend

By default the registration and login flows use the encrypted in-browser mock API. Provide a `VITE_API_BASE_URL` in `.env.local` to connect to a real authentication service. If that service becomes unreachable you can allow automatic fallback to the mock implementation by exposing `window.__ASAGENTS_API_BASE_URL__` at runtime or by calling `configureAuthClient({ baseUrl, allowMockFallback: true })` in your initialization code.

## Deployment automation

This project ships with a fully automated CI/CD pipeline backed by GitHub Actions and Vercel.

- Pull requests run tests and builds via the [`CI` workflow](.github/workflows/ci.yml).
- Previews and production releases are handled by the [`Deploy to Vercel` workflow](.github/workflows/vercel-deploy.yml). Pushes to `main` promote the build to the production environment; pull requests publish preview URLs for QA.
- The legacy GitHub Pages workflow remains available in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) for static exports if you need an alternative host.

### Operations playbooks & secrets

- **Runbooks & responsibilities**: [docs/deployment-plan.md](docs/deployment-plan.md) outlines the automation flow, operational checklists, and ownership model for engineers, reviewers, QA, and on-call.
- **Vercel-specific setup**: follow [docs/vercel-deployment.md](docs/vercel-deployment.md) to connect the repository to Vercel and provision the required secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
- **Gemini credentials**: store the shared Gemini credential as `GEMINI_API_KEY` in repository secrets and mirror it to `VITE_GEMINI_API_KEY` (or provide a separate client-safe key). Developers keep personal keys in `.env.local` for local runs.
- **Monitoring**: follow the plan's observability section to wire synthetic uptime checks and error tracking so deployments stay production ready.
<<<<<<< HEAD
>>>>>>> e7ec06c (Log sixth autonomous deployment run)
>>>>>>> df64595 (Log sixth autonomous deployment run)
=======
>>>>>>> e7ec06c (Log sixth autonomous deployment run)
