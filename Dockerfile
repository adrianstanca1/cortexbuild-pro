# ============================================================
# CortexBuild Pro - Frontend Dockerfile
# ============================================================
# Multi-stage build for production deployment
# Builds the Vite React app and serves via nginx
# ============================================================

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat || true

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source files
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL=https://api.cortexbuildpro.com/api
ARG VITE_WS_URL=wss://api.cortexbuildpro.com/live

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built files from build stage
COPY --from=build /app/dist .

# Copy custom nginx configuration (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx configuration for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api { \
        proxy_pass https://api.cortexbuildpro.com; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    location /socket.io { \
        proxy_pass https://api.cortexbuildpro.com; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]