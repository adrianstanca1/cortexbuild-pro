#!/bin/bash

# BuildPro Deployment Script

echo "🚀 Starting Deployment..."

# 1. Frontend Deployment (Vercel)
echo "🌐 Deploying Frontend..."
if command -v vercel &> /dev/null; then
    npx vercel --prod
else
    echo "⚠️  Vercel CLI not found. Skipping frontend."
fi

# 2. Backend Deployment (Cloud Run)
echo "⚙️  Deploying Backend..."
if command -v gcloud &> /dev/null; then
    # Submit build with unique tag
    TAG="gcr.io/gen-lang-client-0994038290/server:$(date +%s)"
    gcloud builds submit --tag "$TAG" server/
    
    # Deploy with new tag and extended timeout
    gcloud run deploy buildpro-app \
      --image "$TAG" \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --timeout 300 \
      --set-env-vars "SUPABASE_URL=https://zpbuvuxpfemldsknerew.supabase.co,SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNDMxNywiZXhwIjoyMDcxNjkwMzE3fQ.gY8kq22SiOxULPdpdhf-sz-C7V9hC2ZtPy5003UYsik,DATABASE_TYPE=mysql,DB_HOST=auth-db2112.hstgr.io,DB_USER=u875310796_admin,DB_PASSWORD=Cumparavinde1.,DB_NAME=u875310796_cortexbuildpro,DB_PORT=3306,NODE_ENV=production"
else
    echo "⚠️  gcloud CLI not found. Skipping backend."
fi

echo "✅  Deployment script finished."
