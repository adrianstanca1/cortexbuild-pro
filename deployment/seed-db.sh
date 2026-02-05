#!/bin/bash

# ============================================
# CortexBuild Pro - Database Seed Script
# ============================================

echo "Seeding database with initial data..."

docker-compose exec app sh -c "cd /app && npx prisma db seed"

echo ""
echo "Database seeded successfully!"
echo ""
echo "Default accounts created:"
echo "  Super Admin: adrian.stanca1@gmail.com"
echo "  Company Owner: adrian@ascladdingltd.co.uk"
echo ""
echo "Check scripts/seed.ts for default passwords."
