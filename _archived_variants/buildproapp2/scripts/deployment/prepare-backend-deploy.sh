#!/bin/bash
# Automated Backend Deployment Script
# This uploads the backend to Hostinger and prepares it for activation

set -e

echo "🚀 Starting Backend Deployment to Hostinger..."

# Step 1: Build the backend
echo "📦 Building backend..."
cd server
npm install --production
npm run build

# Step 2: Create deployment package
echo "📦 Creating deployment package..."
cd ..
mkdir -p /tmp/backend-deploy
cp -r server/dist /tmp/backend-deploy/
cp server/package.json /tmp/backend-deploy/
cp server/.env /tmp/backend-deploy/

# Step 3: Create production .env
echo "📝 Creating production .env..."
cat > /tmp/backend-deploy/.env << 'EOF'
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://zpbuvuxpfemldsknerew.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNDMxNywiZXhwIjoyMDcxNjkwMzE3fQ.gY8kq22SiOxULPdpdhf-sz-C7V9hC2ZtPy5003UYsik
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQzMTcsImV4cCI6MjA3MTY5MDMxN30.4wb8_qMaJ0hpkLEv51EWh0pRtVXD3GWWOsuCmZsOx6A
SUPABASE_JWT_SECRET=Cumparavinde1@
FILE_SIGNING_SECRET=Cumparavinde1@
GEMINI_API_KEY=REDACTED_GOOGLE_API_KEY
DATABASE_TYPE=mysql
DB_HOST=127.0.0.1
DB_USER=u875310796_admin
DB_PASSWORD=Cumparavinde1.
DB_NAME=u875310796_cortexbuildpro
DB_PORT=3306
EOF

# Step 4: Create package.json for production
cat > /tmp/backend-deploy/package.json << 'EOF'
{
  "name": "buildpro-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@google/genai": "^1.34.0",
    "@google/generative-ai": "^0.24.1",
    "@sendgrid/mail": "^8.1.6",
    "@supabase/supabase-js": "^2.89.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/ws": "^8.18.1",
    "apollo-server-express": "^3.13.0",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "express": "^4.22.1",
    "express-rate-limit": "^8.2.1",
    "graphql": "^16.12.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "multer": "^2.0.2",
    "mysql2": "^3.16.0",
    "pg": "^8.11.3",
    "sqlite": "^5.1.1",
    "sqlite3": "^5.1.7",
    "tsx": "^4.7.1",
    "uuid": "^9.0.1",
    "web-push": "^3.6.7",
    "winston": "^3.19.0",
    "ws": "^8.18.3",
    "zod": "^4.2.1",
    "typescript": "^5.9.3",
    "ts-node": "^10.9.2",
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.25",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/multer": "^2.0.0",
    "@types/node": "^20.19.27",
    "@types/pg": "^8.10.2",
    "@types/uuid": "^9.0.8",
    "nodemon": "^3.1.11"
  }
}
EOF

echo "✅ Backend package ready at /tmp/backend-deploy"
echo ""
echo "📋 Next steps:"
echo "1. Files are ready in /tmp/backend-deploy"
echo "2. You need to upload them to Hostinger"
echo "3. Then create Node.js app in hPanel pointing to these files"
echo ""
echo "Run: ./upload-backend.exp to upload files"
