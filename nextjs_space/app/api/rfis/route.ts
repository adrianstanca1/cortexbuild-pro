import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';
import {
  getOrganizationContext,
  parseQueryParams,
  errorResponse,
  withAuthHandler,
} from '@/lib/api-utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


export const GET = withAuthHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const { projectId, status } = parseQueryParams(request);
  
  // Add pagination support
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {
    project: { organizationId: context!.organizationId },
    ...(projectId && { projectId }),
    ...(status && { status: status as any })
  };

  // Get RFIs with pagination
  const [rfis, totalCount] = await Promise.all([
    prisma.rFI.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { attachments: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: skip
    }),
    prisma.rFI.count({ where })
  ]);

  return NextResponse.json(bigintSafe({
    rfis,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    }
  }));
});

export const POST = withAuthHandler(async (request: NextRequest) => {
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

