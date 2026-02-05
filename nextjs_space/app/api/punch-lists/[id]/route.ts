export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const punchList = await prisma.punchList.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        photos: true
      }
    });

    if (!punchList) {
      return NextResponse.json({ error: 'Punch list not found' }, { status: 404 });
    }

    if (punchList.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(punchList);
  } catch (error) {
    console.error('Error fetching punch list:', error);
    return NextResponse.json({ error: 'Failed to fetch punch list' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.punchList.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Punch list not found' }, { status: 404 });
    }

    if (existing.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { status, priority, assignedToId, description, location, category, dueDate } = body;

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
      if (status === 'VERIFIED') {
        updateData.verifiedAt = new Date();
        updateData.verifiedById = session.user.id;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (category !== undefined) updateData.category = category;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const punchList = await prisma.punchList.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(existing.project.organizationId, {
      type: 'punch_list_updated',
      payload: {
        id: punchList.id,
        title: punchList.title,
        status: punchList.status,
        projectName: punchList.project.name
      }
    });

    return NextResponse.json(punchList);
  } catch (error) {
    console.error('Error updating punch list:', error);
    return NextResponse.json({ error: 'Failed to update punch list' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'COMPANY_OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const punchList = await prisma.punchList.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!punchList) {
      return NextResponse.json({ error: 'Punch list not found' }, { status: 404 });
    }

    if (punchList.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.punchList.delete({ where: { id } });

    // Broadcast real-time event
    broadcastToOrganization(punchList.project.organizationId, {
      type: 'punch_list_deleted',
      payload: { id: punchList.id, title: punchList.title }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting punch list:', error);
    return NextResponse.json({ error: 'Failed to delete punch list' }, { status: 500 });
  }
}
