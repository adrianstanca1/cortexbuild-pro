import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Update quota
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions - only SUPER_ADMIN and COMPANY_OWNER can update quotas' }, { status: 403 });
    }

    const existing = await prisma.organizationQuota.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 });
    }

    const body = await request.json();
    const { limit, used } = body;

    const quota = await prisma.organizationQuota.update({
      where: { id: id },
      data: {
        ...(limit !== undefined && { limit }),
        ...(used !== undefined && { used }),
      },
    });

    return NextResponse.json(quota);
  } catch (error) {
    console.error('Update quota error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
