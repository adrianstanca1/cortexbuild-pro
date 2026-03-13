import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      project: {
        organizationId: session.user.organizationId
      }
    };

    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const workPackages = await prisma.workPackage.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        responsibleParty: { select: { id: true, name: true, email: true } },
        costCode: { select: { id: true, code: true, name: true } },
        tasks: { select: { id: true, title: true, status: true } },
        createdBy: { select: { id: true, name: true } },
        _count: {
          select: {
            tasks: true,
            productionLogs: true
          }
        }
      },
      orderBy: [{ projectId: 'asc' }, { number: 'asc' }]
    });

    return NextResponse.json(workPackages);
  } catch (error) {
    console.error('Error fetching work packages:', error);
    return NextResponse.json({ error: 'Failed to fetch work packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, description, scope, deliverables, budgetAmount, plannedStartDate, plannedEndDate, responsiblePartyId, costCodeId, predecessors, isCriticalPath } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: 'Project ID and name are required' }, { status: 400 });
    }

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get next work package number
    const lastWP = await prisma.workPackage.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' }
    });
    const nextNumber = (lastWP?.number || 0) + 1;

    const workPackage = await prisma.workPackage.create({
      data: {
        number: nextNumber,
        name,
        description,
        scope,
        deliverables: deliverables || [],
        budgetAmount: budgetAmount || 0,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        responsiblePartyId: responsiblePartyId || null,
        costCodeId: costCodeId || null,
        predecessors: predecessors || [],
        isCriticalPath: isCriticalPath || false,
        projectId,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        responsibleParty: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'work_package_created',
        entityType: 'WorkPackage',
        entityId: workPackage.id,
        entityName: workPackage.name,
        details: `Created work package WP-${workPackage.number}`,
        userId: session.user.id,
        projectId
      }
    });

    // Broadcast event
    broadcastToOrganization(session.user.organizationId, {
      type: 'work_package_created',
      data: workPackage
    });

    return NextResponse.json(workPackage, { status: 201 });
  } catch (error) {
    console.error('Error creating work package:', error);
    return NextResponse.json({ error: 'Failed to create work package' }, { status: 500 });
  }
}
