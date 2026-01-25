import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Helper to add connection pool parameters to DATABASE_URL
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  // Add connection pool settings if not already present
  if (baseUrl && !baseUrl.includes('connection_limit')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}connection_limit=5&pool_timeout=10&connect_timeout=10`;
  }
  return baseUrl;
}

let _prisma: PrismaClient;

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop, receiver) => {
    if (!_prisma) {
      if (process.env.PRISMA_SKIP_INIT === 'true') {
        return (() => { throw new Error('Prisma accessed during build-time skip phase'); }) as any;
      }

      _prisma = globalForPrisma.prisma ?? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: getDatabaseUrl()
          }
        }
      });

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = _prisma;
      }
    }

    return Reflect.get(_prisma, prop, receiver);
  }
});

// Helper function to safely execute database operations with retry and exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorMessage = lastError?.message || '';

      // Check if it's a connection error that might be recoverable
      if (
        errorMessage.includes('idle-session timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('too many connections')
      ) {
        if (attempt < maxRetries) {
          // Try to reconnect with exponential backoff
          const backoffDelay = delayMs * Math.pow(2, attempt - 1);
          try {
            await prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            await prisma.$connect();
          } catch {
            // Ignore reconnection errors, will retry the operation
          }
          continue;
        }
      }
      throw lastError;
    }
  }

  throw lastError;
}

export default prisma
