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

**Adding Google Sign-In Button to Login Page:**
```tsx
import { signIn } from "next-auth/react";

// Add this button to your login form
<Button
  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
  variant="outline"
  className="w-full"
>
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
  Continue with Google
</Button>
```

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
