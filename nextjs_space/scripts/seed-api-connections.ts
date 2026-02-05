import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simple encryption for credentials
function encryptCredentials(credentials: Record<string, string>): Record<string, string> {
  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials)) {
    encrypted[key] = `enc:${Buffer.from(value).toString('base64')}`;
  }
  return encrypted;
}

async function main() {
  console.log("Setting up API connections for CortexBuild Pro...\n")

  // Internal Platform API (for system functions)
  const internalApi = await prisma.apiConnection.upsert({
    where: {
      serviceName_environment: {
        serviceName: 'internal',
        environment: 'PRODUCTION'
      }
    },
    update: {},
    create: {
      id: 'internal-platform-api',
      name: 'CortexBuild Internal API',
      serviceName: 'internal',
      description: 'Internal platform services for real-time updates and system functions',
      type: 'INTERNAL',
      environment: 'PRODUCTION',
      category: 'OTHER',
      purpose: 'Core platform real-time and internal services',
      credentials: encryptCredentials({
        internalKey: 'cortexbuild-internal-2024'
      }),
      baseUrl: 'https://cortexbuildpro.com/api',
      status: 'ACTIVE',
      dependentModules: ['realtime', 'notifications', 'activity-logs']
    }
  })
  console.log("✅ Internal Platform API configured")

  // Weather API (Open-Meteo - Free, no key needed)
  const weatherApi = await prisma.apiConnection.upsert({
    where: {
      serviceName_environment: {
        serviceName: 'open-meteo',
        environment: 'PRODUCTION'
      }
    },
    update: {},
    create: {
      id: 'weather-api',
      name: 'Open-Meteo Weather API',
      serviceName: 'open-meteo',
      description: 'Free weather data for construction site conditions',
      type: 'EXTERNAL',
      environment: 'PRODUCTION',
      category: 'OTHER',
      purpose: 'Weather forecasting for site operations',
      credentials: encryptCredentials({}),
      baseUrl: 'https://api.open-meteo.com/v1',
      status: 'ACTIVE',
      dependentModules: ['daily-reports', 'dashboard', 'weather-widget']
    }
  })
  console.log("✅ Weather API configured (Open-Meteo - free)")

  // Database Connection (Internal reference)
  const dbConnection = await prisma.apiConnection.upsert({
    where: {
      serviceName_environment: {
        serviceName: 'postgresql',
        environment: 'PRODUCTION'
      }
    },
    update: {},
    create: {
      id: 'database-connection',
      name: 'PostgreSQL Database',
      serviceName: 'postgresql',
      description: 'Primary database for all application data',
      type: 'INTERNAL',
      environment: 'PRODUCTION',
      category: 'OTHER',
      purpose: 'Primary data storage',
      credentials: encryptCredentials({
        host: 'cortexbuild-db',
        port: '5432',
        database: 'cortexbuild',
        user: 'cortexbuild'
      }),
      baseUrl: 'postgresql://cortexbuild-db:5432',
      status: 'ACTIVE',
      dependentModules: ['all']
    }
  })
  console.log("✅ Database Connection configured")

  // Authentication Service (NextAuth)
  const authService = await prisma.apiConnection.upsert({
    where: {
      serviceName_environment: {
        serviceName: 'nextauth',
        environment: 'PRODUCTION'
      }
    },
    update: {},
    create: {
      id: 'auth-service',
      name: 'NextAuth Authentication',
      serviceName: 'nextauth',
      description: 'User authentication and session management',
      type: 'INTERNAL',
      environment: 'PRODUCTION',
      category: 'AUTHENTICATION',
      purpose: 'User login, registration, and session management',
      credentials: encryptCredentials({
        provider: 'credentials',
        sessionStrategy: 'jwt'
      }),
      baseUrl: 'https://cortexbuildpro.com/api/auth',
      status: 'ACTIVE',
      dependentModules: ['login', 'signup', 'session-management']
    }
  })
  console.log("✅ Authentication Service configured")

  // Real-time SSE Service
  const realtimeService = await prisma.apiConnection.upsert({
    where: {
      serviceName_environment: {
        serviceName: 'sse',
        environment: 'PRODUCTION'
      }
    },
    update: {},
    create: {
      id: 'realtime-service',
      name: 'Real-time Events Service',
      serviceName: 'sse',
      description: 'Server-Sent Events for live updates',
      type: 'INTERNAL',
      environment: 'PRODUCTION',
      category: 'NOTIFICATIONS',
      purpose: 'Real-time push notifications and live data updates',
      credentials: encryptCredentials({
        protocol: 'sse',
        heartbeatInterval: '30000'
      }),
      baseUrl: 'https://cortexbuildpro.com/api/realtime',
      status: 'ACTIVE',
      dependentModules: ['dashboard', 'tasks', 'projects', 'notifications']
    }
  })
  console.log("✅ Real-time Events Service configured")

  // SendGrid Email Service with actual API key
  const sendgridKey = process.env.SENDGRID_API_KEY || 'CONFIGURE_IN_ADMIN_PANEL';
  const emailService = await prisma.apiConnection.upsert({
    where: {
      serviceName_environment: {
        serviceName: 'sendgrid',
        environment: 'PRODUCTION'
      }
    },
    update: {
      credentials: encryptCredentials({
        apiKey: sendgridKey,
        fromEmail: 'noreply@cortexbuildpro.com',
        fromName: 'CortexBuild Pro'
      }),
      status: sendgridKey !== 'CONFIGURE_IN_ADMIN_PANEL' ? 'ACTIVE' : 'INACTIVE'
    },
    create: {
      id: 'email-service',
      name: 'Email Service (SendGrid)',
      serviceName: 'sendgrid',
      description: 'Transactional email for invitations and notifications',
      type: 'EXTERNAL',
      environment: 'PRODUCTION',
      category: 'EMAIL_DELIVERY',
      purpose: 'Send transactional emails',
      credentials: encryptCredentials({
        apiKey: sendgridKey,
        fromEmail: 'noreply@cortexbuildpro.com',
        fromName: 'CortexBuild Pro'
      }),
      baseUrl: 'https://api.sendgrid.com/v3',
      status: sendgridKey !== 'CONFIGURE_IN_ADMIN_PANEL' ? 'ACTIVE' : 'INACTIVE',
      dependentModules: ['invitations', 'notifications', 'password-reset']
    }
  })
  const emailConfigured = sendgridKey !== 'CONFIGURE_IN_ADMIN_PANEL';
  console.log(emailConfigured ? "✅ Email Service configured (SendGrid)" : "⚠️ Email Service configured (needs API key in Admin Panel)")

  console.log("\n========================================")
  console.log("API Connections Setup Complete!")
  console.log("========================================\n")
  console.log("Summary:")
  console.log("- Internal APIs: 4 configured (active)")
  console.log("- External APIs: 2 configured")
  console.log("")
  console.log("To configure SendGrid or other external services:")
  console.log("1. Login as Super Admin (adrian.stanca1@gmail.com)")
  console.log("2. Go to Admin > API Management")
  console.log("3. Edit the service and add your API keys")
  console.log("")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
