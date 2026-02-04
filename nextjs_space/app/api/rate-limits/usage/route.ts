import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get rate limit usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    const where: any = { organizationId: user.organizationId };
    if (endpoint) {
      where.endpoint = endpoint;
    }

    const usageRecords = await prisma.rateLimitUsage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        rateLimit: true,
      },
    });

    return NextResponse.json(usageRecords);
  } catch (error) {
    console.error('Get rate limit usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
