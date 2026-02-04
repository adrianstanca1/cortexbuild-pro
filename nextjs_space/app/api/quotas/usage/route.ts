import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get current usage statistics
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const quotas = await prisma.organizationQuota.findMany({
      where: { organizationId: user.organizationId },
    });

    const usage = quotas.map(quota => ({
      resource: quota.resource,
      used: quota.used,
      limit: quota.limit,
      percentage: quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0,
      remaining: quota.limit - quota.used,
    }));

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Get quota usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
