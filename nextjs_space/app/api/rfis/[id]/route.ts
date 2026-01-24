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

    const rfi = await prisma.rFI.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        answeredBy: { select: { id: true, name: true, email: true } },
        attachments: true
      }
    });

    if (!rfi) {
      return NextResponse.json({ error: 'RFI not found' }, { status: 404 });
    }

    if (rfi.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(rfi);
  } catch (error) {
    console.error('Error fetching RFI:', error);
    return NextResponse.json({ error: 'Failed to fetch RFI' }, { status: 500 });
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
    const { answer, status, assignedToId, dueDate, costImpact, scheduleImpact } = body;

    const existingRFI = await prisma.rFI.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existingRFI) {
      return NextResponse.json({ error: 'RFI not found' }, { status: 404 });
    }

    if (existingRFI.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {};
    if (answer !== undefined) {
      updateData.answer = answer;
      updateData.answeredById = session.user.id;
      updateData.answeredAt = new Date();
      if (!status) updateData.status = 'ANSWERED';
    }
    if (status) {
      updateData.status = status;
      if (status === 'CLOSED') updateData.closedAt = new Date();
    }
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (costImpact !== undefined) updateData.costImpact = costImpact;
    if (scheduleImpact !== undefined) updateData.scheduleImpact = scheduleImpact;

    const rfi = await prisma.rFI.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        answeredBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    const actionType = answer ? 'answered' : 'updated';
    await prisma.activityLog.create({
      data: {
        action: actionType,
        entityType: 'rfi',
        entityId: rfi.id,
        entityName: `RFI #${rfi.number}: ${rfi.subject}`,
        userId: session.user.id,
        projectId: rfi.projectId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(existingRFI.project.organizationId, {
      type: 'rfi_updated',
      payload: {
        ...rfi,
        updatedByName: session.user.name
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(rfi);
  } catch (error) {
    console.error('Error updating RFI:', error);
    return NextResponse.json({ error: 'Failed to update RFI' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'PROJECT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const rfi = await prisma.rFI.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!rfi) {
      return NextResponse.json({ error: 'RFI not found' }, { status: 404 });
    }

    if (rfi.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.rFI.delete({ where: { id } });

    // Broadcast deletion
    broadcastToOrganization(rfi.project.organizationId, {
      type: 'rfi_deleted',
      payload: { id, number: rfi.number, subject: rfi.subject },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting RFI:', error);
    return NextResponse.json({ error: 'Failed to delete RFI' }, { status: 500 });
  }
}
