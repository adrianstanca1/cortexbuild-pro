#!/bin/bash
# ============================================
# CortexBuild Pro - Docker Build Comparison Script
# ============================================

set -e

echo "=========================================="
echo "Docker Build Comparison"
echo "=========================================="
echo ""

# Ensure BuildKit is enabled
export DOCKER_BUILDKIT=1

cd /root/.openclaw/workspace/nextjs_space

# Clean up old images
echo "Cleaning up old test images..."
docker rmi -f cortexbuild-pro:original cortexbuild-pro:optimized 2>/dev/null || true

echo ""
echo "=========================================="
echo "Building ORIGINAL Dockerfile..."
echo "=========================================="
ORIGINAL_START=$(date +%s)
docker build -f deployment/Dockerfile -t cortexbuild-pro:original .. 2>&1 | tee /tmp/build-original.log
ORIGINAL_END=$(date +%s)
ORIGINAL_TIME=$((ORIGINAL_END - ORIGINAL_START))

echo ""
echo "=========================================="
echo "Building OPTIMIZED Dockerfile..."
echo "=========================================="
OPTIMIZED_START=$(date +%s)
docker build -f deployment/Dockerfile.optimized -t cortexbuild-pro:optimized .. 2>&1 | tee /tmp/build-optimized.log
OPTIMIZED_END=$(date +%s)
OPTIMIZED_TIME=$((OPTIMIZED_END - OPTIMIZED_START))

echo ""
echo "=========================================="
echo "Results Comparison"
echo "=========================================="
echo ""

# Get image sizes
ORIGINAL_SIZE=$(docker images cortexbuild-pro:original --format "{{.Size}}")
OPTIMIZED_SIZE=$(docker images cortexbuild-pro:optimized --format "{{.Size}}")

echo "Build Time:"
echo "  Original:  ${ORIGINAL_TIME}s"
echo "  Optimized: ${OPTIMIZED_TIME}s"
echo ""

echo "Image Size:"
echo "  Original:  ${ORIGINAL_SIZE}"
echo "  Optimized: ${OPTIMIZED_SIZE}"
echo ""

echo "Layer Count:"
echo "  Original:  $(docker history cortexbuild-pro:original | wc -l) layers"
echo "  Optimized: $(docker history cortexbuild-pro:optimized | wc -l) layers"
echo ""

# Calculate time improvement
if [ $ORIGINAL_TIME -gt 0 ]; then
    TIME_SAVED=$((ORIGINAL_TIME - OPTIMIZED_TIME))
    TIME_PCT=$((TIME_SAVED * 100 / ORIGINAL_TIME))
    echo "Time Improvement: ${TIME_SAVED}s (${TIME_PCT}%)"
fi

echo ""
echo "=========================================="
echo "Build logs saved to:"
echo "  /tmp/build-original.log"
echo "  /tmp/build-optimized.log"
echo "=========================================="
