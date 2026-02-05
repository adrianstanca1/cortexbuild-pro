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
      // Get all projects for user's organization
      const projects = await prisma.project.findMany({
        where: { organizationId: session.user.organizationId },
        select: { id: true }
      });
      where.projectId = { in: projects.map(p => p.id) };
    }
    
    if (status) {
      where.status = status;
    }

    const riskAssessments = await prisma.riskAssessment.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        hazards: true,
        _count: { select: { acknowledgements: true, hazards: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(riskAssessments);
  } catch {
    console.error('Error fetching risk assessments:', error);
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
    const { projectId, title, activityDescription, location, startDate, endDate, methodStatement, sequence, requiredPPE, emergencyProcedures, nearestFirstAid, assemblyPoint, hazards } = data;

    // Get next number for this project
    const lastAssessment = await prisma.riskAssessment.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' },
      select: { number: true }
    });
    const number = (lastAssessment?.number || 0) + 1;

    const riskAssessment = await prisma.riskAssessment.create({
      data: {
        number,
        title,
        activityDescription,
        location,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        methodStatement,
        sequence: sequence || [],
        requiredPPE: requiredPPE || [],
        emergencyProcedures,
        nearestFirstAid,
        assemblyPoint,
        projectId,
        createdById: session.user.id,
        hazards: hazards?.length ? {
          create: hazards.map((h: any, index: number) => ({
            hazardDescription: h.hazardDescription,
            personsAtRisk: h.personsAtRisk || [],
            initialSeverity: h.initialSeverity || 3,
            initialLikelihood: h.initialLikelihood || 3,
            initialRiskScore: (h.initialSeverity || 3) * (h.initialLikelihood || 3),
            controlMeasures: h.controlMeasures || [],
            residualSeverity: h.residualSeverity || 1,
            residualLikelihood: h.residualLikelihood || 1,
            residualRiskScore: (h.residualSeverity || 1) * (h.residualLikelihood || 1),
            sortOrder: index
          }))
        } : undefined
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        createdBy: { select: { id: true, name: true } },
        hazards: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'created',
        entityType: 'RiskAssessment',
        entityId: riskAssessment.id,
        entityName: riskAssessment.title,
        userId: session.user.id,
        projectId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(riskAssessment.project.organizationId, {
      type: 'risk_assessment_created',
      data: riskAssessment
    });

    return NextResponse.json(riskAssessment, { status: 201 });
  } catch {
    console.error('Error creating risk assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
