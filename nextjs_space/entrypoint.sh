#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting Production Entrypoint Automation..."

# Run migrations if DATABASE_URL is present
if [ -n "$DATABASE_URL" ]; then
    echo "Synchronizing database schema (Prisma)..."
    # Skip generate if it's already done in build, but check if needed
    npx prisma migrate deploy || echo "Migration failed or already applied"
else
    echo "WARNING: DATABASE_URL not set, skipping migrations"
fi

# Sync static assets to shared volume for Nginx
if [ -d "/app/.next/static" ] && [ -d "/app/shared_static" ]; then
    echo "Synchronizing static assets to shared volume..."
    # Clean old assets to prevent accumulation (optional, but good for cleanliness)
    # rm -rf /app/shared_static/* 
    # Use -a to preserve attributes, -u to update only new/changed files
    cp -ru /app/.next/static/* /app/shared_static/
    echo "Static assets synced."
else
    echo "WARNING: Static asset directories not found, skipping sync."
fi

echo "Launching Integrated Production Server..."
# Start the custom production server
exec node production-server.js
