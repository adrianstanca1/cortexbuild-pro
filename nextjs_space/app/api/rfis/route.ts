export const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { logAndBroadcast } from '@/lib/query-builders';

export const GET = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');

  const projects = await prisma.project.findMany({
    where: { organizationId: context.organizationId },
    select: { id: true }
  });
  const projectIds = projects.map((p: { id: string }) => p.id);

  const rfis = await prisma.rFI.findMany({
    where: {
      projectId: projectId ? { equals: projectId } : { in: projectIds },
      ...(status && { status: status as never })
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

export const POST = withAuth(async (request: NextRequest, context) => {
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
      createdById: context.userId,
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

  await logAndBroadcast(
    context,
    'created',
    'rfi',
    { ...rfi, name: `RFI #${rfi.number}: ${rfi.subject}` },
    projectId
  );

  return successResponse(rfi, 'RFI created successfully');
});
