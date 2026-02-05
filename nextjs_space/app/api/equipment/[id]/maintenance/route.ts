import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

    // Verify equipment belongs to user's organization
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      select: { organizationId: true }
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    if (equipment.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const maintenanceLogs = await prisma.equipmentMaintenanceLog.findMany({
      where: { equipmentId: id },
      include: {
        performedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { serviceDate: 'desc' }
    });

    return NextResponse.json(maintenanceLogs);
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance logs' }, { status: 500 });
  }
}

export async function POST(
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
    const { serviceDate, serviceType, description, cost, performedById } = body;

    // Verify equipment belongs to user's organization
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

    // Validate required fields
    if (!serviceDate || !serviceType) {
      return NextResponse.json(
        { error: 'Service date and type are required' },
        { status: 400 }
      );
    }

    const maintenanceLog = await prisma.$transaction(async (tx) => {
      const log = await tx.equipmentMaintenanceLog.create({
        data: {
          equipmentId: id,
          serviceDate: new Date(serviceDate),
          serviceType,
          description,
          cost: cost ? parseFloat(cost) : null,
          performedById: performedById || session.user.id
        },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Update equipment's last service date
      await tx.equipment.update({
        where: { id },
        data: { lastServiceDate: new Date(serviceDate) }
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'created',
          entityType: 'equipment_maintenance',
          entityId: log.id,
          entityName: `${equipment.name} - ${serviceType}`,
          userId: session.user.id
        }
      });

      return log;
    });

    // Broadcast real-time event
    broadcastToOrganization(equipment.organizationId, {
      type: 'maintenance_log_added',
      payload: { 
        equipmentId: id, 
        equipmentName: equipment.name,
        serviceType,
        serviceDate 
      }
    });

    return NextResponse.json(maintenanceLog, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance log:', error);
    return NextResponse.json({ error: 'Failed to create maintenance log' }, { status: 500 });
  }
}
