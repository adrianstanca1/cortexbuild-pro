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

  const submittals = await prisma.submittal.findMany({
    where: {
      projectId: projectId ? { equals: projectId } : { in: projectIds },
      ...(status && { status: status as never })
    },
    include: {
      project: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { attachments: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return successResponse(submittals);
});

export const POST = withAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  const { title, description, projectId, dueDate, specSection } = body;

  if (!title || !projectId) {
    return errorResponse('BAD_REQUEST', 'Title and project are required');
  }

  // Get next submittal number for this project
  const lastSubmittal = await prisma.submittal.findFirst({
    where: { projectId },
    orderBy: { number: 'desc' }
  });
  const nextNumber = (lastSubmittal?.number || 0) + 1;

  const submittal = await prisma.submittal.create({
    data: {
      number: nextNumber,
      title,
      description,
      projectId,
      specSection,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'DRAFT'
    },
    include: {
      project: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, name: true } }
    }
  });

  await logAndBroadcast(
    context,
    'created',
    'submittal',
    { ...submittal, name: `Submittal #${submittal.number}: ${submittal.title}` },
    projectId
  );

  return successResponse(submittal, 'Submittal created successfully');
});
