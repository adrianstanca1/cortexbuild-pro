# ============================================
# CortexBuild Pro - Production Dockerfile
# ============================================
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY nextjs_space/package.json ./
RUN yarn install --production=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ .

# Generate Prisma client
RUN yarn prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set dummy env vars for build (replaced at runtime)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG NEXTAUTH_SECRET="build-time-secret"
ARG NEXTAUTH_URL="http://localhost:3000"

RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install openssl for Prisma
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create uploads directory
RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
