// Rate limiting middleware
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function rateLimit(
  organizationId: string,
  endpoint: string,
  userId?: string
): Promise<{ allowed: boolean; limit?: number; remaining?: number; resetAt?: Date }> {
  try {
    // Get rate limit config for this org and endpoint
    const config = await prisma.organizationRateLimit.findFirst({
      where: {
        organizationId,
        OR: [
          { endpoint },
          { endpoint: '*' }
        ],
        isActive: true
      },
      orderBy: { endpoint: 'desc' } // Specific endpoint takes precedence
    });

    if (!config) {
      return { allowed: true };
    }

    const now = new Date();
    
    // Check each window (minute, hour, day)
    const windows = [
      { type: 'minute', limit: config.requestsPerMinute, duration: 60 },
      { type: 'hour', limit: config.requestsPerHour, duration: 3600 },
      { type: 'day', limit: config.requestsPerDay, duration: 86400 }
    ];

    for (const window of windows) {
      const windowStart = new Date(now.getTime() - window.duration * 1000);
      
      // Get usage count for this window
      const usage = await prisma.rateLimitUsage.findFirst({
        where: {
          rateLimitId: config.id,
          endpoint,
          windowType: window.type,
          windowStart: { gte: windowStart },
          ...(userId && { userId })
        }
      });

      const currentCount = usage?.requestCount || 0;
      
      if (currentCount >= window.limit) {
        return {
          allowed: false,
          limit: window.limit,
          remaining: 0,
          resetAt: new Date(windowStart.getTime() + window.duration * 1000)
        };
      }
    }

    // Increment usage
    await incrementUsage(config.id, endpoint, userId);

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true }; // Fail open
  }
}

async function incrementUsage(rateLimitId: string, endpoint: string, userId?: string) {
  const now = new Date();
  
  for (const windowType of ['minute', 'hour', 'day']) {
    const duration = windowType === 'minute' ? 60 : windowType === 'hour' ? 3600 : 86400;
    const windowStart = new Date(Math.floor(now.getTime() / (duration * 1000)) * duration * 1000);
    
    await prisma.rateLimitUsage.upsert({
      where: {
        rateLimitId_windowType_windowStart: {
          rateLimitId,
          windowType,
          windowStart
        }
      },
      create: {
        rateLimitId,
        endpoint,
        windowType,
        windowStart,
        requestCount: 1,
        ...(userId && { userId })
      },
      update: {
        requestCount: { increment: 1 }
      }
    });
  }
}

export function rateLimitMiddleware(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return handler(req, context);
    }

    const user = session.user as { organizationId?: string; id: string };
    if (!user.organizationId) {
      return handler(req, context);
    }

    const endpoint = req.nextUrl.pathname;
    const result = await rateLimit(user.organizationId, endpoint, user.id);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: result.limit,
          resetAt: result.resetAt
        },
        { status: 429 }
      );
    }

    return handler(req, context);
  };
}
