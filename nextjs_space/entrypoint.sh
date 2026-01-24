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

echo "Launching Integrated Production Server..."
# Start the custom production server
exec node production-server.js
