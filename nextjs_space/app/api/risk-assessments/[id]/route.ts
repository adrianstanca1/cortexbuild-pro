export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const riskAssessment = await prisma.riskAssessment.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        createdBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        hazards: { orderBy: { sortOrder: 'asc' } },
        acknowledgements: {
          include: { worker: { select: { id: true, name: true } } },
          orderBy: { acknowledgedAt: 'desc' }
        }
      }
    });

    if (!riskAssessment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(riskAssessment);
  } catch (error) {
    console.error('Error fetching risk assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { status, reviewedById, approvedById, reviewComments, hazards, ...updateData } = data;

    // Get existing assessment
    const existing = await prisma.riskAssessment.findUnique({
      where: { id: params.id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update hazards if provided
    if (hazards) {
      await prisma.riskHazard.deleteMany({ where: { riskAssessmentId: params.id } });
      await prisma.riskHazard.createMany({
        data: hazards.map((h: any, index: number) => ({
          riskAssessmentId: params.id,
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
      });
    }

    const riskAssessment = await prisma.riskAssessment.update({
      where: { id: params.id },
      data: {
        ...updateData,
        status: status || undefined,
        reviewedById: reviewedById || undefined,
        approvedById: approvedById || undefined,
        approvedDate: status === 'APPROVED' ? new Date() : undefined,
        reviewComments: reviewComments || undefined
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
        action: status === 'APPROVED' ? 'approved' : 'updated',
        entityType: 'RiskAssessment',
        entityId: riskAssessment.id,
        entityName: riskAssessment.title,
        userId: session.user.id,
        projectId: riskAssessment.projectId
      }
    });

    broadcastToOrganization(existing.project.organizationId, {
      type: 'risk_assessment_updated',
      data: riskAssessment
    });

    return NextResponse.json(riskAssessment);
  } catch (error) {
    console.error('Error updating risk assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.riskAssessment.findUnique({
      where: { id: params.id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.riskAssessment.delete({ where: { id: params.id } });

    broadcastToOrganization(existing.project.organizationId, {
      type: 'risk_assessment_deleted',
      data: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting risk assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
