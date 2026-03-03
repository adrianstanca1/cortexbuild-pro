# 🚀 CortexBuild Complete Deployment Guide

**Comprehensive guide for deploying CortexBuild to production on multiple platforms**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Architecture](#deployment-architecture)
3. [Vercel Deployment (Frontend)](#vercel-deployment-frontend)
4. [Render Deployment (Backend)](#render-deployment-backend)
5. [IONOS Deployment (Optional)](#ionos-deployment-optional)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] **GitHub/GitLab account** (for repository hosting)
- [ ] **Vercel account** ([sign up](https://vercel.com/signup))
- [ ] **Render account** ([sign up](https://render.com))
- [ ] **Supabase account** ([sign up](https://supabase.com))
- [ ] **Environment variables** ready (see `.env.example`)
- [ ] **Domain name** (optional)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   CortexBuild Platform                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   Vercel (FE)    │         │  Render (BE)     │     │
│  │                  │◄───────►│                  │     │
│  │  - React App     │  HTTPS  │  - Express API   │     │
│  │  - Static Assets │         │  - WebSocket     │     │
│  │  - CDN Caching   │         │  - Workers       │     │
│  └──────────────────┘         └──────────────────┘     │
│          │                           │                   │
│          │                           │                   │
│          ▼                           ▼                   │
│  ┌──────────────────────────────────────────┐           │
│  │         Supabase Database                 │           │
│  │  - PostgreSQL                             │           │
│  │  - Row Level Security                     │           │
│  │  - Real-time Subscriptions                │           │
│  │  - File Storage                           │           │
│  └──────────────────────────────────────────┘           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Vercel Deployment (Frontend)

Vercel is the recommended platform for hosting the React frontend application.

### Quick Deploy (5 minutes)

```bash
# Option 1: Using CLI
npm install -g vercel
vercel login
vercel --prod

# Option 2: Using Script
./scripts/deploy-vercel.sh

# Option 3: Using GitHub Integration
# 1. Push code to GitHub
# 2. Import project in Vercel dashboard
# 3. Configure environment variables
# 4. Deploy
```

### Manual Deployment Steps

#### 1. Prepare Your Project

```bash
# Clone repository
git clone https://github.com/your-username/cortexbuild.git
cd cortexbuild

# Install dependencies
npm install

# Test build
npm run build
```

#### 2. Configure Vercel

Create a `.vercel` folder or use the dashboard:

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

#### 3. Set Environment Variables

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-app.vercel.app

# Optional
VITE_API_URL=https://your-api.render.com
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=sk-your-openai-key
```

#### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Or deploy preview
vercel
```

#### 5. Configure Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate will be auto-provisioned

### Vercel Configuration Files

Your project includes optimized `vercel.json` with:
- ✅ Security headers (XSS protection, CSP, etc.)
- ✅ Caching strategies for static assets
- ✅ CORS configuration
- ✅ SPA routing support

---

## Render Deployment (Backend)

Render is recommended for hosting the Express backend API with WebSocket support.

### Quick Deploy

```bash
# Option 1: Using CLI
curl -fsSL https://render.com/api/provision/install_render_cli.sh | bash
render login
render deploy

# Option 2: Using Script
./scripts/deploy-render.sh

# Option 3: Using Dashboard
# 1. Connect GitHub repository
# 2. Create new Web Service
# 3. Use render.yaml configuration
# 4. Deploy
```

### Manual Deployment Steps

#### 1. Create Web Service in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

```
Name: cortexbuild-backend
Region: Oregon
Branch: main
Root Directory: ./
Build Command: npm install
Start Command: npm run server
Instance Type: Free
```

#### 2. Set Environment Variables

In Render Dashboard → **Environment**:

```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=sk-your-openai-key
CORS_ORIGIN=https://your-app.vercel.app
```

#### 3. Deploy

Click **Create Web Service** and Render will automatically:
- Clone your repository
- Install dependencies
- Build the application
- Start the server

#### 4. Configure Custom Domain (Optional)

1. Go to **Settings** → **Custom Domains**
2. Add your domain
3. Update DNS records
4. SSL certificate auto-provisioned

### Render Configuration

Your `render.yaml` includes:
- ✅ Automatic deployments from Git
- ✅ Environment variable management
- ✅ Health check configuration
- ✅ Auto-scaling settings

---

## IONOS Deployment (Optional)

IONOS is optional for traditional hosting with FTP access.

### Prerequisites

```bash
# Configure FTP credentials in environment
IONOS_FTP_HOST=your-ftp.ionos.com
IONOS_FTP_USER=your-username
IONOS_FTP_PASSWORD=your-password
IONOS_REMOTE_PATH=/
```

### Deploy

```bash
# Build and deploy
npm run deploy

# Or run directly
node deploy-ionos.cjs
```

---

## Environment Configuration

### Creating Environment Files

```bash
# Copy example file
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

### Required Variables

**Frontend (Vercel)**:
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_APP_URL=https://your-app.vercel.app
```

**Backend (Render)**:
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your-32-char-secret
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

### Generating Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate random password
openssl rand -base64 32
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check frontend
curl https://your-app.vercel.app

# Check backend health
curl https://your-api.render.com/api/health
```

### 2. Test Authentication

- Login with test credentials
- Verify JWT tokens work
- Test protected routes
- Check session management

### 3. Verify Database Connection

- Test CRUD operations
- Verify RLS policies
- Check data persistence
- Monitor query performance

### 4. Test Features

- [ ] User registration/login
- [ ] Project management
- [ ] Task creation/editing
- [ ] File uploads
- [ ] Real-time updates
- [ ] AI features
- [ ] Notifications

### 5. Performance Monitoring

```bash
# Enable Vercel Analytics
# Dashboard → Project → Analytics

# Monitor Render logs
render logs --tail

# Check Supabase performance
# Dashboard → Database → Performance
```

### 6. Security Checklist

- [ ] HTTPS enabled on all domains
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] RLS policies tested
- [ ] Rate limiting active
- [ ] Secrets rotated regularly

---

## Troubleshooting

### Build Failures

**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
npm run lint
# Fix reported errors
npm run build
```

**Problem**: Environment variables not loaded

**Solution**:
```bash
# Verify .env.local exists
cat .env.local

# Check Vercel/Render env settings
# Ensure all VITE_ prefixed vars are set
```

### Deployment Issues

**Problem**: App shows blank page after deployment

**Solution**:
1. Check browser console for errors
2. Verify environment variables
3. Check CORS configuration
4. Verify API endpoints are accessible

**Problem**: Backend not connecting to frontend

**Solution**:
1. Check CORS settings in server/index.ts
2. Verify FRONTEND_URL environment variable
3. Test API endpoints directly
4. Check Render logs for errors

### Database Connection Issues

**Problem**: Cannot connect to Supabase

**Solution**:
```bash
# Verify credentials
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl https://your-project.supabase.co/rest/v1/

# Check RLS policies
# Supabase Dashboard → Authentication → Policies
```

**Problem**: RLS blocking queries

**Solution**:
```sql
-- Check policy exists
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Temporarily disable for testing
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing policies
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Performance Issues

**Problem**: Slow page loads

**Solution**:
```bash
# Enable Vercel Analytics
# Check bundle size
npm run build -- --mode analyze

# Optimize images
# Use Vercel Image Optimization

# Check database indexes
# Supabase Dashboard → Database → Indexes
```

---

## Advanced Configuration

### Custom Build Settings

```bash
# Production build with optimizations
npm run build -- --mode production

# Preview production build locally
npm run preview
```

### Multiple Environments

```bash
# Development
NODE_ENV=development npm run dev

# Staging
vercel deploy --target staging

# Production
vercel --prod
```

### CI/CD Integration

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Support & Resources

### Documentation Links

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)

### Getting Help

1. **Check logs**: Vercel/Render dashboards
2. **Documentation**: See `/docs` folder
3. **GitHub Issues**: Report bugs
4. **Community**: Discord/Slack
5. **Support**: Contact support team

---

## Success Checklist

✅ **Frontend deployed to Vercel**
✅ **Backend deployed to Render**
✅ **Environment variables configured**
✅ **Database schema deployed**
✅ **Authentication working**
✅ **API endpoints accessible**
✅ **CORS configured**
✅ **HTTPS enabled**
✅ **Monitoring active**
✅ **Backup strategy in place**

---

## 🎉 Congratulations!

Your CortexBuild application is now deployed and ready for production use!

**Next Steps**:
1. Share your deployment URL with your team
2. Set up monitoring and alerts
3. Plan your marketing launch
4. Gather user feedback
5. Iterate and improve

**Need Help?** Check the troubleshooting section or reach out to our support team.

---

**CortexBuild v3.0.0** - Ready to revolutionize construction project management! 🏗️✨

