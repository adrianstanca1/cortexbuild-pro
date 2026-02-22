# CortexBuild Pro

A comprehensive multi-tenant construction management platform built with Next.js 14, PostgreSQL, and Prisma.

## Features

### Core Modules
- **Projects** - Full project lifecycle management with templates
- **Tasks** - List, Kanban, and Gantt chart views
- **RFIs** - Request for Information tracking
- **Submittals** - Document submission workflow
- **Time Tracking** - Labour hours and productivity tracking
- **Budget Management** - Cost tracking and variance analysis
- **Safety** - Incident reporting and safety metrics
- **Daily Reports** - Site diary and progress logging
- **Documents** - File management with S3 integration
- **Team Management** - Role-based access control

### Admin Features
- Multi-organization management
- API connections and integrations
- Audit logging
- System health monitoring
- User management

### Technical Features
- Real-time updates via SSE
- Role-based authentication (NextAuth.js)
- Data export (CSV)
- Project templates
- Weather widget integration
- AI-powered assistant

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Query, Zustand
- **Charts**: Recharts
- **File Storage**: AWS S3

## Getting Started

### Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/cortex-abacus.git
cd cortex-abacus
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run database migrations:
```bash
npm run prisma generate
npm run prisma db push
```

5. Seed the database (optional):
```bash
npm run prisma db seed
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment (VPS)

For production deployment to a VPS (Virtual Private Server):

**Quick Start:**
```bash
cd /root
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment
sudo bash quick-start.sh
```

See the [Deployment Quick Start Guide](../deployment/QUICKSTART.md) for complete instructions, including:
- One-click deployment script
- Health monitoring
- Rollback capability
- SSL setup
- Backup strategies

**Documentation:**
- [Quick Start Guide](../deployment/QUICKSTART.md) - Fastest deployment method
- [Full Deployment Guide](../deployment/README.md) - Comprehensive instructions
- [CloudPanel Guide](../deployment/CLOUDPANEL-GUIDE.md) - Managed hosting option

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Project Structure

```
├── app/
│   ├── (admin)/        # Admin console pages
│   ├── (auth)/         # Authentication pages
│   ├── (company)/      # Company management
│   ├── (dashboard)/    # Main dashboard modules
│   └── api/            # API routes
├── components/
│   ├── dashboard/      # Dashboard components
│   └── ui/             # Reusable UI components
├── lib/                # Utilities and configurations
├── prisma/             # Database schema
└── scripts/            # Utility scripts
```

## API Endpoints

Key API routes include:
- `/api/projects` - Project CRUD
- `/api/tasks` - Task management
- `/api/rfis` - RFI tracking
- `/api/submittals` - Submittal workflow
- `/api/safety` - Safety incidents
- `/api/dashboard/analytics` - KPI analytics
- `/api/export` - Data export

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:db:push` - Push schema to database
- `npm run prisma:db:seed` - Seed the database
- `npm run prisma:studio` - Open Prisma Studio

## License

Proprietary - All rights reserved.

## Contact

For support or inquiries, please contact the development team.
