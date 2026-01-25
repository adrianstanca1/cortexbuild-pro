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

### Authentication & Security

- Role-based authentication (NextAuth.js)
- Google OAuth integration
- Multi-factor authentication support
- Secure session management

### Real-time Collaboration

- WebSocket-based real-time updates
- Live task collaboration
- Instant messaging between team members
- Online user presence indicators
- Real-time notifications
- Live project status updates

### Technical Features

- Real-time updates via WebSocket (Socket.IO)
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

1. Install dependencies:

```bash
yarn install
```

1. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

1. Run database migrations:

```bash
yarn prisma generate
yarn prisma db push
```

1. Seed the database (optional):

```bash
yarn prisma db seed
```

1. Start the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3000"
```

### Optional Integrations

#### Google OAuth Setup (Optional)
To enable Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env` file

If Google OAuth is not configured, users can still authenticate using email/password.

#### SendGrid Email Service (Optional)
SendGrid is used for sending email invitations, notifications, and password resets.

**Option 1: Configure via Admin Dashboard** (Recommended)
1. Log in as a Super Admin
2. Navigate to Admin Console > API Management
3. Click "Add Connection" for SendGrid
4. Enter your SendGrid API Key and sender details
5. Test the connection

**Option 2: Alternative Email Provider**
The system automatically falls back to Abacus AI email service if SendGrid is not configured and `ABACUSAI_API_KEY` is set in your environment.

To get a SendGrid API Key:
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Go to Settings > API Keys
3. Create a new API key with "Mail Send" permissions
4. Configure it in the Admin Dashboard

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

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn prisma generate` - Generate Prisma client
- `yarn prisma db push` - Push schema to database

## License

Proprietary - All rights reserved.

## Contact

For support or inquiries, please contact the development team.
