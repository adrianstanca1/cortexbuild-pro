# ============================================
# CortexBuild Pro - Production Dockerfile
# ============================================
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files (lock file for deterministic installs)
COPY nextjs_space/package.json nextjs_space/package-lock.json* ./
RUN npm ci --production=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ .

# Generate Prisma client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_OUTPUT_MODE=standalone
ENV PRISMA_SKIP_INIT=true

# Dummy build-time vars (replaced at runtime via docker-compose env)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG NEXTAUTH_SECRET="build-time-secret"
ARG NEXTAUTH_URL="https://cortexbuildpro.com"

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

RUN npm run build

# ── Production image ──────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Runtime dependencies
RUN apk add --no-cache openssl curl
RUN npm install -g prisma@^6.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and prisma schema
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Prepare .next dir with correct ownership
RUN mkdir -p .next && chown nextjs:nodejs .next

# Copy Next.js standalone build
# .next/standalone contains server.js at root + all dependencies
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create uploads directory
RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# FIX: Next.js standalone outputs server.js at root of standalone dir
# which gets copied to /app/server.js — NOT /app/app/server.js
CMD ["node", "server.js"]
