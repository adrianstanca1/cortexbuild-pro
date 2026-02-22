import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';
import {
  getOrganizationContext,
  parseQueryParams,
  successResponse,
  errorResponse,
  withErrorHandler,
} from '@/lib/api-utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export const GET = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const { projectId, status } = parseQueryParams(request);

  // Get all project IDs for the organization
  const projects = await prisma.project.findMany({
    where: { organizationId: context!.organizationId },
    select: { id: true }
  });
  const projectIds = projects.map(p => p.id);

  const changeOrders = await prisma.changeOrder.findMany({
    where: {
      projectId: projectId ? { equals: projectId } : { in: projectIds },
      ...(status && { status: status as any })
    },
    include: {
      project: { select: { id: true, name: true, budget: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return successResponse(changeOrders);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const body = await request.json();
  const { title, description, projectId, reason, costChange, scheduleChange } = body;

  if (!title || !projectId) {
    return errorResponse('BAD_REQUEST', 'Title and project are required');
  }

  // Get project budget and next CO number
  const [project, lastCO] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { budget: true }
    }),
    prisma.changeOrder.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' }
    })
  ]);

  const nextNumber = (lastCO?.number || 0) + 1;
  const originalBudget = project?.budget || 0;
  const revisedBudget = originalBudget + (costChange || 0);

  const changeOrder = await prisma.changeOrder.create({
    data: {
      number: nextNumber,
      title,
      description,
      projectId,
      reason,
      costChange: costChange || 0,
      scheduleChange: scheduleChange || null,
      originalBudget,
      revisedBudget,
      requestedById: context!.userId,
      status: 'DRAFT'
    },
    include: {
      project: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true } }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: 'created',
      entityType: 'change_order',
      entityId: changeOrder.id,
      entityName: `CO #${changeOrder.number}: ${changeOrder.title}`,
      details: `Cost change: $${costChange || 0}`,
      userId: context!.userId,
      projectId
    }
  });

  // Get organization for broadcasting
  const projectData = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });

  if (projectData?.organizationId) {
    broadcastToOrganization(projectData.organizationId, {
      type: 'change_order_created',
      payload: {
        ...changeOrder,
        requestedByName: context!.userName
      },
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json(changeOrder, { status: 201 });
});
