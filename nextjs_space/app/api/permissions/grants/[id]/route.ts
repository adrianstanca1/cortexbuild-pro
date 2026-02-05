import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Revoke a permission
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

    const existing = await prisma.permissionGrant.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Permission grant not found' }, { status: 404 });
    }

    await prisma.permissionGrant.delete({ where: { id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke permission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
