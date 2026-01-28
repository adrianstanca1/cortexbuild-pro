# ============================================
# CortexBuild Pro - Production Dockerfile
# ============================================
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl3 openssl-dev
WORKDIR /app

# Copy package files
COPY nextjs_space/package.json nextjs_space/package-lock.json ./
RUN npm ci --legacy-peer-deps

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

# Set dummy env vars for build (replaced at runtime)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG NEXTAUTH_SECRET="build-time-secret"
ARG NEXTAUTH_URL="http://localhost:3000"

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_OUTPUT_MODE=standalone
ENV PRISMA_SKIP_INIT=true

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install openssl3 (Alpine 3.23+) and dependencies for Prisma migrations
RUN apk add --no-cache openssl3 openssl-dev ca-certificates
RUN npm install -g prisma@^6.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy application files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY nextjs_space/production-server.js ./production-server.js
COPY nextjs_space/entrypoint.sh ./entrypoint.sh

# Set permissions
RUN chmod +x entrypoint.sh && \
    mkdir -p uploads && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/entrypoint.sh"]
