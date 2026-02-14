# Deployment Guide

This document describes how to deploy the application to production (Vercel) and VPS environments.

## Overview

The application can be deployed to two environments:
1. **Production (Vercel)** - Frontend and serverless functions
2. **VPS** - Full-stack deployment with frontend and backend

## Prerequisites

### Required Secrets

Configure the following secrets in GitHub repository settings:

#### For Production (Vercel)
- `VERCEL_TOKEN` - Vercel authentication token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string

#### For VPS
- `VPS_SSH_KEY` - SSH private key for VPS access

### Environment Variables

The following environment variables are configured during deployment:
- `VITE_API_URL` - API endpoint URL
- `VITE_WS_URL` - WebSocket endpoint URL
- `NODE_ENV` - Environment (production)

## Deployment Methods

### 1. Automated Deployment (Recommended)

#### Deploy to All Environments
Use the "Deploy to All Environments" workflow for complete deployment:

```bash
# Via GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Deploy to All Environments"
# 3. Click "Run workflow"
# 4. Select which environments to deploy (Production and/or VPS)
# 5. Click "Run workflow"
```

#### Deploy to Production Only
The production deployment is triggered automatically on push to `main` branch, or manually:

```bash
# Automatic: Push to main branch
git push origin main

# Manual: Via GitHub Actions UI
# 1. Go to Actions tab
# 2. Select "Deploy to Production (Vercel)"
# 3. Click "Run workflow"
```

#### Deploy to VPS Only
The VPS deployment is triggered automatically on push to `main` branch, or manually:

```bash
# Manual: Via GitHub Actions UI
# 1. Go to Actions tab
# 2. Select "Deploy to VPS"
# 3. Click "Run workflow"
```

### 2. Manual Deployment

#### Build Application Locally

```bash
# Install dependencies
npm ci
cd server && npm ci && cd ..

# Build frontend and backend
npm run build:prod
```

#### Deploy to Production (Vercel)

```bash
# Install Vercel CLI
npm install --global vercel

# Deploy to production
npm run vercel:prod
```

#### Deploy to VPS

```bash
# Deploy using rsync (requires SSH access)
VPS_HOST=72.62.132.43 npm run deploy:vps
```

## Deployment Workflows

### Build Process

All deployments follow this build process:

1. **Install Dependencies**
   - Frontend dependencies (`npm ci`)
   - Backend dependencies (`cd server && npm ci`)

2. **Lint Code**
   - ESLint checks for code quality

3. **Build Frontend**
   - Vite build for production
   - Environment variables injected
   - Output: `dist/` directory

4. **Build Backend**
   - TypeScript compilation
   - Output: `server/dist/` directory

### Production (Vercel) Deployment

1. Build application artifacts
2. Pull Vercel environment configuration
3. Build Vercel project
4. Deploy to Vercel production

### VPS Deployment

1. Build application artifacts
2. Setup SSH connection
3. Deploy frontend via rsync
   - Target: `/home/deploy/apps/cortexbuild/frontend/dist/`
4. Deploy backend via rsync
   - Target: `/home/deploy/apps/cortexbuild/server/dist/`
5. Restart PM2 process
   - Process name: `cortexbuild-backend`
6. Verify deployment

## Verification

After deployment, verify the following:

### Production (Vercel)
- [ ] Frontend loads successfully
- [ ] API endpoints respond
- [ ] WebSocket connections work
- [ ] Database connections succeed
- [ ] Supabase integration works

### VPS
- [ ] Frontend files deployed correctly
- [ ] Backend files deployed correctly
- [ ] PM2 process is running
- [ ] API endpoints respond
- [ ] Service health check passes

## Rollback

### Production (Vercel)
Use Vercel dashboard to rollback to previous deployment:
1. Go to Vercel dashboard
2. Select the project
3. Navigate to Deployments
4. Select previous successful deployment
5. Click "Promote to Production"

### VPS
1. SSH into VPS
2. Restore from backup or previous deployment
3. Restart PM2 process

```bash
ssh deploy@72.62.132.43
cd /home/deploy/apps/cortexbuild
# Restore from backup
pm2 restart cortexbuild-backend
```

## Monitoring

### Check Deployment Status

```bash
# Check GitHub Actions workflows
# Go to Actions tab in GitHub repository

# Check VPS PM2 status
ssh deploy@72.62.132.43 'pm2 status'

# Check VPS application logs
ssh deploy@72.62.132.43 'pm2 logs cortexbuild-backend --lines 50'
```

### Health Checks

```bash
# Production API health
curl https://api.cortexbuildpro.com/api/health

# VPS health (if applicable)
npm run db:health
```

## Troubleshooting

### Build Failures

If the build fails:
1. Check GitHub Actions logs for error details
2. Verify all dependencies are correctly installed
3. Check TypeScript compilation errors
4. Ensure environment variables are set correctly

### Deployment Failures

#### Production (Vercel)
1. Verify `VERCEL_TOKEN` is valid
2. Check Vercel dashboard for deployment logs
3. Ensure Vercel project is correctly configured

#### VPS
1. Verify SSH key is valid and has correct permissions
2. Check VPS disk space: `ssh deploy@72.62.132.43 'df -h'`
3. Verify PM2 is installed and running
4. Check application logs: `ssh deploy@72.62.132.43 'pm2 logs'`

### Common Issues

**TypeScript Compilation Errors**
- Run `npm run build:backend` locally to see errors
- Fix type errors in source code
- Commit and push changes

**Permission Denied (VPS)**
- Ensure SSH key has correct permissions (600)
- Verify user has write access to deployment directories
- Check file ownership on VPS

**PM2 Process Not Starting**
- Check PM2 logs: `ssh deploy@72.62.132.43 'pm2 logs cortexbuild-backend --err'`
- Verify environment variables are set
- Check Node.js version compatibility

## Security Notes

1. **Never commit secrets** to the repository
2. Use GitHub Secrets for sensitive data
3. Rotate SSH keys regularly
4. Monitor deployment logs for suspicious activity
5. Keep dependencies updated

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review this deployment guide
3. Contact repository maintainers
4. Check application-specific documentation

## References

- [Vercel Documentation](https://vercel.com/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
