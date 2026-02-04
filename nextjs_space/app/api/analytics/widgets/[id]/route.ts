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

    const widget = await prisma.analyticsWidget.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Get analytics widget error:', error);
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

    const existing = await prisma.analyticsWidget.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, config, dashboardId, position } = body;

    const widget = await prisma.analyticsWidget.update({
      where: { id: id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(config !== undefined && { config }),
        ...(dashboardId !== undefined && { dashboardId }),
        ...(position !== undefined && { position }),
      },
    });

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Update analytics widget error:', error);
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

    const existing = await prisma.analyticsWidget.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    await prisma.analyticsWidget.delete({ where: { id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete analytics widget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
