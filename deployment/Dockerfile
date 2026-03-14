# ============================================================
# CortexBuild Pro — Production Dockerfile
# Multi-stage build: deps → builder → runner
# ============================================================

# ------------------------------------------------------------------
# Stage 1: Base
# ------------------------------------------------------------------
FROM node:25-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ------------------------------------------------------------------
# Stage 2: Dependencies
# ------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy package files for better layer caching
COPY nextjs_space/package.json nextjs_space/package-lock.json* ./

# Install all dependencies (including devDeps needed for Prisma + build)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

# ------------------------------------------------------------------
# Stage 3: Builder
# ------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ .

# Generate Prisma client before build
RUN npx prisma generate

# Build-time env (dummy values — real values injected at runtime)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG NEXTAUTH_SECRET="build-time-secret-change-at-runtime"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG OLLAMA_URL="http://host.docker.internal:11434"
ARG OLLAMA_MODEL="qwen2.5:7b"

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV OLLAMA_URL=$OLLAMA_URL
ENV OLLAMA_MODEL=$OLLAMA_MODEL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_OUTPUT_MODE=standalone
ENV PRISMA_SKIP_INIT=true

RUN npm run build

# ------------------------------------------------------------------
# Stage 4: Production Runner
# ------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime: openssl for Prisma + wget for healthcheck
RUN apk add --no-cache openssl wget

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built artefacts
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy Prisma schema + migrations so we can run migrate deploy at startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Persist uploaded files
RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

# Run migrations then start — non-fatal migration, always launches
CMD ["/bin/sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1 | head -20 || echo 'Migration warning — starting anyway'; exec node server.js"]
