# CortexBuild Pro - Production Deployment

## 🚀 Deployment Options

### Option 1: Docker (Recommended for Self-Hosting)

```bash
# Build and run with Docker Compose
docker-compose up -d

# This will start:
# - Next.js app on port 3000
# - PostgreSQL on port 5432
# - Ollama (local AI) on port 11434
```

### Option 2: Vercel (Cloud Hosting)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 3: Manual Deployment

```bash
# Run deployment script
./scripts/deploy.sh

# Start production server
npm start
```

## 📋 Pre-Deployment Checklist

- [ ] Database URL configured
- [ ] NextAuth secret generated
- [ ] Ollama models pulled (llama3.1, llava, nomic-embed-text)
- [ ] Environment variables set
- [ ] SSL certificates (for production)

## 🔧 Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Optional (Local AI)
OLLAMA_BASE_URL="http://localhost:11434"
NEXT_PUBLIC_OLLAMA_URL="http://localhost:11434"

# Optional (AWS S3 for file storage)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="..."
AWS_REGION="..."
```

## 🗄️ Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed database
npx prisma db seed
```

## 🤖 Ollama Setup (for Local AI)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull required models
ollama pull llama3.1
ollama pull llava
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

## 📊 Monitoring

- Health check: `GET /api/health`
- AI status: `GET /api/ai/local/status`
- System stats: `GET /api/admin/system-health`

## 🔒 Security Notes

- Change default passwords
- Enable HTTPS in production
- Set up firewall rules
- Regular database backups
- Update dependencies regularly

## 📞 Support

For deployment issues, check:
1. `PRODUCTION_BUILD.md` for detailed instructions
2. Docker logs: `docker-compose logs -f app`
3. Prisma logs: `npx prisma migrate status`

---

**Version**: 1.1.0
**Last Updated**: 2026-03-13
