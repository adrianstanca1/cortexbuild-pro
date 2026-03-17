# Database Setup Guide

## Current Issue

The production database is hosted on Hostinger at `db-ddaacb0a0.db003.hosteddb.reai.io:5432`. This database is on Hostinger's private network and **cannot be accessed from your local machine**. The IP address `172.21.254.220` is internal to Hostinger's infrastructure.

## Solution: Local Development Database

To develop and seed the database locally, you need to install PostgreSQL on your Mac.

### Option 1: Homebrew (Recommended)

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL 16
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Run the setup script
./scripts/setup-local-db.sh
```

### Option 2: Postgres.app (GUI)

1. Download from https://postgresapp.com/
2. Install and open Postgres.app
3. Click "Initialize" for PostgreSQL 16
4. Run the setup script:
   ```bash
   export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
   ./scripts/setup-local-db.sh
   ```

### Option 3: Manual Setup

If you have PostgreSQL installed but need to set up manually:

```bash
# Create database
createdb cortexbuild

# Create user
psql -c "CREATE USER cortexbuild WITH PASSWORD 'cortexbuild123';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE cortexbuild TO cortexbuild;"

# Update .env.local
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://cortexbuild:cortexbuild123@localhost:5432/cortexbuild?schema=public
NEXTAUTH_SECRET=MlKVwMSzZh25ydHp6rFPiaxTQ2WT88nK
NEXTAUTH_URL=http://localhost:3000
TEST_MODE=true
NEXT_PUBLIC_TEST_MODE=true
OLLAMA_URL=http://localhost:11434
EOF

# Push schema and seed
npx prisma db push --accept-data-loss
SEED_PASSWORD="Adrian2026!" npx tsx scripts/seed.ts
```

## Seed Script Output

After running the seed script, the following data will be created:

### Organizations
- **CortexBuild Demo** (slug: `default`)
- **AS Cladding Ltd** (slug: `as-cladding-ltd`)

### Users (all with password: `Adrian2026!`)
| Email | Role | Organization |
|-------|------|-------------|
| adrian.stanca1@gmail.com | SUPER_ADMIN | CortexBuild Demo |
| adrian@ascladdingltd.co.uk | COMPANY_OWNER | AS Cladding Ltd |
| john@doe.com | ADMIN | CortexBuild Demo |
| sarah@cortexbuild.com | PROJECT_MANAGER | CortexBuild Demo |
| mike@cortexbuild.com | FIELD_WORKER | CortexBuild Demo |

### Sample Data
- 3 Projects (Downtown Office, Riverside Homes, Central Mall)
- 11 Tasks across projects
- 19 Cost Codes (CSI divisions)
- 5 Work Packages
- 2 Forecast Entries
- 6 Risk Register Entries
- 1 Automation Rule
- 2 Predictive Signals
- 9 API Connections configured

## Verify Setup

```bash
# Check database connection
npx tsx scripts/test-db.ts

# Start dev server
npm run dev

# Login at http://localhost:3000/login
```

## Production Deployment

For production (Vercel/Hostinger), the `.env.production` file contains the correct database URL that works within Hostinger's network.
