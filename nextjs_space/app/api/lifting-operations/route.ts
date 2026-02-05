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

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else if (session.user.organizationId) {
      const projects = await prisma.project.findMany({
        where: { organizationId: session.user.organizationId },
        select: { id: true }
      });
      where.projectId = { in: projects.map(p => p.id) };
    }
    
    if (status) {
      where.status = status;
    }

    const operations = await prisma.liftingOperation.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        plannedBy: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        appointedPerson: { select: { id: true, name: true } }
      },
      orderBy: { liftDate: 'desc' }
    });

    return NextResponse.json(operations);
  } catch {
    console.error('Error fetching lifting operations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const lastOp = await prisma.liftingOperation.findFirst({
      where: { projectId: data.projectId },
      orderBy: { number: 'desc' },
      select: { number: true }
    });
    const number = (lastOp?.number || 0) + 1;

    const operation = await prisma.liftingOperation.create({
      data: {
        number,
        description: data.description,
        liftDate: new Date(data.liftDate),
        location: data.location,
        loadDescription: data.loadDescription,
        loadWeight: parseFloat(data.loadWeight),
        loadDimensions: data.loadDimensions,
        loadCog: data.loadCog,
        craneType: data.craneType,
        craneCapacity: data.craneCapacity ? parseFloat(data.craneCapacity) : null,
        craneMake: data.craneMake,
        craneSerial: data.craneSerial,
        slingType: data.slingType,
        slingCapacity: data.slingCapacity ? parseFloat(data.slingCapacity) : null,
        shackleSize: data.shackleSize,
        liftRadius: data.liftRadius ? parseFloat(data.liftRadius) : null,
        liftHeight: data.liftHeight ? parseFloat(data.liftHeight) : null,
        groundConditions: data.groundConditions,
        windSpeedLimit: data.windSpeedLimit ? parseFloat(data.windSpeedLimit) : null,
        liftPlanAttached: data.liftPlanAttached || false,
        exclusionZoneSet: data.exclusionZoneSet || false,
        banksman: data.banksman,
        signallerName: data.signallerName,
        projectId: data.projectId,
        plannedById: session.user.id,
        operatorId: data.operatorId || null,
        supervisorId: data.supervisorId || null,
        appointedPersonId: data.appointedPersonId || null,
        plannerSignature: data.plannerSignature,
        plannerSignedAt: data.plannerSignature ? new Date() : null
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        plannedBy: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'created',
        entityType: 'LiftingOperation',
        entityId: operation.id,
        entityName: `Lift Plan #${number} - ${data.loadDescription}`,
        userId: session.user.id,
        projectId: data.projectId
      }
    });

    broadcastToOrganization(operation.project.organizationId, {
      type: 'lifting_operation_created',
      data: operation
    });

    return NextResponse.json(operation, { status: 201 });
  } catch {
    console.error('Error creating lifting operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
