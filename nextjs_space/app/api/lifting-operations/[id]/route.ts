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
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const operation = await prisma.liftingOperation.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        plannedBy: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        appointedPerson: { select: { id: true, name: true } }
      }
    });

    if (!operation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Error fetching lifting operation:', error);
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

    const data = await request.json();

    const existing = await prisma.liftingOperation.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: any = { ...data };

    // Handle status changes
    if (data.status === 'APPROVED' && existing.status === 'PLANNED') {
      updateData.supervisorSignedAt = new Date();
    }
    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Convert dates and numbers
    if (data.liftDate) updateData.liftDate = new Date(data.liftDate);
    if (data.loadWeight) updateData.loadWeight = parseFloat(data.loadWeight);
    if (data.craneCapacity) updateData.craneCapacity = parseFloat(data.craneCapacity);
    if (data.slingCapacity) updateData.slingCapacity = parseFloat(data.slingCapacity);
    if (data.liftRadius) updateData.liftRadius = parseFloat(data.liftRadius);
    if (data.liftHeight) updateData.liftHeight = parseFloat(data.liftHeight);
    if (data.windSpeedLimit) updateData.windSpeedLimit = parseFloat(data.windSpeedLimit);
    if (data.actualWindSpeed) updateData.actualWindSpeed = parseFloat(data.actualWindSpeed);

    const operation = await prisma.liftingOperation.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        plannedBy: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: data.status === 'COMPLETED' ? 'completed' : 'updated',
        entityType: 'LiftingOperation',
        entityId: operation.id,
        entityName: `Lift Plan #${operation.number}`,
        userId: session.user.id,
        projectId: operation.projectId
      }
    });

    broadcastToOrganization(existing.project.organizationId, {
      type: 'lifting_operation_updated',
      data: operation
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Error updating lifting operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
