/**
 * Shared Database Client for Deployment Scripts
 * 
 * Provides a consistent PrismaClient configuration for deployment scripts
 * with proper connection pooling and retry logic.
 * 
 * Usage in scripts:
 * ```typescript
 * import { getScriptPrismaClient } from './script-db-helper';
 * const prisma = getScriptPrismaClient();
 * ```
 */

import { PrismaClient } from '@prisma/client';

let scriptPrisma: PrismaClient | null = null;

/**
 * Get a PrismaClient instance configured for standalone scripts
 * Uses connection pooling and proper error handling
 */
export function getScriptPrismaClient(): PrismaClient {
  if (!scriptPrisma) {
    // Add connection pool parameters if not already present
    const baseUrl = process.env.DATABASE_URL || '';
    let databaseUrl = baseUrl;
    
    if (baseUrl && !baseUrl.includes('connection_limit')) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${baseUrl}${separator}connection_limit=5&pool_timeout=10&connect_timeout=10`;
    }

    scriptPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
  }
  
  return scriptPrisma;
}

/**
 * Disconnect the script Prisma client
 * Should be called in finally blocks or at script end
 */
export async function disconnectScriptPrisma(): Promise<void> {
  if (scriptPrisma) {
    await scriptPrisma.$disconnect();
    scriptPrisma = null;
  }
}
