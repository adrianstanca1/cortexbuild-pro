# Vercel + Railway Quick Deployment Guide

## Overview

This guide provides a **5-minute deployment** of ConstructAI Platform using:
- **Vercel**: Frontend hosting with global CDN
- **Railway**: Backend API + MongoDB + Redis

**Estimated Time**: 5-10 minutes  
**Estimated Cost**: $5-15/month  
**Difficulty**: ⭐ Easy

---

## Prerequisites

✅ GitHub account  
✅ Vercel account (free at https://vercel.com)  
✅ Railway account (free at https://railway.app)  
✅ Credit card for Railway (free credits included)

---

## Part 1: Deploy Backend to Railway (3 minutes)

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign in with GitHub
4. Click **"Deploy from GitHub repo"**
5. Select your repository: `adrianstanca1/project-perplexy`

### Step 2: Add MongoDB Database

1. In Railway dashboard, click **"New Service"**
2. Select **"Database"** → **"Add MongoDB"**
3. MongoDB will be automatically provisioned
4. Note: Connection string will be available as `${{MongoDB.DATABASE_URL}}`

### Step 3: Add Redis Cache

1. Click **"New Service"** again
2. Select **"Database"** → **"Add Redis"**
3. Redis will be automatically provisioned
4. Note: Connection string will be available as `${{Redis.REDIS_URL}}`

### Step 4: Configure Backend Service

1. Click on your GitHub repo service
2. Go to **"Settings"** → **"Service"**
3. Set **Root Directory**: `packages/backend`
4. Go to **"Settings"** → **"Build"**
   - **Build Command**: `npm install --legacy-peer-deps && npm run prisma:generate && npm run build`
   - **Start Command**: `node dist/index.js`

### Step 5: Set Environment Variables

Go to **"Variables"** tab and add:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{MongoDB.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-with-command-below>
JWT_REFRESH_SECRET=<generate-with-command-below>
SESSION_SECRET=<generate-with-command-below>
FRONTEND_URL=https://your-app.vercel.app
```

**Generate secure secrets:**
```bash
# Run this 3 times to generate 3 different secrets
openssl rand -hex 32
```

### Step 6: Deploy Backend

1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. Once deployed, copy your backend URL (looks like: `https://your-backend.railway.app`)

✅ **Backend deployment complete!**

---

## Part 2: Deploy Frontend to Vercel (2 minutes)

### Method A: Via Vercel Dashboard (Recommended)

#### Step 1: Connect Repository

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your repository: `adrianstanca1/project-perplexy`
4. Click **"Import"**

#### Step 2: Configure Project

**Project Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `packages/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

#### Step 3: Set Environment Variables

Click **"Environment Variables"** and add:

```
VITE_API_URL = https://your-backend.railway.app
```

Replace with your actual Railway backend URL from Part 1.

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for deployment
3. Copy your frontend URL (looks like: `https://your-app.vercel.app`)

✅ **Frontend deployment complete!**

### Method B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from repository root
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: constructai
# - Which directory? ./packages/frontend
# - Override settings? No

# Add environment variable
vercel env add VITE_API_URL production
# Enter: https://your-backend.railway.app

# Deploy to production
vercel --prod
```

---

## Part 3: Final Configuration (1 minute)

### Update Backend FRONTEND_URL

1. Go back to Railway dashboard
2. Select your backend service
3. Click **"Variables"**
4. Update `FRONTEND_URL` to your Vercel URL
5. Click **"Deploy"** to redeploy with new variable

### Verify Deployment

**Test Backend:**
```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Test Frontend:**
Open your Vercel URL in browser: `https://your-app.vercel.app`

✅ **Deployment complete!**

---

## Access Your Application

🎉 **Your application is now live!**

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.railway.app
- **API Docs**: https://your-backend.railway.app/api/v1

---

## Quick Deployment Script

For automated deployment, use the provided script:

```bash
chmod +x deploy-vercel-railway.sh
./deploy-vercel-railway.sh
```

This script will:
1. Install Vercel and Railway CLIs
2. Guide you through authentication
3. Deploy backend to Railway
4. Deploy frontend to Vercel
5. Configure all environment variables

---

## Custom Domain Setup (Optional)

### For Vercel (Frontend)

1. Go to Vercel dashboard → Your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `constructai.com`)
4. Update your DNS records as instructed
5. SSL is automatically configured

### For Railway (Backend)

1. Go to Railway dashboard → Backend service
2. Click **"Settings"** → **"Networking"**
3. Add custom domain (e.g., `api.constructai.com`)
4. Update your DNS records
5. SSL is automatically configured

**Update environment variables:**
- Railway: `FRONTEND_URL=https://constructai.com`
- Vercel: `VITE_API_URL=https://api.constructai.com`

---

## Monitoring and Logs

### Railway Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

Or view in Railway dashboard → Service → **"Logs"** tab

### Vercel Logs

```bash
# Install Vercel CLI
npm install -g vercel

# View logs
vercel logs
```

Or view in Vercel dashboard → Project → **"Logs"** tab

---

## Auto-Deploy on Git Push

### Railway

✅ **Automatically enabled**
- Every push to main branch triggers redeploy
- View deployments in Railway dashboard

### Vercel

✅ **Automatically enabled**
- Every push to main branch triggers redeploy
- Pull requests get preview deployments
- View deployments in Vercel dashboard

---

## Scaling and Performance

### Railway

**Free Tier:**
- 512 MB RAM
- Shared CPU
- $5 free credits/month

**Upgrade:**
- Go to Railway → **"Usage"**
- Upgrade to Developer plan ($5/month)
- Scale resources as needed

### Vercel

**Hobby Tier (Free):**
- 100 GB bandwidth/month
- Automatic scaling
- Global CDN

**Pro Tier ($20/month):**
- 1 TB bandwidth
- Advanced analytics
- Team collaboration

---

## Cost Breakdown

### Typical Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| **Railway** | Hobby | $5-10 |
| MongoDB | Included | $0 |
| Redis | Included | $0 |
| **Vercel** | Hobby | $0 |
| **Total** | | **$5-10/month** |

### With Custom Domain

| Additional | Cost |
|------------|------|
| Domain name | $10-15/year |
| **Total** | **~$6-11/month** |

---

## Troubleshooting

### Backend Not Starting

**Check environment variables:**
1. Go to Railway → Backend service → **"Variables"**
2. Verify all variables are set correctly
3. Check DATABASE_URL and REDIS_URL are using Railway references

**View error logs:**
```bash
railway logs
```

### Frontend Can't Connect to Backend

**Check CORS:**
1. Verify FRONTEND_URL in Railway matches Vercel URL
2. Verify VITE_API_URL in Vercel matches Railway URL
3. Both should use HTTPS

**Check backend health:**
```bash
curl https://your-backend.railway.app/health
```

### Build Failures

**Railway build fails:**
- Check build command includes `--legacy-peer-deps`
- Verify Node version is 20+ in Railway settings
- Check Prisma generation step is included

**Vercel build fails:**
- Check root directory is set to `packages/frontend`
- Verify install command includes `--legacy-peer-deps`
- Check environment variables are set

### Database Connection Issues

**MongoDB not connecting:**
1. Verify DATABASE_URL uses `${{MongoDB.DATABASE_URL}}`
2. Check MongoDB service is running in Railway
3. View MongoDB logs in Railway dashboard

**Redis not connecting:**
1. Verify REDIS_URL uses `${{Redis.REDIS_URL}}`
2. Check Redis service is running in Railway
3. View Redis logs in Railway dashboard

---

## Security Checklist

- [x] Change all default secrets (JWT_SECRET, etc.)
- [x] Use HTTPS for all URLs
- [x] Set secure environment variables
- [x] Enable CORS only for your domain
- [x] Use strong database passwords (auto-generated by Railway)
- [x] Enable 2FA on Vercel and Railway accounts
- [x] Review Railway access tokens
- [x] Monitor logs for suspicious activity

---

## Maintenance Tasks

### Weekly

- [ ] Check Railway usage and costs
- [ ] Review application logs for errors
- [ ] Monitor performance metrics

### Monthly

- [ ] Review and rotate secrets if needed
- [ ] Update dependencies (`npm update`)
- [ ] Check for security updates
- [ ] Review database backup status

### As Needed

- [ ] Scale resources based on traffic
- [ ] Optimize slow queries
- [ ] Update environment variables
- [ ] Configure alerts and monitoring

---

## Backup Strategy

### Database Backups

**Railway MongoDB:**
- Automatic daily backups (included)
- Manual backup: Use Railway dashboard → MongoDB → **"Backups"**

**Manual MongoDB backup:**
```bash
# Export database
mongodump --uri="<your-mongodb-uri>" --out=./backup

# Import database
mongorestore --uri="<your-mongodb-uri>" ./backup
```

### Code Backups

✅ **Automatically backed up in GitHub**
- Every commit is a backup
- Create tags for release versions
- Use branches for different environments

---

## Performance Optimization

### Frontend (Vercel)

✅ **Already optimized:**
- Global CDN distribution
- Automatic compression
- HTTP/2 and HTTP/3
- Image optimization
- Edge caching

### Backend (Railway)

**Optimize for production:**
1. Enable response compression
2. Implement Redis caching
3. Add database indexes
4. Use connection pooling
5. Enable rate limiting

**Monitor performance:**
- View metrics in Railway dashboard
- Check response times
- Monitor memory usage
- Track database queries

---

## Next Steps

### Essential

1. ✅ Test all application features
2. ✅ Create admin user account
3. ✅ Configure OAuth (optional)
4. ✅ Setup error tracking (Sentry)
5. ✅ Configure monitoring alerts

### Recommended

6. Setup custom domain
7. Configure email service (SendGrid)
8. Enable file uploads (Cloud Storage)
9. Setup CI/CD pipeline
10. Create staging environment

### Advanced

11. Implement A/B testing
12. Setup analytics (Google Analytics)
13. Configure CDN caching rules
14. Implement backup automation
15. Setup disaster recovery plan

---

## Support

### Platform Support

- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support
- **MongoDB**: https://www.mongodb.com/support

### Application Support

- **GitHub Issues**: https://github.com/adrianstanca1/project-perplexy/issues
- **Documentation**: See DEPLOYMENT_GUIDE.md

---

## Success! 🎉

Your ConstructAI Platform is now deployed and accessible globally!

**What you've accomplished:**
✅ Backend API running on Railway with managed MongoDB + Redis  
✅ Frontend PWA deployed on Vercel's global CDN  
✅ Automatic SSL/HTTPS enabled  
✅ Auto-deploy on git push configured  
✅ Production-ready infrastructure  

**Total deployment time**: ~5-10 minutes  
**Total cost**: $5-10/month  

---

**Last Updated**: November 19, 2025  
**Deployment Type**: Vercel (Frontend) + Railway (Backend)  
**Platform**: ConstructAI Construction Management Platform
