#!/bin/bash

# Bundle Analysis Script for CortexBuild Pro
# This script analyzes the production bundle size and identifies optimization opportunities

set -e

echo "🔍 CortexBuild Pro - Bundle Analysis"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build production bundle
echo "📦 Step 1: Building production bundle..."
npm run build:frontend

echo ""
echo "✅ Build complete!"
echo ""

# Step 2: Analyze dist folder
echo "📊 Step 2: Analyzing bundle size..."
echo ""

# Get total dist size
DIST_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}Total bundle size:${NC} $DIST_SIZE"

# Get gzipped size estimate
echo ""
echo "📦 Asset breakdown:"
echo "-------------------"

# List largest files
echo ""
echo "🔴 Largest files (top 10):"
find dist -type f -exec du -h {} + | sort -rh | head -n 10

# Count file types
echo ""
echo "📁 File type distribution:"
echo "  JS files: $(find dist -name "*.js" | wc -l)"
echo "  CSS files: $(find dist -name "*.css" | wc -l)"
echo "  Image files: $(find dist -name "*.png" -o -name "*.jpg" -o -name "*.svg" -o -name "*.webp" -o -name "*.gif" | wc -l)"
echo "  Other files: $(find dist -type f ! -name "*.js" ! -name "*.css" ! -name "*.png" ! -name "*.jpg" ! -name "*.svg" ! -name "*.webp" ! -name "*.gif" | wc -l)"

# Get JavaScript bundle sizes
echo ""
echo "📊 JavaScript bundles:"
find dist/assets -name "*.js" -exec du -h {} + | sort -rh

# Get CSS sizes
echo ""
echo "🎨 CSS bundles:"
find dist/assets -name "*.css" -exec du -h {} + | sort -rh

# Step 3: Recommendations
echo ""
echo "💡 Optimization Recommendations:"
echo "--------------------------------"

# Check for large bundles
LARGE_JS=$(find dist/assets -name "*.js" -size +500k)
if [ -n "$LARGE_JS" ]; then
    echo -e "${YELLOW}⚠️  Found JavaScript bundles larger than 500KB:${NC}"
    echo "$LARGE_JS"
    echo "   → Consider code splitting or lazy loading"
else
    echo -e "${GREEN}✅ No JavaScript bundles exceed 500KB${NC}"
fi

echo ""

# Check for large images
LARGE_IMAGES=$(find dist -name "*.png" -o -name "*.jpg" -size +100k)
if [ -n "$LARGE_IMAGES" ]; then
    echo -e "${YELLOW}⚠️  Found images larger than 100KB:${NC}"
    echo "$LARGE_IMAGES"
    echo "   → Consider optimizing with imagemin or using WebP"
else
    echo -e "${GREEN}✅ No large unoptimized images found${NC}"
fi

echo ""

# Check for duplicate dependencies
echo "🔍 Checking for potential duplicate dependencies..."
if [ -f "package-lock.json" ]; then
    DUPLICATES=$(npm ls 2>/dev/null | grep deduped | wc -l || echo "0")
    if [ "$DUPLICATES" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $DUPLICATES deduplicated packages${NC}"
        echo "   → Run 'npm dedupe' to reduce bundle size"
    else
        echo -e "${GREEN}✅ No duplicate dependencies detected${NC}"
    fi
fi

# Step 4: Generate detailed report
echo ""
echo "📄 Generating detailed bundle report..."

# Use vite-bundle-visualizer if available
if grep -q "vite-bundle-visualizer" package.json; then
    echo ""
    echo "🎯 To generate interactive bundle visualization, run:"
    echo "   npx vite-bundle-visualizer"
fi

echo ""
echo "✨ Analysis complete!"
echo ""
echo "📈 Summary:"
echo "-----------"
echo -e "Total size: ${GREEN}$DIST_SIZE${NC}"
echo -e "JavaScript: $(find dist/assets -name "*.js" -exec du -ch {} + | grep total | cut -f1)"
echo -e "CSS: $(find dist/assets -name "*.css" -exec du -ch {} + | grep total | cut -f1)"
echo ""
echo "💾 Estimated gzipped size: ~$(echo "$DIST_SIZE" | awk '{print $1 * 0.3}')"
echo ""

# Target recommendations
echo "🎯 Target Sizes:"
echo "  Main JS bundle: < 500KB (uncompressed), < 150KB (gzipped)"
echo "  Vendor bundle: < 600KB (uncompressed), < 180KB (gzipped)"
echo "  CSS bundle: < 150KB (uncompressed), < 20KB (gzipped)"
echo ""
