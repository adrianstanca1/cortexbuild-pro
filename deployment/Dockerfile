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

# Copy package files
COPY nextjs_space/package.json ./
COPY nextjs_space/prisma ./prisma

# Create empty yarn.lock to satisfy Next.js check
RUN touch yarn.lock

# Clean install dependencies with npm (fresh start)
# Use --legacy-peer-deps for compatibility with some packages
RUN npm install --legacy-peer-deps

# Generate Prisma Client with correct output path for node_modules
RUN ./node_modules/.bin/prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ ./

# Create yarn.lock to satisfy Next.js check
RUN touch yarn.lock

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

# Create uploads directory
RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime environment variables should be set via docker-compose or docker run
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, etc.

CMD ["node", "app/server.js"]
