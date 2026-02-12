# =================================================================
# CortexBuild Pro - Production Dockerfile
# =================================================================
# Multi-stage build for optimal production image
# Uses npm for consistent dependency installation
# =================================================================

# Build stage
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules (optional, for better compatibility)
# These are already included in node:20-alpine but adding explicitly for native module builds
RUN apk add --no-cache libc6-compat || true

# Copy package files and lock file for consistent dependency resolution
COPY nextjs_space/package.json nextjs_space/package-lock.json ./
COPY nextjs_space/prisma ./prisma

# Install dependencies using lock file for reproducible builds
# Use --legacy-peer-deps for compatibility with some packages
RUN npm ci --legacy-peer-deps

# Generate Prisma Client with correct output path for node_modules
RUN ./node_modules/.bin/prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ ./

# Regenerate Prisma Client with the full source
RUN ./node_modules/.bin/prisma generate

# Set build-time environment variables (dummy values for build only)
# Real values should be provided at runtime via environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV NEXTAUTH_SECRET="build-time-placeholder-not-used-in-production"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_OUTPUT_MODE=standalone
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_PHASE=phase-production-build

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# OpenSSL is included in node:20-alpine by default
# Only install if missing (graceful handling)
RUN apk add --no-cache openssl || true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output - server.js is at /app/app/server.js in standalone mode
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./app/public

# Copy Prisma client to standalone app node_modules (critical for production)
COPY --from=builder /app/node_modules/.prisma ./app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./app/node_modules/@prisma

# Copy Prisma CLI so migrations can run inside the container with the correct version
# This must be after the standalone copy to avoid being overwritten
# Note: build/index.js is the standard Prisma CLI entry point for v6.x
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
RUN mkdir -p node_modules/.bin && ln -sf ../prisma/build/index.js node_modules/.bin/prisma

# Create uploads directory
RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime environment variables should be set via docker-compose or docker run
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, etc.

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "app/server.js"]
