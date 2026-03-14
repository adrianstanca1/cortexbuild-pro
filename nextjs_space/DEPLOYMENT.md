# 🚀 CortexBuild Pro - Production Deployment

## Deployment Options

### Option 1: Docker (Recommended for Self-Hosting)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

**Services:**
- App (Next.js on port 3000)
- PostgreSQL (port 5432)
- Ollama (port 11434) with pre-loaded models

### Option 2: Manual Deployment

```bash
# Run deployment script
./scripts/deploy.sh

# Or manually:
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

### Option 3: Vercel (Cloud)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Note:** For Vercel, set these environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret
- `NEXTAUTH_URL` - Your domain

## Environment Variables

Create `.env.production`:

```env
# Database
DATABASE_URL='postgresql://user:pass@host:5432/cortexbuild'

# Auth
NEXTAUTH_SECRET='your-random-secret-min-32-chars'
NEXTAUTH_URL='https://your-domain.com'
NEXT_PUBLIC_WEBSOCKET_URL='https://your-domain.com'

# AI (Optional - for local AI)
OLLAMA_BASE_URL='http://localhost:11434'
NEXT_PUBLIC_OLLAMA_URL='http://localhost:11434'

# Cloud AI Fallback (Optional)
OPENAI_API_KEY='sk-...'

# S3 Storage (Optional)
AWS_ACCESS_KEY_ID='...'
AWS_SECRET_ACCESS_KEY='...'
AWS_BUCKET_NAME='...'
AWS_REGION='us-west-2'
```

## Pre-Deployment Checklist

- [ ] Database is running and accessible
- [ ] Ollama is installed and models pulled (for local AI)
- [ ] Environment variables are configured
- [ ] Domain is pointed to server (if using custom domain)
- [ ] SSL certificate is configured

## Post-Deployment Verification

```bash
# Check app health
curl https://your-domain.com/api/health

# Check AI status
curl https://your-domain.com/api/ai/local/status

# Check database connection
# (Should see data in dashboard)
```

## Troubleshooting

### Port 3000 already in use
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 on host
```

### Database connection failed
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify network connectivity

### Ollama not responding
- Check Ollama is running: `ollama serve`
- Verify OLLAMA_BASE_URL
- Pull models: `ollama pull llama3.1`

### Build fails
- Check Node.js version (18+ required)
- Clear cache: `rm -rf .next node_modules`
- Reinstall: `npm ci`

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Nginx/Proxy   │────▶│  Next.js App    │────▶│   PostgreSQL   │
│   (SSL/Port 443)│     │   (Port 3000)   │     │   (Port 5432)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Ollama        │
                        │   (Port 11434)   │
                        │  - llama3.1       │
                        │  - llava          │
                        │  - nomic-embed   │
                        └─────────────────┘
```

## Support

For issues, refer to:
- `PRODUCTION_BUILD.md` - Detailed build instructions
- `docs/superpowers/plans/2026-03-13-cortexbuild-phase2-local-ai.md` - Implementation plan
