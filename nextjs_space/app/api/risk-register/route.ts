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
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');

    const where: Record<string, unknown> = {
      project: {
        organizationId: session.user.organizationId
      }
    };

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;

    const risks = await prisma.riskRegisterEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        mitigationActions: {
          include: {
            assignee: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: { mitigationActions: true }
        }
      },
      orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json(risks);
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId, title, description, category, source,
      probability, impact, responseStrategy, mitigationPlan, contingencyPlan,
      costImpactMin, costImpactMax, costImpactMostLikely, scheduleImpactDays,
      ownerId
    } = body;

    if (!projectId || !title || !description) {
      return NextResponse.json({ error: 'Project, title and description are required' }, { status: 400 });
    }

    // Calculate risk score and level
    const prob = probability || 3;
    const imp = impact || 3;
    const riskScore = prob * imp;
    let riskLevel = 'MEDIUM';
    if (riskScore <= 4) riskLevel = 'LOW';
    else if (riskScore >= 15) riskLevel = 'CRITICAL';
    else if (riskScore >= 10) riskLevel = 'HIGH';

    // Get next risk number
    const lastRisk = await prisma.riskRegisterEntry.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' }
    });
    const nextNumber = (lastRisk?.number || 0) + 1;

    const risk = await prisma.riskRegisterEntry.create({
      data: {
        number: nextNumber,
        projectId,
        title,
        description,
        category,
        source,
        probability: prob,
        impact: imp,
        riskScore,
        riskLevel,
        responseStrategy,
        mitigationPlan,
        contingencyPlan,
        costImpactMin,
        costImpactMax,
        costImpactMostLikely,
        scheduleImpactDays,
        ownerId: ownerId || null,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'risk_created',
        entityType: 'RiskRegisterEntry',
        entityId: risk.id,
        entityName: risk.title,
        details: `Created risk R-${risk.number} (${risk.riskLevel})`,
        userId: session.user.id,
        projectId
      }
    });

    broadcastToOrganization(session.user.organizationId, {
      type: 'risk_created',
      data: risk
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error('Error creating risk:', error);
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 });
  }
}
