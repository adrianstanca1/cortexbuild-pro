#!/bin/bash
# Setup local PostgreSQL database for development

set -e

echo "=== Setting up local PostgreSQL for CortexBuild Pro ==="

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL is installed"
else
    echo "✗ PostgreSQL not found"
    echo ""
    echo "Install PostgreSQL using one of these options:"
    echo ""
    echo "1. Homebrew (recommended):"
    echo "   /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "   brew install postgresql@16"
    echo ""
    echo "2. Postgres.app (GUI):"
    echo "   Download from https://postgresapp.com/"
    echo ""
    echo "3. EnterpriseDB installer:"
    echo "   Download from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads"
    echo ""
    exit 1
fi

# Start PostgreSQL if not running
if pgrep -x "postgres" > /dev/null; then
    echo "✓ PostgreSQL is running"
else
    echo "Starting PostgreSQL..."
    if command -v pg_ctl &> /dev/null; then
        pg_ctl -D /usr/local/var/postgresql@16 start 2>/dev/null || \
        pg_ctl -D /opt/homebrew/var/postgresql@16 start 2>/dev/null || \
        (echo "PostgreSQL data directory not found. Initialize with:" && \
         echo "  initdb /usr/local/var/postgresql@16" || \
         echo "  initdb /opt/homebrew/var/postgresql@16")
    else
        echo "Start PostgreSQL manually and re-run this script"
        exit 1
    fi
fi

# Create database
echo "Creating database 'cortexbuild'..."
createdb cortexbuild 2>/dev/null || echo "Database already exists"

# Create user
echo "Creating user 'cortexbuild'..."
psql -c "DROP USER IF EXISTS cortexbuild;" 2>/dev/null || true
psql -c "CREATE USER cortexbuild WITH PASSWORD 'cortexbuild123';" 2>/dev/null || true
psql -c "GRANT ALL PRIVILEGES ON DATABASE cortexbuild TO cortexbuild;" 2>/dev/null || true

# Update .env.local
cat > .env.local << 'EOF'
# Local PostgreSQL database
DATABASE_URL=postgresql://cortexbuild:cortexbuild123@localhost:5432/cortexbuild?schema=public
NEXTAUTH_SECRET=MlKVwMSzZh25ydHp6rFPiaxTQ2WT88nK
NEXTAUTH_URL=http://localhost:3000

# E2E Test Mode
TEST_MODE=true
NEXT_PUBLIC_TEST_MODE=true

# Ollama local LLM
OLLAMA_URL=http://localhost:11434

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EOF

echo ""
echo "✓ .env.local updated with local database URL"
echo ""
echo "=== Running database migration ==="
npx prisma db push --accept-data-loss

echo ""
echo "=== Seeding database ==="
SEED_PASSWORD="Adrian2026!" npx tsx scripts/seed.ts

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Database: postgresql://cortexbuild:cortexbuild123@localhost:5432/cortexbuild"
echo ""
echo "User accounts created:"
echo "  - adrian.stanca1@gmail.com / Adrian2026! (SUPER_ADMIN)"
echo "  - adrian@ascladdingltd.co.uk / Adrian2026! (COMPANY_OWNER)"
echo "  - john@doe.com / Adrian2026! (ADMIN)"
echo "  - sarah@cortexbuild.com / Adrian2026! (PROJECT_MANAGER)"
echo "  - mike@cortexbuild.com / Adrian2026! (FIELD_WORKER)"
echo ""
echo "Start the dev server: npm run dev"
