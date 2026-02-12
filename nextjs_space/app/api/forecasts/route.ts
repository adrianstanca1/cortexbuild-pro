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
    const forecastType = searchParams.get('forecastType');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      projectId,
      project: {
        organizationId: session.user.organizationId
      }
    };

    if (forecastType) {
      where.forecastType = forecastType;
    }

    const forecasts = await prisma.forecastEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, budget: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { forecastDate: 'desc' }
    });

    return NextResponse.json(forecasts);
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return NextResponse.json({ error: 'Failed to fetch forecasts' }, { status: 500 });
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
      projectId, forecastType, periodStart, periodEnd,
      originalBudget, currentBudget, actualToDate, forecastAtCompletion,
      estimateToComplete, plannedDuration, actualDuration, forecastDuration,
      plannedValue, earnedValue, actualCost, confidence, assumptions, risks,
      scenarioName, isBaseline
    } = body;

    if (!projectId || !forecastType) {
      return NextResponse.json({ error: 'Project ID and forecast type are required' }, { status: 400 });
    }

    // Calculate derived metrics
    let costPerformanceIndex: number | null = null;
    let schedulePerformanceIndex: number | null = null;
    let varianceAtCompletion: number | null = null;
    let scheduleVariance: number | null = null;

    if (earnedValue && actualCost && actualCost > 0) {
      costPerformanceIndex = earnedValue / actualCost;
    }
    if (earnedValue && plannedValue && plannedValue > 0) {
      schedulePerformanceIndex = earnedValue / plannedValue;
    }
    if (currentBudget && forecastAtCompletion) {
      varianceAtCompletion = currentBudget - forecastAtCompletion;
    }
    if (plannedDuration && forecastDuration) {
      scheduleVariance = plannedDuration - forecastDuration;
    }

    const forecast = await prisma.forecastEntry.create({
      data: {
        projectId,
        forecastType,
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        originalBudget,
        currentBudget,
        actualToDate,
        forecastAtCompletion,
        estimateToComplete,
        varianceAtCompletion,
        plannedDuration,
        actualDuration,
        forecastDuration,
        scheduleVariance,
        plannedValue,
        earnedValue,
        actualCost,
        costPerformanceIndex,
        schedulePerformanceIndex,
        confidence,
        assumptions,
        risks,
        scenarioName,
        isBaseline: isBaseline || false,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(forecast, { status: 201 });
  } catch (error) {
    console.error('Error creating forecast:', error);
    return NextResponse.json({ error: 'Failed to create forecast' }, { status: 500 });
  }
}
