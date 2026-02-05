import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = {
      project: { organizationId: session.user.organizationId }
    };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        _count: { select: { checklistItems: true, photos: true } }
      },
      orderBy: { scheduledDate: 'desc' }
    });

    return NextResponse.json(inspections);
  } catch {
    console.error('Error fetching inspections:', error);
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, inspectionType, description, scheduledDate, inspectorName, inspectorCompany, checklistItems } = body;

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: session.user.organizationId || undefined }
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get next inspection number for project
    const lastInspection = await prisma.inspection.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' }
    });
    const number = (lastInspection?.number || 0) + 1;

    const inspection = await prisma.inspection.create({
      data: {
        number,
        title,
        inspectionType,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        inspectorName,
        inspectorCompany,
        projectId,
        requestedById: session.user.id,
        checklistItems: checklistItems?.length ? {
          create: checklistItems.map((item: string, index: number) => ({
            itemText: item,
            order: index
          }))
        } : undefined
      },
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        checklistItems: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'scheduled',
        entityType: 'inspection',
        entityId: inspection.id,
        entityName: inspection.title,
        userId: session.user.id,
        projectId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(session.user.organizationId!, {
      type: 'inspection_scheduled',
      payload: {
        id: inspection.id,
        title: inspection.title,
        type: inspection.inspectionType,
        projectName: inspection.project.name
      }
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch {
    console.error('Error creating inspection:', error);
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 });
  }
}
