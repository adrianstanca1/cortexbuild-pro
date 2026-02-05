import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get organization quotas
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

    const quotas = await prisma.resourceQuota.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(quotas);
  } catch (error) {
    console.error('Get quotas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
