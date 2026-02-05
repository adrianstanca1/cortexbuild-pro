import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';
import {
  getOrganizationContext,
  parseQueryParams,
  errorResponse,
  successResponse,
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
  const projectIds = projects.map((p: { id: string }) => p.id);

  const rfis = await prisma.rFI.findMany({
    where: {
      projectId: projectId ? { equals: projectId } : { in: projectIds },
      ...(status && { status: status as any })
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { attachments: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return successResponse(rfis);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const body = await request.json();
  const { subject, question, projectId, dueDate, assignedToId, specSection, drawingRef, costImpact, scheduleImpact } = body;

  if (!subject || !question || !projectId) {
    return errorResponse('BAD_REQUEST', 'Subject, question and project are required');
  }

  // Get next RFI number for this project
  const lastRFI = await prisma.rFI.findFirst({
    where: { projectId },
    orderBy: { number: 'desc' }
  });
  const nextNumber = (lastRFI?.number || 0) + 1;

  const rfi = await prisma.rFI.create({
    data: {
      number: nextNumber,
      subject,
      question,
      projectId,
      createdById: context!.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId: assignedToId || null,
      specSection: specSection || null,
      drawingRef: drawingRef || null,
      costImpact: costImpact || false,
      scheduleImpact: scheduleImpact || false,
      status: 'OPEN',
      ballInCourt: assignedToId ? 'Architect' : 'Internal'
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: 'created',
      entityType: 'rfi',
      entityId: rfi.id,
      entityName: `RFI #${rfi.number}: ${rfi.subject}`,
      userId: context!.userId,
      projectId
    }
  });

  // Get organization ID for broadcasting
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });

  if (project?.organizationId) {
    broadcastToOrganization(project.organizationId, {
      type: 'rfi_created',
      payload: {
        ...rfi,
        createdByName: context!.userName
      },
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json(rfi, { status: 201 });
});
