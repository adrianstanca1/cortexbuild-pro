import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Update rate limit
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

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await prisma.organizationRateLimit.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rate limit not found' }, { status: 404 });
    }

    const body = await request.json();
    const { endpoint, requestsPerMinute, requestsPerHour, requestsPerDay, burstSize } = body;

    const rateLimit = await prisma.organizationRateLimit.update({
      where: { id: id },
      data: {
        ...(endpoint !== undefined && { endpoint }),
        ...(requestsPerMinute !== undefined && { requestsPerMinute }),
        ...(requestsPerHour !== undefined && { requestsPerHour }),
        ...(requestsPerDay !== undefined && { requestsPerDay }),
        ...(burstSize !== undefined && { burstSize }),
      },
    });

    return NextResponse.json(rateLimit);
  } catch (error) {
    console.error('Update rate limit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete rate limit
export async function DELETE(
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

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await prisma.organizationRateLimit.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rate limit not found' }, { status: 404 });
    }

    await prisma.organizationRateLimit.delete({ where: { id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rate limit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
