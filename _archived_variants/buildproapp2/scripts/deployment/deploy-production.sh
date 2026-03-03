#!/bin/bash
# Master Production Deployment Script for Hostinger

echo "🚀 Starting Full Production Deployment..."
echo "----------------------------------------"

# 1. Build Verification
echo "🔨 Step 1: Building Project..."
npm run build
cd server && npm run build && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Build Failed! Stopping deployment."
    exit 1
fi

echo "✅ Build Successful."
echo "----------------------------------------"

# 2. Backend Deployment
echo "🔙 Step 2: Deploying Backend API (AUTO)..."
./deploy-backend-auto.exp

if [ $? -ne 0 ]; then
    echo "❌ Backend Deployment Failed. Please check password and try again."
    exit 1
fi
echo "✅ Backend Deployed."
echo "----------------------------------------"

# 3. Frontend Deployment
echo "🎨 Step 3: Deploying Frontend UI (AUTO)..."
./deploy-frontend-auto.exp

if [ $? -ne 0 ]; then
    echo "❌ Frontend Deployment Failed."
    exit 1
fi

echo "----------------------------------------"
echo "🎉 FULL DEPLOYMENT COMPLETE!"
echo ""
echo "🌍 Frontend: https://cortexbuildpro.com"
echo "🔌 Backend:  https://api.cortexbuildpro.com (Might take time to resolve DNS)"
