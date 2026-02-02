# Build stage
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and prisma schema
COPY nextjs_space/package.json ./
COPY nextjs_space/prisma ./prisma

# Create yarn.lock if it doesn't exist and install dependencies with exact versions
RUN touch yarn.lock && yarn install --frozen-lockfile || yarn install

# Generate Prisma Client (use the version from node_modules)
RUN ./node_modules/.bin/prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps (including generated Prisma client)
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ ./

# Remove any local symlinks
RUN rm -f yarn.lock && touch yarn.lock

# Set build-time environment variables
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ARG NEXTAUTH_SECRET="build-time-secret"
ARG NEXTAUTH_URL="http://localhost:3000"

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXT_OUTPUT_MODE=standalone
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_PHASE=phase-production-build

# Build the application
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

CMD ["node", "app/server.js"]
