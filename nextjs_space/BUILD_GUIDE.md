# Production Build Guide

This guide documents the process for cleaning files and building CortexBuild Pro for production deployment.

## Overview

The production build process ensures that:
- All build artifacts are cleaned before building
- Dependencies are properly installed
- Prisma Client is generated
- Next.js application is optimized for production
- Build artifacts are not committed to version control

## Quick Start

From the `nextjs_space` directory, run:

```bash
./build-production.sh
```

This automated script will handle all build steps.

## Manual Build Process

If you prefer to run steps manually:

### 1. Clean Previous Artifacts

```bash
cd nextjs_space
rm -rf .next node_modules
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is required due to peer dependency conflicts in some packages.

### 3. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client based on your schema at `prisma/schema.prisma`.

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `.next/` directory.

## Build Output

After a successful build, you'll find:

- **`.next/`** - Compiled Next.js application (473MB)
  - `server/` - Server-side code
  - `static/` - Static assets
  - Various manifest files for routing and rendering

- **`node_modules/`** - Dependencies (1.4GB)

## Environment Configuration

Before building, ensure you have a `.env` file with required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Optional integrations
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="cortexbuild/"
AWS_REGION="us-east-1"
```

Use `.env.example` as a template.

## Starting Production Server

After building, start the production server:

```bash
npm start
```

Or using the custom production server:

```bash
node production-server.js
```

## .gitignore Configuration

Build artifacts are excluded from version control via `.gitignore`:

```
.next/
node_modules/
*.log
.env
.env.local
*.tsbuildinfo
```

## Docker Build

For Docker-based deployments, the Dockerfile handles the build process automatically:

```bash
cd deployment
docker-compose build
docker-compose up -d
```

## Build Verification

To verify the build was successful:

1. Check that `.next/server/app/page.js` exists
2. Verify the build output shows no errors
3. Test the production server starts without errors

## Troubleshooting

### Build Fails with TypeScript Errors

The build skips type validation by default. To enable:

```json
// next.config.js
{
  typescript: {
    ignoreBuildErrors: false
  }
}
```

### Out of Memory Errors

Increase Node.js memory:

```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Prisma Client Not Found

Regenerate the Prisma Client:

```bash
npx prisma generate
```

### Missing Dependencies

Clear and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Production Deployment

For complete deployment instructions, see:
- [PRODUCTION_DEPLOYMENT_CHECKLIST.md](../docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [deployment/PRODUCTION-DEPLOY-GUIDE.md](../deployment/PRODUCTION-DEPLOY-GUIDE.md)
- [VPS_DEPLOYMENT_GUIDE.md](../VPS_DEPLOYMENT_GUIDE.md)

## CI/CD Integration

The build process can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Build Next.js
  run: |
    cd nextjs_space
    npm install --legacy-peer-deps
    npx prisma generate
    npm run build
```

## Performance Notes

- Build time: ~2-3 minutes (depending on hardware)
- Build size: ~473MB for `.next/`
- Dependencies size: ~1.4GB for `node_modules/`
- First load JS: 87.5kB (shared across all pages)
- Routes: 200+ optimized routes

## Security Considerations

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Audit dependencies** - Run `npm audit` before deploying
4. **Review build logs** - Check for exposed secrets or errors

## Related Documentation

- [README.md](README.md) - Main project documentation
- [API_SETUP_GUIDE.md](../docs/API_SETUP_GUIDE.md) - API configuration
- [SECURITY_CHECKLIST.md](../docs/SECURITY_CHECKLIST.md) - Security guidelines

---

**Last Updated:** January 27, 2026  
**Version:** 1.0.0
