# Cloud Deployment Guide - ConstructAI Platform

## Overview

This guide provides step-by-step instructions for deploying the ConstructAI Platform to various cloud providers. Choose the platform that best fits your needs.

## Quick Comparison

| Platform | Best For | Setup Time | Cost | Complexity |
|----------|----------|------------|------|------------|
| **Railway** | Full-stack, ease of use | 10 min | $5-20/mo | ⭐ Easy |
| **Render** | Full-stack, free tier | 15 min | Free-$20/mo | ⭐⭐ Easy |
| **Vercel + Railway** | Separated frontend/backend | 10 min | $0-$20/mo | ⭐⭐ Medium |
| **AWS** | Enterprise, scalability | 30+ min | Variable | ⭐⭐⭐⭐ Advanced |
| **GCP** | Google Cloud ecosystem | 30+ min | Variable | ⭐⭐⭐⭐ Advanced |
| **Azure** | Microsoft ecosystem | 30+ min | Variable | ⭐⭐⭐⭐ Advanced |

---

## Option 1: Railway (Recommended - Easiest Full-Stack)

### Overview
Railway provides the simplest full-stack deployment with managed databases.

### Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)
- Credit card (for verification, includes free credits)

### Steps

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login to Railway
```bash
railway login
```
This will open a browser window for authentication.

#### 3. Create New Project
```bash
# From repository root
railway init
```

#### 4. Add MongoDB Service
```bash
# Via Railway CLI
railway add mongodb

# Or via Railway Dashboard:
# 1. Go to your project
# 2. Click "New Service"
# 3. Select "Database" → "MongoDB"
# 4. Click "Add MongoDB"
```

#### 5. Add Redis Service
```bash
# Via Railway CLI
railway add redis

# Or via Railway Dashboard:
# 1. Click "New Service"
# 2. Select "Database" → "Redis"
# 3. Click "Add Redis"
```

#### 6. Deploy Backend
```bash
# Create backend service
railway up --service backend

# Or via Railway Dashboard:
# 1. Click "New Service"
# 2. Select "GitHub Repo"
# 3. Connect your repository
# 4. Set root directory: packages/backend
# 5. Set build command: npm install --legacy-peer-deps && npm run build
# 6. Set start command: node dist/index.js
```

**Backend Environment Variables** (set in Railway Dashboard):
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{MongoDB.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-secure-64-char-string>
JWT_REFRESH_SECRET=<generate-secure-64-char-string>
SESSION_SECRET=<generate-secure-64-char-string>
FRONTEND_URL=https://your-frontend.railway.app
```

#### 7. Deploy Frontend
```bash
# Create frontend service
railway up --service frontend

# Or via Railway Dashboard:
# 1. Click "New Service"
# 2. Select "GitHub Repo"
# 3. Set root directory: packages/frontend
# 4. Set build command: npm install --legacy-peer-deps && npm run build
# 5. Set start command: npx serve -s dist -l $PORT
```

**Frontend Environment Variables**:
```env
VITE_API_URL=https://your-backend.railway.app
```

#### 8. Generate Secure Secrets
```bash
# Generate JWT secrets
openssl rand -hex 32

# Run this command 3 times for:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - SESSION_SECRET
```

#### 9. Configure Custom Domains (Optional)
- Go to service settings
- Click "Settings" → "Networking"
- Add custom domain
- Update DNS records

### Deployment Commands
```bash
# Deploy all services
railway up

# Deploy specific service
railway up --service backend
railway up --service frontend

# View logs
railway logs

# Open Railway dashboard
railway open
```

### Cost Estimate
- **Free tier**: $5 credit/month
- **Hobby plan**: $5/month
- **Pro plan**: $20/month
- Typical usage: $10-20/month

---

## Option 2: Render (Great for Free Tier)

### Overview
Render offers a generous free tier and is very beginner-friendly.

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)

### Steps

#### 1. Create Account
- Go to https://render.com
- Sign up with GitHub
- Verify email

#### 2. Deploy Backend

**Via Render Dashboard:**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure service:
   ```
   Name: constructai-backend
   Region: Choose closest to users
   Branch: main (or your branch)
   Root Directory: packages/backend
   Runtime: Node
   Build Command: npm install --legacy-peer-deps && npm run prisma:generate && npm run build
   Start Command: node dist/index.js
   Plan: Free (or paid for better performance)
   ```

4. Add environment variables:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<mongodb-connection-string>
   REDIS_URL=<redis-connection-string>
   JWT_SECRET=<generate-secure-string>
   JWT_REFRESH_SECRET=<generate-secure-string>
   SESSION_SECRET=<generate-secure-string>
   FRONTEND_URL=https://your-app.onrender.com
   ```

5. Click "Create Web Service"

#### 3. Create MongoDB Database

**Option A: Use Render's MongoDB (if available)**
1. Click "New +" → "Database"
2. Select MongoDB
3. Configure and create

**Option B: Use MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist all IPs (0.0.0.0/0) for Render
5. Get connection string
6. Add to backend environment variables

#### 4. Create Redis Instance

**Option A: Use Render's Redis**
1. Click "New +" → "Redis"
2. Configure and create
3. Copy Redis URL
4. Add to backend environment variables

**Option B: Use Upstash Redis (Free tier)**
1. Go to https://upstash.com
2. Create free Redis database
3. Get connection URL
4. Add to backend environment variables

#### 5. Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   ```
   Name: constructai-frontend
   Branch: main
   Root Directory: packages/frontend
   Build Command: npm install --legacy-peer-deps && npm run build
   Publish Directory: dist
   ```

4. Add environment variables:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   ```

5. Click "Create Static Site"

#### 6. Configure Auto-Deploy
- Render automatically deploys on git push
- Enable "Auto-Deploy" in service settings

### Cost Estimate
- **Free tier**: Available for all services
- **Starter**: $7/month per service
- **Standard**: $25/month per service
- Free tier limitations: Services spin down after inactivity

---

## Option 3: Vercel (Frontend) + Railway (Backend)

### Overview
Best CDN performance for frontend, flexible backend hosting.

### Prerequisites
- Vercel account (https://vercel.com)
- Railway account (https://railway.app)

### Steps

#### 1. Deploy Backend to Railway
Follow Railway steps from Option 1 (steps 1-6 for backend only)

#### 2. Deploy Frontend to Vercel

**Via Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from repository root
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: constructai
# - Which directory? ./packages/frontend
# - Override settings? No

# Production deployment
vercel --prod
```

**Via Vercel Dashboard:**
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   ```
   Framework Preset: Vite
   Root Directory: packages/frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install --legacy-peer-deps
   ```

5. Add environment variables:
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```

6. Click "Deploy"

#### 3. Configure Custom Domain (Optional)
- Add domain in Vercel dashboard
- Update DNS records
- SSL automatically configured

### Cost Estimate
- **Vercel**: Free for frontend (hobby)
- **Railway**: $10-20/month for backend + databases
- **Total**: $10-20/month

---

## Option 4: AWS (Enterprise-Scale)

### Overview
Full control, enterprise features, complex setup.

### Architecture
```
CloudFront (CDN)
    ↓
S3 (Frontend Static Files)

Route 53 (DNS)
    ↓
Application Load Balancer
    ↓
ECS Fargate (Backend Containers)
    ↓
DocumentDB (MongoDB) + ElastiCache (Redis)
```

### Steps (High-Level)

#### 1. Setup AWS CLI
```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
```

#### 2. Create VPC and Networking
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24

# Create Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id <vpc-id> --internet-gateway-id <igw-id>
```

#### 3. Create DocumentDB Cluster
```bash
aws docdb create-db-cluster \
  --db-cluster-identifier constructai-mongodb \
  --engine docdb \
  --master-username admin \
  --master-user-password <secure-password>
```

#### 4. Create ElastiCache (Redis)
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id constructai-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

#### 5. Build and Push Docker Images
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name constructai-backend
aws ecr create-repository --repository-name constructai-frontend

# Build and push
docker build -t constructai-backend packages/backend
docker tag constructai-backend:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/constructai-backend:latest
docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/constructai-backend:latest
```

#### 6. Deploy to ECS
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name constructai-cluster

# Create task definitions (see AWS documentation)
# Create services
# Configure load balancer
```

#### 7. Setup S3 + CloudFront for Frontend
```bash
# Create S3 bucket
aws s3 mb s3://constructai-frontend

# Upload build files
aws s3 sync packages/frontend/dist s3://constructai-frontend

# Create CloudFront distribution
aws cloudfront create-distribution --origin-domain-name constructai-frontend.s3.amazonaws.com
```

### Cost Estimate
- **Compute**: $50-200/month
- **Database**: $100-500/month
- **Data transfer**: Variable
- **Total**: $200-1000+/month

---

## Option 5: Google Cloud Platform (GCP)

### Overview
Google's cloud platform with excellent container support.

### Services Used
- **Cloud Run**: Backend containers
- **Cloud Storage**: Frontend static files
- **Cloud CDN**: Content delivery
- **MongoDB Atlas**: Database (GCP marketplace)
- **Memorystore**: Redis

### Steps (High-Level)

#### 1. Setup GCP CLI
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Initialize
gcloud init
```

#### 2. Create Project
```bash
gcloud projects create constructai-platform
gcloud config set project constructai-platform
```

#### 3. Deploy Backend to Cloud Run
```bash
# Build container
gcloud builds submit --tag gcr.io/constructai-platform/backend packages/backend

# Deploy
gcloud run deploy constructai-backend \
  --image gcr.io/constructai-platform/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 4. Setup MongoDB Atlas
```bash
# Via GCP Marketplace or MongoDB Atlas directly
# Configure connection string in Cloud Run environment variables
```

#### 5. Setup Memorystore (Redis)
```bash
gcloud redis instances create constructai-redis \
  --size=1 \
  --region=us-central1
```

#### 6. Deploy Frontend to Cloud Storage + CDN
```bash
# Create bucket
gsutil mb gs://constructai-frontend

# Upload files
gsutil -m cp -r packages/frontend/dist/* gs://constructai-frontend

# Setup CDN
gcloud compute backend-buckets create constructai-frontend-backend \
  --gcs-bucket-name=constructai-frontend
```

### Cost Estimate
- **Cloud Run**: $0-50/month
- **MongoDB Atlas**: $0-100/month (free tier available)
- **Memorystore**: $40-100/month
- **Storage/CDN**: $5-20/month
- **Total**: $50-250/month

---

## Option 6: Microsoft Azure

### Overview
Microsoft's cloud platform with strong enterprise integration.

### Services Used
- **App Service**: Backend hosting
- **Static Web Apps**: Frontend hosting
- **Cosmos DB**: MongoDB API
- **Azure Cache for Redis**: Redis
- **Azure CDN**: Content delivery

### Steps (High-Level)

#### 1. Setup Azure CLI
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login
```

#### 2. Create Resource Group
```bash
az group create --name constructai-rg --location eastus
```

#### 3. Create Cosmos DB (MongoDB API)
```bash
az cosmosdb create \
  --name constructai-cosmos \
  --resource-group constructai-rg \
  --kind MongoDB \
  --server-version 4.2
```

#### 4. Create Redis Cache
```bash
az redis create \
  --name constructai-redis \
  --resource-group constructai-rg \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

#### 5. Deploy Backend to App Service
```bash
# Create App Service plan
az appservice plan create \
  --name constructai-plan \
  --resource-group constructai-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name constructai-backend \
  --resource-group constructai-rg \
  --plan constructai-plan \
  --runtime "NODE|20-lts"

# Deploy code
az webapp deployment source config-zip \
  --resource-group constructai-rg \
  --name constructai-backend \
  --src backend.zip
```

#### 6. Deploy Frontend to Static Web Apps
```bash
az staticwebapp create \
  --name constructai-frontend \
  --resource-group constructai-rg \
  --source https://github.com/your-username/project-perplexy \
  --location eastus \
  --branch main \
  --app-location "packages/frontend" \
  --output-location "dist"
```

### Cost Estimate
- **App Service**: $15-100/month
- **Cosmos DB**: $25-500/month
- **Redis Cache**: $15-100/month
- **Static Web Apps**: Free-$10/month
- **Total**: $50-700/month

---

## Post-Deployment Tasks (All Platforms)

### 1. Configure Environment Variables
Ensure all required environment variables are set:
- `JWT_SECRET` (64+ char random string)
- `JWT_REFRESH_SECRET` (64+ char random string)
- `SESSION_SECRET` (64+ char random string)
- `DATABASE_URL`
- `REDIS_URL`
- `FRONTEND_URL`
- `VITE_API_URL`

### 2. Setup Custom Domain
- Purchase domain (Namecheap, Google Domains, etc.)
- Configure DNS records
- Enable SSL/TLS (usually automatic)

### 3. Configure CORS
Update backend CORS settings to allow your frontend domain.

### 4. Setup Monitoring
- Enable platform-specific monitoring
- Configure error tracking (Sentry)
- Setup uptime monitoring (UptimeRobot, Pingdom)

### 5. Configure Backups
- Database: Enable automated backups
- Files: Regular backup of uploaded files
- Configuration: Version control for all configs

### 6. Security Hardening
- Enable 2FA on cloud platform
- Rotate secrets regularly
- Enable Web Application Firewall (WAF)
- Configure rate limiting
- Enable DDoS protection

### 7. Performance Optimization
- Enable CDN for static assets
- Configure caching headers
- Optimize database indexes
- Enable compression

---

## Monitoring and Maintenance

### Health Checks
```bash
# Backend health
curl https://your-backend-url/health

# Expected response
{"status":"ok","timestamp":"..."}
```

### View Logs

**Railway:**
```bash
railway logs
```

**Render:**
- View logs in Render dashboard

**Vercel:**
```bash
vercel logs
```

**AWS:**
```bash
aws logs tail /aws/ecs/constructai-backend --follow
```

### Scaling

**Railway/Render:**
- Upgrade plan in dashboard
- Configure auto-scaling

**Vercel:**
- Automatic scaling included

**AWS/GCP/Azure:**
- Configure auto-scaling policies
- Set min/max instances

---

## Troubleshooting

### Build Failures
```bash
# Check build logs
# Verify Node version (should be 20+)
# Ensure --legacy-peer-deps flag is used
# Verify Prisma generation step
```

### Database Connection Errors
```bash
# Verify DATABASE_URL format
# Check IP whitelist settings
# Verify database credentials
# Check network/firewall rules
```

### CORS Errors
```bash
# Update CORS_ORIGIN in backend .env
# Verify FRONTEND_URL is correct
# Check backend CORS middleware configuration
```

### Environment Variable Issues
```bash
# Verify all required variables are set
# Check for typos in variable names
# Ensure no trailing spaces in values
# Verify secrets are properly escaped
```

---

## Cost Optimization Tips

1. **Start small**: Begin with free/cheapest tiers
2. **Use managed databases**: Cheaper than self-hosted
3. **Enable CDN**: Reduces bandwidth costs
4. **Configure auto-scaling**: Scale down during low traffic
5. **Use spot instances**: For non-critical workloads (AWS)
6. **Monitor costs**: Set up billing alerts
7. **Optimize images**: Reduce storage and bandwidth
8. **Cache aggressively**: Reduce compute and database load

---

## Recommended Platform by Use Case

| Use Case | Recommended Platform | Reason |
|----------|---------------------|---------|
| **Learning/Testing** | Render (Free tier) | No cost, easy setup |
| **Side Project** | Railway | Best developer experience |
| **Startup MVP** | Vercel + Railway | Great performance, reasonable cost |
| **Small Business** | Render or Railway | Managed services, predictable costs |
| **Enterprise** | AWS or GCP | Scalability, compliance, control |
| **Microsoft Shop** | Azure | Integration with MS ecosystem |

---

## Quick Start Recommendation

**For fastest deployment (15 minutes):**

1. Use **Railway** for backend + databases
2. Use **Vercel** for frontend
3. Use **MongoDB Atlas** free tier for database
4. Use **Upstash** free tier for Redis

This combination provides:
- ✅ Free or very low cost (~$5-10/month)
- ✅ Automatic SSL
- ✅ Auto-deployment on git push
- ✅ Excellent performance
- ✅ Minimal configuration

---

## Support

For platform-specific support:
- **Railway**: https://railway.app/help
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **AWS**: https://aws.amazon.com/support
- **GCP**: https://cloud.google.com/support
- **Azure**: https://azure.microsoft.com/support

For ConstructAI platform issues:
- GitHub Issues: [Your Repository]/issues
- Documentation: DEPLOYMENT_GUIDE.md

---

**Last Updated**: November 19, 2025  
**Version**: 1.0.0  
**Platform**: ConstructAI Construction Management Platform
