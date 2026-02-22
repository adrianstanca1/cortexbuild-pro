import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const workPackage = await prisma.workPackage.findFirst({
      where: {
        id,
        project: {
          organizationId: session.user.organizationId
        }
      },
      include: {
        project: { select: { id: true, name: true, budget: true } },
        responsibleParty: { select: { id: true, name: true, email: true } },
        costCode: { select: { id: true, code: true, name: true, category: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { id: true, name: true } }
          }
        },
        productionLogs: {
          orderBy: { date: 'desc' },
          take: 10
        },
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!workPackage) {
      return NextResponse.json({ error: 'Work package not found' }, { status: 404 });
    }

    return NextResponse.json(workPackage);
  } catch (error) {
    console.error('Error fetching work package:', error);
    return NextResponse.json({ error: 'Failed to fetch work package' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify work package exists and belongs to org
    const existing = await prisma.workPackage.findFirst({
      where: {
        id,
        project: {
          organizationId: session.user.organizationId
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Work package not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'description', 'status', 'scope', 'deliverables',
      'budgetAmount', 'committedAmount', 'actualAmount',
      'plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate',
      'percentComplete', 'weightage', 'responsiblePartyId', 'costCodeId',
      'predecessors', 'successors', 'dependencyType', 'leadLagDays',
      'isCriticalPath', 'totalFloat'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate'].includes(field)) {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else if (['responsiblePartyId', 'costCodeId'].includes(field)) {
          updateData[field] = body[field] || null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const workPackage = await prisma.workPackage.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        responsibleParty: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'work_package_updated',
        entityType: 'WorkPackage',
        entityId: workPackage.id,
        entityName: workPackage.name,
        details: `Updated work package WP-${workPackage.number}`,
        userId: session.user.id,
        projectId: workPackage.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId, {
      type: 'work_package_updated',
      data: workPackage
    });

    return NextResponse.json(workPackage);
  } catch (error) {
    console.error('Error updating work package:', error);
    return NextResponse.json({ error: 'Failed to update work package' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.workPackage.findFirst({
      where: {
        id,
        project: {
          organizationId: session.user.organizationId
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Work package not found' }, { status: 404 });
    }

    await prisma.workPackage.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'work_package_deleted',
        entityType: 'WorkPackage',
        entityId: id,
        entityName: existing.name,
        details: `Deleted work package WP-${existing.number}`,
        userId: session.user.id,
        projectId: existing.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId, {
      type: 'work_package_deleted',
      data: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work package:', error);
    return NextResponse.json({ error: 'Failed to delete work package' }, { status: 500 });
  }
}
