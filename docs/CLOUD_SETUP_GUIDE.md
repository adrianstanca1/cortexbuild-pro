# Hostinger Deployment & Secret Management Guide

This service is hosted entirely on Hostinger:
- **Frontend** served from `https://cortexbuildpro.com` (static Vite build deployed via SFTP)
- **Backend API** served from `https://api.cortexbuildpro.com` (Node.js app behind Hostinger proxy)

## 1. Configure the Hostinger Node.js App (Backend)
Use Hostinger hPanel Node.js Manager to edit the environment variables, or upload `server/.env.hostinger` via SFTP.

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `PORT` | Hostinger proxy port for Express | `3001` |
| `NODE_ENV` | Production flag | `production` |
| `DATABASE_TYPE` | `mysql` for Hostinger MySQL | `mysql` |
| `DB_HOST` | Hostinger MySQL host | `127.0.0.1` |
| `DB_USER` | MySQL user | `u875310796_admin` |
| `DB_PASSWORD` | MySQL password | (provided by Hostinger) |
| `DB_NAME` | MySQL database | `u875310796_cortexbuildpro` |
| `JWT_SECRET` | JWT signing secret | `production-secret-change-this-in-hostinger-panel-env-vars-for-security` |
| `FILE_SIGNING_SECRET` | File upload signature secret | `your-file-signing-secret` |
| `STORAGE_ROOT` | Path for tenant buckets | `./storage` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxx` |
| `EMAIL_FROM` | Notification sender | `noreply@cortexbuildpro.com` |
| `GEMINI_API_KEY` | Google Gemini AI key | `AIzaSy...` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push credentials | (generated via `web-push generate-vapid-keys`) |
| `APP_URL` | Public application URL | `https://cortexbuildpro.com` |
| `CORS_ORIGIN` | Allowed origins | `https://cortexbuildpro.com,https://api.cortexbuildpro.com` |

> Make sure `STORAGE_ROOT` is writable by the Hostinger Node.js user (typically `storage/` inside your app folder).

## 2. Frontend Build Deployment
- Build the project with `npm run build:frontend:prod` (sets `VITE_API_URL`/`VITE_WS_URL` to your API domain).
- Upload the generated `dist/` contents via SFTP to `/domains/cortexbuildpro.com/public_html`.
- Confirm `.htaccess` rewrites are present to serve the SPA for `/` and proxied API at `/api`.

## 3. Verification
1. `curl https://api.cortexbuildpro.com/api/health` → returns `{ "status": "online", "database": { "status": "connected" } }`.
2. `curl https://cortexbuildpro.com` → HTML body with the PWA shell and 200 OK.
3. `npm run verify-all` (from the project root) → should report PASS for environment, dependencies, database, storage, and SendGrid.
4. Browser test: open `https://cortexbuildpro.com`, authenticate via Superadmin invite, and trigger an upload to confirm `/api/storage/upload/single` works.
