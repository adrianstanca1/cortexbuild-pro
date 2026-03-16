import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';
import {
  getOrganizationContext,
  parseQueryParams,
  successResponse,
  errorResponse,
  withAuthHandler,
} from '@/lib/api-utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const GET = withAuthHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const { status, searchParams } = parseQueryParams(request);
  const category = searchParams.get('category');

  const where: any = { organizationId: context!.organizationId };
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

  return successResponse(equipment);
});

export const POST = withAuthHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const body = await request.json();
  const { name, equipmentNumber, category, manufacturer, model, serialNumber, purchaseDate, purchaseCost, notes, nextServiceDate } = body;

  try {
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
        organizationId: context!.organizationId!
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'added',
        entityType: 'equipment',
        entityId: equipment.id,
        entityName: equipment.name,
        userId: context!.userId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(context!.organizationId!, {
      type: 'equipment_added',
      payload: { id: equipment.id, name: equipment.name, category: equipment.category }
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('CONFLICT', 'Equipment number already exists');
    }
    throw error; // Let withErrorHandler handle other errors
  }
});

