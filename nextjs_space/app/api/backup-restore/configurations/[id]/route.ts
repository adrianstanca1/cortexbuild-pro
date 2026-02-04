import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
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

    const configuration = await prisma.backupConfiguration.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json(configuration);
  } catch (error) {
    console.error('Get backup configuration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const existing = await prisma.backupConfiguration.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, schedule, retentionDays, isEnabled, includeFiles, includeDatabase } = body;

    const configuration = await prisma.backupConfiguration.update({
      where: { id: id },
      data: {
        ...(name !== undefined && { name }),
        ...(schedule !== undefined && { schedule }),
        ...(retentionDays !== undefined && { retentionDays }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(includeFiles !== undefined && { includeFiles }),
        ...(includeDatabase !== undefined && { includeDatabase }),
      },
    });

    return NextResponse.json(configuration);
  } catch (error) {
    console.error('Update backup configuration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const existing = await prisma.backupConfiguration.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    await prisma.backupConfiguration.delete({ where: { id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete backup configuration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
