# CortexBuild Pro - Phase 2 Production Build

## Completed Features

### 1. PWA / Offline Support
- **Files**: `public/manifest.json`, `public/sw.ts`, `lib/sw-register.ts`
- **Features**: Service worker, IndexedDB sync queue, offline mutation support
- **API**: `useOffline()` hook for online/offline state

### 2. Local AI Infrastructure
- **Files**: `lib/ai/ollama-client.ts`, `lib/ai/local-ai-adapter.ts`
- **Models**: Llama 3.1 (chat), LLaVA (vision), nomic-embed-text (embeddings)
- **API**: `/api/ai/local/status`, `/api/ai/vision/analyze`
- **Features**: Hybrid AI (local first, cloud fallback)

### 3. Document OCR Pipeline
- **Files**: `lib/ai/document-processor.ts`
- **Database**: `DocumentAnalysis` model
- **Features**: Vision-based document extraction with structured JSON output

### 4. Offline Sync System
- **Files**: `lib/offline/db.ts`, `lib/offline/sync-queue.ts`, `hooks/use-offline.ts`
- **Features**: IndexedDB queue, automatic sync on reconnect, retry logic

### 5. Geofencing System
- **Files**: `lib/geo/geofence.ts`, `lib/geo/location-tracker.ts`
- **Database**: `SiteBoundary`, `LocationEvent` models
- **API**: `/api/site-access/geofence/check`
- **Features**: Polygon geofences, radius fallback, location tracking

### 6. Analytics Dashboard
- **Files**: `lib/analytics/project-health.ts`, `app/(dashboard)/analytics/`
- **API**: `/api/analytics/overview`, `/api/analytics/projects/[id]/health`
- **Features**: Project health scoring (safety, compliance, progress, budget)

### 7. AI Settings Page
- **Files**: `app/(dashboard)/settings/ai/`
- **Features**: Ollama connection status, model management

---

## Production Build Instructions

### Prerequisites
```bash
# 1. Install Ollama (for local AI)
brew install ollama

# 2. Pull required models
ollama pull llama3.1
ollama pull llava
ollama pull nomic-embed-text

# 3. Start Ollama server
ollama serve
```

### Database Setup
```bash
# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Environment Variables
```env
# Required
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-domain.com"

# Optional (for local AI)
OLLAMA_BASE_URL="http://localhost:11434"

# Optional (for cloud AI fallback)
OPENAI_API_KEY="sk-..."
```

### Build Commands
```bash
# Install dependencies
npm install

# Run TypeScript check
npx tsc --noEmit

# Build for production
npm run build

# Start production server
npm start
```

### Docker Build (Optional)
```bash
# Build image
docker build -t cortexbuild-pro .

# Run container
docker run -p 3000:3000 --env-file .env cortexbuild-pro
```

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/local/status` | GET | Check Ollama availability |
| `/api/ai/vision/analyze` | POST | Analyze document with vision model |
| `/api/analytics/overview` | GET | Organization analytics |
| `/api/analytics/projects/[id]/health` | GET | Project health score |
| `/api/site-access/geofence/check` | POST | Check location against geofences |

---

## Database Schema Updates

### New Models
- `DocumentAnalysis` - OCR results storage
- `SiteBoundary` - Geofence polygon data
- `LocationEvent` - GPS tracking events

### Updated Models
- `Project` - Added `latitude`, `longitude`, `boundaries`, `locationEvents`
- `Document` - Added `analyses` relation
- `User` - Added `locationEvents` relation

---

## Testing Checklist

- [ ] PWA installs correctly
- [ ] Service worker caches assets
- [ ] Offline mode queues mutations
- [ ] Ollama responds to health check
- [ ] Document upload triggers OCR
- [ ] Geofence detects site entry
- [ ] Analytics dashboard loads data
- [ ] AI settings page shows status

---

## Deployment Notes

- Build output: `next build` creates `.next/standalone/`
- Environment: Node.js 18+ required
- Memory: 2GB+ recommended for local AI
- Storage: PostgreSQL with pgvector extension for embeddings (optional)

Last Updated: 2026-03-13
Version: 1.1.0
