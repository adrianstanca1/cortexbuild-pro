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

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        currentProject: { select: { id: true, name: true } },
        maintenanceLogs: {
          include: { performedBy: { select: { name: true } } },
          orderBy: { serviceDate: 'desc' },
          take: 10
        },
        usageLogs: {
          include: {
            project: { select: { name: true } },
            checkedOutBy: { select: { name: true } }
          },
          orderBy: { checkOutDate: 'desc' },
          take: 10
        }
      }
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    if (equipment.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
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

    const existing = await prisma.equipment.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    if (existing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { status, currentProjectId, currentLocation, notes, nextServiceDate, lastServiceDate } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (currentProjectId !== undefined) updateData.currentProjectId = currentProjectId || null;
    if (currentLocation !== undefined) updateData.currentLocation = currentLocation;
    if (notes !== undefined) updateData.notes = notes;
    if (nextServiceDate !== undefined) updateData.nextServiceDate = nextServiceDate ? new Date(nextServiceDate) : null;
    if (lastServiceDate !== undefined) updateData.lastServiceDate = lastServiceDate ? new Date(lastServiceDate) : null;

    const equipment = await prisma.equipment.update({
      where: { id },
      data: updateData,
      include: { currentProject: { select: { id: true, name: true } } }
    });

    // Broadcast real-time event
    broadcastToOrganization(existing.organizationId, {
      type: 'equipment_updated',
      payload: { id: equipment.id, name: equipment.name, status: equipment.status }
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'COMPANY_OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const equipment = await prisma.equipment.findUnique({ where: { id } });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    if (equipment.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.equipment.delete({ where: { id } });

    // Broadcast real-time event
    broadcastToOrganization(equipment.organizationId, {
      type: 'equipment_deleted',
      payload: { id: equipment.id, name: equipment.name }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
