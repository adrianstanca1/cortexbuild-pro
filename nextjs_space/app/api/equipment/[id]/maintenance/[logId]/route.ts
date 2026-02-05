import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, logId } = await params;
    const body = await request.json();

    // Verify equipment and log exist and belong to user's organization
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      select: { id: true, name: true, organizationId: true }
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    if (equipment.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existingLog = await prisma.equipmentMaintenanceLog.findUnique({
      where: { id: logId }
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Maintenance log not found' }, { status: 404 });
    }

    if (existingLog.equipmentId !== id) {
      return NextResponse.json({ error: 'Log does not belong to this equipment' }, { status: 400 });
    }

    const { serviceDate, serviceType, description, cost, performedById } = body;

    const updateData: any = {};
    if (serviceDate !== undefined) updateData.serviceDate = new Date(serviceDate);
    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (description !== undefined) updateData.description = description;
    if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null;
    if (performedById !== undefined) updateData.performedById = performedById;

    const maintenanceLog = await prisma.equipmentMaintenanceLog.update({
      where: { id: logId },
      data: updateData,
      include: {
        performedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'updated',
        entityType: 'equipment_maintenance',
        entityId: logId,
        entityName: `${equipment.name} - ${maintenanceLog.serviceType}`,
        userId: session.user.id
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(equipment.organizationId, {
      type: 'maintenance_log_updated',
      payload: { 
        equipmentId: id,
        logId,
        equipmentName: equipment.name
      }
    });

    return NextResponse.json(maintenanceLog);
  } catch {
    console.error('Error updating maintenance log:', error);
    return NextResponse.json({ error: 'Failed to update maintenance log' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'COMPANY_OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, logId } = await params;

    // Verify equipment and log exist and belong to user's organization
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      select: { id: true, name: true, organizationId: true }
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    if (equipment.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existingLog = await prisma.equipmentMaintenanceLog.findUnique({
      where: { id: logId }
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Maintenance log not found' }, { status: 404 });
    }

    if (existingLog.equipmentId !== id) {
      return NextResponse.json({ error: 'Log does not belong to this equipment' }, { status: 400 });
    }

    await prisma.equipmentMaintenanceLog.delete({
      where: { id: logId }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'deleted',
        entityType: 'equipment_maintenance',
        entityId: logId,
        entityName: `${equipment.name} - ${existingLog.serviceType}`,
        userId: session.user.id
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(equipment.organizationId, {
      type: 'maintenance_log_deleted',
      payload: { 
        equipmentId: id,
        logId,
        equipmentName: equipment.name
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    console.error('Error deleting maintenance log:', error);
    return NextResponse.json({ error: 'Failed to delete maintenance log' }, { status: 500 });
  }
}
