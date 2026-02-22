import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const signalType = searchParams.get('signalType');
    const severity = searchParams.get('severity');

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId
    };

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (signalType) where.signalType = signalType;
    if (severity) where.severity = severity;

    const signals = await prisma.predictiveSignal.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        acknowledgedBy: { select: { id: true, name: true } }
      },
      orderBy: [
        { severity: 'desc' },
        { detectedAt: 'desc' }
      ]
    });

    return NextResponse.json(signals);
  } catch (error) {
    console.error('Error fetching predictive signals:', error);
    return NextResponse.json({ error: 'Failed to fetch predictive signals' }, { status: 500 });
  }
}

// This endpoint would typically be called by a background job/cron
// to generate signals based on data analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId, signalType, signalName, description, severity,
      confidence, dataPoints, trendDirection, trendDuration,
      potentialImpact, potentialCostImpact, potentialScheduleImpact,
      recommendations
    } = body;

    if (!signalType || !signalName) {
      return NextResponse.json({ error: 'Signal type and name are required' }, { status: 400 });
    }

    const signal = await prisma.predictiveSignal.create({
      data: {
        organizationId: session.user.organizationId,
        projectId: projectId || null,
        signalType,
        signalName,
        description,
        severity: severity || 'MEDIUM',
        confidence: confidence || 0.7,
        dataPoints,
        trendDirection,
        trendDuration,
        potentialImpact,
        potentialCostImpact,
        potentialScheduleImpact,
        recommendations: recommendations || []
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(signal, { status: 201 });
  } catch (error) {
    console.error('Error creating predictive signal:', error);
    return NextResponse.json({ error: 'Failed to create predictive signal' }, { status: 500 });
  }
}
