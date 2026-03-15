# 🚀 CortexBuild Pro - Quick Start Deployment

## Prerequisites

- Node.js 18+ installed
- Docker & Docker Compose (for Docker deployment)
- PostgreSQL database (local or cloud)

## Option 1: Docker Deployment (Recommended)

```bash
cd /Users/adrianstanca/Desktop/cortexbuild_pro/nextjs_space

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Access app at http://localhost:3000
```

## Option 2: Manual Deployment

```bash
cd /Users/adrianstanca/Desktop/cortexbuild_pro/nextjs_space

# 1. Install dependencies
npm ci

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Database setup
npx prisma migrate deploy
npx prisma generate

# 4. Build
npm run build

# 5. Start
npm start

# Access app at http://localhost:3000
```

## Option 3: Vercel Deployment

```bash
cd /Users/adrianstanca/Desktop/cortexbuild_pro/nextjs_space

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/cortexbuild"

# Auth
NEXTAUTH_SECRET="your-secret-key-min-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Local AI (Ollama)
OLLAMA_BASE_URL="http://localhost:11434"
```

## Ollama Setup (for Local AI)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3.1
ollama pull llava
ollama pull nomic-embed-text

# Start server
ollama serve
```

## Verification

Once deployed, check these endpoints:

- App: `http://localhost:3000`
- AI Status: `http://localhost:3000/api/ai/local/status`
- Analytics: `http://localhost:3000/analytics`
- AI Settings: `http://localhost:3000/settings/ai`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 busy | Change in docker-compose.yml or use `-p 3001:3000` |
| DB connection failed | Check DATABASE_URL format and network |
| Build fails | Clear `.next` and `node_modules`, run `npm ci` |
| AI not working | Ensure Ollama is running: `ollama serve` |

## Support

- Full docs: `DEPLOY.md`
- Build guide: `PRODUCTION_BUILD.md`
- Implementation plan: `docs/superpowers/plans/`
