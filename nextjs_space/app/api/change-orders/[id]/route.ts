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

    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true, budget: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!changeOrder) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    if (changeOrder.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(changeOrder);
  } catch (error) {
    console.error('Error fetching change order:', error);
    return NextResponse.json({ error: 'Failed to fetch change order' }, { status: 500 });
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
    const { status, title, description, reason, costChange, scheduleChange } = body;

    const existingCO = await prisma.changeOrder.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true, budget: true } } }
    });

    if (!existingCO) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    if (existingCO.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (reason !== undefined) updateData.reason = reason;
    if (scheduleChange !== undefined) updateData.scheduleChange = scheduleChange;
    
    if (costChange !== undefined) {
      updateData.costChange = costChange;
      updateData.revisedBudget = (existingCO.originalBudget || 0) + costChange;
    }
    
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'APPROVED') {
        updateData.approvedAt = new Date();
        updateData.approvedById = session.user.id;
        // Update project budget
        await prisma.project.update({
          where: { id: existingCO.projectId },
          data: { budget: (existingCO.originalBudget || 0) + (existingCO.costChange || 0) }
        });
      }
      if (status === 'EXECUTED') {
        updateData.executedAt = new Date();
      }
    }

    const changeOrder = await prisma.changeOrder.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: status ? `status_changed_to_${status.toLowerCase()}` : 'updated',
        entityType: 'change_order',
        entityId: changeOrder.id,
        entityName: `CO #${changeOrder.number}: ${changeOrder.title}`,
        userId: session.user.id,
        projectId: changeOrder.projectId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(existingCO.project.organizationId, {
      type: 'change_order_updated',
      payload: {
        ...changeOrder,
        updatedByName: session.user.name
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(changeOrder);
  } catch (error) {
    console.error('Error updating change order:', error);
    return NextResponse.json({ error: 'Failed to update change order' }, { status: 500 });
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

    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!changeOrder) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    if (changeOrder.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow deletion of draft/rejected COs
    if (!['DRAFT', 'REJECTED'].includes(changeOrder.status)) {
      return NextResponse.json({ error: 'Can only delete draft or rejected change orders' }, { status: 400 });
    }

    await prisma.changeOrder.delete({ where: { id } });

    // Broadcast deletion
    broadcastToOrganization(changeOrder.project.organizationId, {
      type: 'change_order_deleted',
      payload: { id, number: changeOrder.number, title: changeOrder.title },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting change order:', error);
    return NextResponse.json({ error: 'Failed to delete change order' }, { status: 500 });
  }
}
