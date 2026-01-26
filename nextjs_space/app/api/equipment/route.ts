export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth-helpers';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: any = { organizationId: session.user.organizationId };
    if (status) where.status = status;
    if (category) where.category = category;

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        currentProject: { select: { id: true, name: true } },
        _count: { select: { maintenanceLogs: true, usageLogs: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { name, equipmentNumber, category, manufacturer, model, serialNumber, purchaseDate, purchaseCost, notes, nextServiceDate } = body;

    const equipment = await prisma.equipment.create({
      data: {
        name,
        equipmentNumber,
        category,
        manufacturer,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost,
        notes,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        organizationId: session.user.organizationId!
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'added',
        entityType: 'equipment',
        entityId: equipment.id,
        entityName: equipment.name,
        userId: session.user.id
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(session.user.organizationId!, {
      type: 'equipment_added',
      payload: { id: equipment.id, name: equipment.name, category: equipment.category }
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Equipment number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}
