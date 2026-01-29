export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET forecasts for a project
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const forecasts = await prisma.projectForecast.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { forecastDate: "desc" }
    });

    // Also calculate current metrics
    const costItems = await prisma.costItem.findMany({
      where: { projectId },
      select: {
        estimatedAmount: true,
        actualAmount: true,
        committedAmount: true
      }
    });

    const totalBudget = costItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
    const totalActual = costItems.reduce((sum, item) => sum + item.actualAmount, 0);
    const totalCommitted = costItems.reduce((sum, item) => sum + item.committedAmount, 0);

    return NextResponse.json({
      forecasts,
      current: {
        totalBudget,
        totalActual,
        totalCommitted,
        variance: totalBudget - totalActual,
        variancePercent: totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget * 100) : 0
      }
    });
  } catch (error) {
    console.error("Get forecasts error:", error);
    return NextResponse.json({ error: "Failed to fetch forecasts" }, { status: 500 });
  }
}

// POST create new forecast
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    const body = await request.json();
    const {
      projectId,
      budgetAtCompletion,
      estimateAtCompletion,
      actualCostToDate,
      estimateToComplete,
      originalDuration,
      forecastDuration,
      plannedValue,
      earnedValue,
      productivityIndex,
      productivityTrend,
      confidenceLevel,
      riskExposure,
      notes,
      scenarioName
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate derived metrics
    const costVariance = (budgetAtCompletion || 0) - (actualCostToDate || 0);
    const scheduleVariance = (originalDuration || 0) - (forecastDuration || 0);
    const costPerformanceIndex = actualCostToDate > 0 ? (earnedValue || 0) / actualCostToDate : 1.0;
    const schedulePerformanceIndex = plannedValue > 0 ? (earnedValue || 0) / plannedValue : 1.0;

    const forecast = await prisma.projectForecast.create({
      data: {
        projectId,
        budgetAtCompletion: budgetAtCompletion || 0,
        estimateAtCompletion: estimateAtCompletion || 0,
        actualCostToDate: actualCostToDate || 0,
        estimateToComplete: estimateToComplete || 0,
        costVariance,
        costPerformanceIndex,
        originalDuration,
        forecastDuration,
        scheduleVariance,
        schedulePerformanceIndex,
        plannedValue: plannedValue || 0,
        earnedValue: earnedValue || 0,
        productivityIndex: productivityIndex || 1.0,
        productivityTrend: productivityTrend || "STABLE",
        confidenceLevel: confidenceLevel || 0.5,
        riskExposure: riskExposure || 0,
        notes,
        scenarioName,
        createdById: userId
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ forecast }, { status: 201 });
  } catch (error) {
    console.error("Create forecast error:", error);
    return NextResponse.json({ error: "Failed to create forecast" }, { status: 500 });
  }
}
