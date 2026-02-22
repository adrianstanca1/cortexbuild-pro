# Environment Variables Guide

This document describes all environment variables used in CortexBuildPro application.

## Quick Start

1. Copy `.env.example` to `.env` in the root directory
2. Copy `server/.env.example` to `server/.env`
3. Update the values with your actual credentials

## Database Configuration

### DATABASE_TYPE
**Required**: Yes  
**Default**: `mysql` (as configured in .env.example)  
**Options**: `sqlite`, `postgres`, `mysql`  
**Description**: Specifies which database type to use. The .env.example files default to `mysql` for production deployment on Hostinger. For local development, you can use `sqlite` by setting `DATABASE_TYPE=sqlite` or `USE_LOCAL_DB=true`.

For production MySQL setup (Hostinger):
```bash
DATABASE_TYPE=mysql
```

For local development with SQLite:
```bash
DATABASE_TYPE=sqlite
# or
USE_LOCAL_DB=true
```

### DB_HOST
**Required**: Yes (for postgres/mysql)  
**Example**: `127.0.0.1` (local MySQL), `srv1374.hstgr.io` (remote), or `localhost`  
**Description**: Database server hostname or IP address. Use `127.0.0.1` for local MySQL on the same server, or provide the remote hostname for external MySQL servers.

### DB_USER
**Required**: Yes (for postgres/mysql)  
**Example**: `u875310796_admin`  
**Description**: Database username.

### DB_PASSWORD
**Required**: Yes (for postgres/mysql)  
**Example**: `your_hostinger_password`  
**Description**: Database password.

### DB_NAME
**Required**: Yes (for postgres/mysql)  
**Example**: `u875310796_cortexbuildpro`  
**Description**: Database name.

### DB_PORT
**Required**: No  
**Default**: `3306` (MySQL), `5432` (PostgreSQL)  
**Description**: Database server port.

### DATABASE_URL
**Required**: Alternative to individual DB_* vars  
**Example**: `mysql://user:pass@host:3306/dbname` or `postgresql://user:pass@host:5432/dbname`  
**Description**: Complete database connection string (alternative to using individual DB_* variables).

## Application Secrets

### JWT_SECRET
**Required**: Yes  
**Example**: `your_jwt_secret_here`  
**Description**: Secret key for signing JWT tokens. Use a strong, random string (minimum 32 characters recommended).

### FILE_SIGNING_SECRET
**Required**: Yes  
**Example**: `your_file_signing_secret`  
**Description**: Secret key for signing file upload URLs. Should be different from JWT_SECRET.

## Frontend Configuration

### VITE_API_URL
**Required**: Yes  
**Example**: `https://api.cortexbuildpro.com/api`  
**Description**: Backend API URL used by the frontend.

### VITE_WS_URL
**Required**: Yes  
**Example**: `wss://api.cortexbuildpro.com/live`  
**Description**: WebSocket URL for real-time features.

### VITE_GEMINI_API_KEY
**Required**: Yes (for AI features in frontend)  
**Example**: `your_gemini_key_here`  
**Description**: Google Gemini API key for frontend AI features.

## Email Configuration (SendGrid)

### SENDGRID_API_KEY
**Required**: Yes  
**Example**: `SG.your_sendgrid_key`  
**Description**: SendGrid API key for sending emails. Get from https://app.sendgrid.com/

### EMAIL_FROM
**Required**: Yes  
**Example**: `noreply@cortexbuildpro.com`  
**Description**: Email address to use as sender for system emails.

## AI Services

### GEMINI_API_KEY
**Required**: Yes  
**Example**: `your_gemini_key_here`  
**Description**: Google Gemini API key for backend AI features. Get from https://aistudio.google.com/app/apikey

## Push Notifications

### VAPID_PUBLIC_KEY
**Required**: Yes (for push notifications)  
**Example**: `your_vapid_public_key`  
**Description**: VAPID public key for web push notifications.

### VAPID_PRIVATE_KEY
**Required**: Yes (for push notifications)  
**Example**: `your_vapid_private_key`  
**Description**: VAPID private key for web push notifications.

To generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## Storage Configuration

### STORAGE_ROOT
**Required**: Yes  
**Default**: `./storage`  
**Example**: `./storage` or `/home/u875310796/uploads`  
**Description**: Root directory for file storage. Must be writable by the application.

### FILE_UPLOAD_MAX_SIZE
**Required**: No  
**Default**: `50MB`  
**Description**: Maximum file upload size.

## Server Configuration

### NODE_ENV
**Required**: No  
**Default**: `development`  
**Options**: `development`, `production`, `test`  
**Description**: Application environment mode.

### PORT
**Required**: No  
**Default**: `3001`  
**Description**: Port number for the backend server.

## Additional Services

### FRONTEND_URL / APP_URL
**Example**: `https://cortexbuildpro.com`  
**Description**: Frontend application URL for CORS and callbacks.

### CORS_ORIGIN
**Example**: `https://cortexbuildpro.com`  
**Description**: Allowed origin for CORS requests.

## Optional Services

### Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

### Stripe Payment
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Sentry Monitoring
- `SENTRY_DSN`
- `VITE_SENTRY_DSN`

## MySQL-Specific Setup (Hostinger)

For Hostinger MySQL deployment, use these values:

```bash
# Database
DATABASE_TYPE=mysql
DB_HOST=127.0.0.1
DB_USER=u875310796_admin
DB_PASSWORD=your_hostinger_password
DB_NAME=u875310796_cortexbuildpro
DB_PORT=3306

# Application
JWT_SECRET=your_jwt_secret_here
FILE_SIGNING_SECRET=your_file_signing_secret
STORAGE_ROOT=./storage

# Services
SENDGRID_API_KEY=SG.your_sendgrid_key
EMAIL_FROM=noreply@cortexbuildpro.com
GEMINI_API_KEY=your_gemini_key_here

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Frontend
VITE_API_URL=https://api.cortexbuildpro.com/api
VITE_WS_URL=wss://api.cortexbuildpro.com/live
VITE_GEMINI_API_KEY=your_gemini_key_here
```

## Local Development

For local development with SQLite:

```bash
USE_LOCAL_DB=true
NODE_ENV=development
PORT=3001
```

SQLite will be used automatically and a local database file will be created at `buildpro_db.sqlite`.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, random secrets** (minimum 32 characters) for JWT_SECRET and FILE_SIGNING_SECRET
3. **Rotate secrets regularly** in production
4. **Use different values** between development and production
5. **Store production secrets** securely (use environment variable management in hosting platform)
6. **Limit database user permissions** to only what's needed

## Troubleshooting

### Database Connection Issues

**MySQL Connection Failed**:
- Verify DB_HOST is correct (typically `127.0.0.1` for local MySQL on Hostinger)
- Check DB_USER and DB_PASSWORD are correct
- Ensure database DB_NAME exists
- Verify firewall allows connection on DB_PORT (3306)

**PostgreSQL Connection Failed**:
- Check DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`
- Verify SSL configuration if using cloud database

### Missing Environment Variables

Check the logs for warnings about missing required variables:
```bash
npm start
```

Required variables that must be set:
- JWT_SECRET
- FILE_SIGNING_SECRET
- SENDGRID_API_KEY
- GEMINI_API_KEY
- STORAGE_ROOT
- Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)

## Need Help?

See also:
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `CLOUD_SETUP_GUIDE.md` - Cloud provider setup
- `README.md` - General documentation
