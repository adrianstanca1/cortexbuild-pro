export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      where: { organizationId },
      select: { id: true }
    });
    const projectIds = projects.map((p: { id: string }) => p.id);

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

    return NextResponse.json(changeOrders);
  } catch (error) {
    console.error('Error fetching change orders:', error);
    return NextResponse.json({ error: 'Failed to fetch change orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, projectId, reason, costChange, scheduleChange } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and project are required' }, { status: 400 });
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
        requestedById: session.user.id,
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
        userId: session.user.id,
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
          requestedByName: session.user.name
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(changeOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating change order:', error);
    return NextResponse.json({ error: 'Failed to create change order' }, { status: 500 });
  }
}
