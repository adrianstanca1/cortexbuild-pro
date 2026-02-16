# CortexBuild Pro

Construction management platform v2.3.1 — [cortexbuildpro.com](https://www.cortexbuildpro.com)

## Architecture

| Component | Stack | Directory |
|-----------|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS | `/src/` |
| Next.js App | Next.js 15 + Prisma + NextAuth | `/nextjs_space/` |
| Backend API | Express 5 + GraphQL + WebSocket | `/server/` |
| Database | PostgreSQL 15 | Docker / external |
| Deployment | Docker Compose + Nginx + Certbot | `/deployment/` |

## Quick Start (Development)

```bash
# Prerequisites: Node.js 20+
nvm use           # uses .nvmrc

# Frontend (Vite)
npm install
npm run dev

# Next.js app
cd nextjs_space && npm install
npx prisma generate
npm run dev

# Backend
cd server && npm install
npm run dev

# All services concurrently
npm run dev:all
```

## Production Deployment (VPS)

```bash
# Option 1: Quick start on fresh VPS
cd deployment
./quick-start.sh

# Option 2: Deploy from local machine to VPS
cd deployment
./deploy-to-vps.sh --host YOUR_VPS_IP --domain cortexbuildpro.com --ssl
# Optional: use password auth when no SSH key is available
./deploy-to-vps.sh --host YOUR_VPS_IP --user root --password 'your-password'

# Option 3: Docker Compose directly on server
cd deployment
cp .env.example .env
# Edit .env with your credentials (see below)
docker compose up -d
```

See [`deployment/README.md`](deployment/README.md) for full deployment guide.

## Environment Setup

```bash
# Copy the template
cp .env.template .env
chmod 600 .env

# Generate required secrets
openssl rand -base64 32    # NEXTAUTH_SECRET
openssl rand -base64 24    # POSTGRES_PASSWORD
openssl rand -hex 32       # ENCRYPTION_KEY
```

Required variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

See [`.env.template`](.env.template) for complete reference with documentation.

## Build

```bash
npm run build:frontend     # Vite frontend
npm run build:backend      # Express server
npm run build:prod         # Both
```

## Key Documentation

- [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) — API reference (50+ endpoints)
- [`AUTHENTICATION_FLOW.md`](AUTHENTICATION_FLOW.md) — Auth system design
- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) — Deployment options
- [`SECURITY_SUMMARY.md`](SECURITY_SUMMARY.md) — Security posture
- [`OAUTH_SENDGRID_SETUP.md`](OAUTH_SENDGRID_SETUP.md) — OAuth + email setup
