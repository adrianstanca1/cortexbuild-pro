# BuildPro Application - Deployment & Architecture Guide

## Quick Start

### Prerequisites
- Node.js 18+ (prefer Node 22.x for production parity)
- npm 10+ or yarn
- Hostinger Node.js App with MySQL configured

### Local Development
```bash
# Install dependencies
npm install
npm install --prefix server

# Copy example env and fill secrets
cp .env.example .env
cp server/.env.hostinger server/.env
# Fill SendGrid, Gemini, JWT_SECRET, FILE_SIGNING_SECRET, VAPID keys

# Start frontend + backend (frontend proxies /api to backend)
npm run dev:all
```
Then visit `http://localhost:5174` (set via `VITE_DEV_PORT`) to hit the SPA; the backend listens at the `DEV_SERVER_PORT` (default `3002`) for `/api/health`.

If those ports conflict locally, override them by editing `.env`/`server/.env` (`VITE_DEV_PORT`, `DEV_SERVER_PORT`) before running `npm run dev:all`.

### Environment Variables (local)
| Key | Purpose |
| --- | --- |
| `VITE_API_URL` | `https://api.cortexbuildpro.com/api` (frontend target in production)
| `VITE_WS_URL` | `wss://api.cortexbuildpro.com/live`
| `JWT_SECRET` | JWT signing secret used by backend
| `FILE_SIGNING_SECRET` | Protects temporary upload URLs
| `SENDGRID_API_KEY` / `EMAIL_FROM` | Transactional emails (invitations, notifications)
| `GEMINI_API_KEY` | Google Gemini AI for document analysis
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push credentials
| `STORAGE_ROOT` | Local path for tenant buckets (default `./storage`)
| `DATABASE_TYPE` | `mysql` (Hostinger) or `sqlite` (local)
| `DB_*` | Hostinger MySQL credentials
```

## Production Deployment (Hostinger)
The Hostinger environment hosts both `https://cortexbuildpro.com` (frontend) and `https://api.cortexbuildpro.com` (backend).

1. **Build & upload backend**:
   ```bash
   cd server
   npm install
   npm run build
   ```
   Upload `dist/`, `package.json`, `package-lock.json`, and `.env` (rename `.env.hostinger` to `.env`) via SFTP or Hostinger Git import.
2. **Create a Node.js application in hPanel** pointing to `./server` with:
   - Build command: `npm install && npm run build`
   - Start command: `node dist/index.js`
   - Node version: 22.x
3. **Add environment variables from `HOSTINGER_ENV_VARS.txt`** (SendGrid, Gemini, VAPID, JWT, STORAGE_ROOT, DB creds).
4. **Upload frontend build**:
   ```bash
   npm run build:frontend:prod
   ```
   Copy `dist/` files into `/domains/cortexbuildpro.com/public_html` and ensure `.htaccess` rewrites forward `/api` to the backend.
5. **Restart backend app** via hPanel or `npm run remote:start` script.

### Authenticating Email via SendGrid

1. In SendGrid, verify `cortexbuildpro.com` under **Settings → Sender Authentication** and copy the DNS records it recommends (typically 3 CNAME entries plus SPF TXT).
2. Set the following environment variables before running the helper:
   ```
   HOSTINGER_API_TOKEN=<your token from Hostinger API>
   HOSTINGER_DNS_DOMAIN=cortexbuildpro.com
   SENDGRID_DNS_RECORDS='[
     {"name":"s1._domainkey","type":"CNAME","content":"s1.domainkey.uXXXX.wl.sendgrid.net"},
     {"name":"s2._domainkey","type":"CNAME","content":"s2.domainkey.uXXXX.wl.sendgrid.net"},
     {"name":"em1234","type":"CNAME","content":"em1234.domainkey.uXXXX.wl.sendgrid.net"}
   ]'
   ```
3. Run `node scripts/sendgrid-dns.js` to upsert the records via Hostinger’s DNS API.
4. Wait for propagation (SendGrid may take a few minutes) and click **Verify** in SendGrid.

You can reuse `SENDGRID_DNS_RECORDS` for different environments by overriding the JSON with the records provided by SendGrid.

### Post-deploy Verification
- `curl https://api.cortexbuildpro.com/api/health` → expect `{ "status": "online", "database": { "status": "connected" } }`.
- `curl https://cortexbuildpro.com` → receives PWA shell.
- Run `npm run verify-all` locally to ensure env/deps/db/storage/SendGrid are healthy before deployment.
- Smoke-test role flows (Superadmin, Company Admin, tenant invite). Ensure JWT tokens persist in `localStorage`.

## Architecture Overview
### Frontend (React 19 + Vite)
- Managed state through `AuthContext`, `ProjectContext`, `ToastContext`.
- File uploads go to `/api/storage/upload/single` and the server stores documents under `storage/company-<companyId>`.
- Socket.IO connects to `wss://api.cortexbuildpro.com/live`, using JWT for auth.
- Multi-tenant roles: Superadmin dashboard (tenant provisioning) and Company Admin workspace.

### Backend (Express + Hostinger MySQL + Local Storage)
- JWT-based auth (`authMiddleware.ts`) enforcing tenant isolation via `companyId` claim.
- Storage service (`server/services/storageService.ts`) creates per-company buckets and enforces quotas.
- SendGrid/Gemini/VAPID integrations powered by environment secrets (no third-party auth dependency).
- Diagnostics scripts (e.g. `verify-all`, `verify-capabilities`, `check-columns.ts`, `debug-triggers.ts`) connect to Hostinger MySQL using `mysql2/promise`.
- Superadmin setup handled via `/api/setup/superadmin` and `setupController.ts`.

### DevOps & Multi-tenant Guarantees
- Superadmin is platform owner, only one user creates new companies, and auto-provisions per-tenant storage buckets.
- Company Admin is owner per tenant; they can invite users, manage storage, set roles, and own documents.
- File buckets live at `storage/company-<companyId>`, with quotas tracked in `company_storage` table.
- Database migrations and seeds live under `server/migrations` and `server/seed.ts`.

## Recent Improvements
- Replaced the external auth provider with JWT + Hostinger MySQL, keeping the stack self-contained.
- Multi-tenant storage now uses local root directories plus audit-friendly records in `company_storage`.
- Added Hostinger-friendly `verify-all`/`verify-capabilities` scripts that check storage paths, MySQL, SendGrid, Gemini, and VAPID.
- Superadmin bootstrapping and invitation flows now rely on local JWT tokens and email invites.
- Added dedicated Hostinger deployment scripts (`deploy-backend-sftp.js`, `deploy-frontend-sftp.js`) and `remote-*` helpers.

## Development Workflow
- `npm run lint` to keep TypeScript/ESLint clean.
- `npm run test` (Vitest) for frontend and backend unit tests.
- `npm run dev:all` to start both Vite and the backend during development.
- `npm run seed:adrian` / `seed:automations` to bootstrap sample data.
- Use `npm run build:frontend:prod` before deploying static assets to Hostinger.
- Use `npm run build:backend` + `deploy:backend` scripts to push backend updates.
