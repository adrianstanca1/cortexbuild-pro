export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Budget forecast and analysis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: any = projectId 
      ? { projectId, project: { organizationId: session.user.organizationId } }
      : { project: { organizationId: session.user.organizationId } };

    // Get all cost items
    const costItems = await prisma.costItem.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, budget: true, startDate: true, endDate: true } }
      }
    });

    // Calculate category breakdown
    const categoryBreakdown: Record<string, { estimated: number; actual: number; committed: number; count: number }> = {};
    let totalEstimated = 0, totalActual = 0, totalCommitted = 0;

    costItems.forEach(item => {
      const cat = item.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { estimated: 0, actual: 0, committed: 0, count: 0 };
      }
      categoryBreakdown[cat].estimated += item.estimatedAmount;
      categoryBreakdown[cat].actual += item.actualAmount;
      categoryBreakdown[cat].committed += item.committedAmount;
      categoryBreakdown[cat].count++;
      
      totalEstimated += item.estimatedAmount;
      totalActual += item.actualAmount;
      totalCommitted += item.committedAmount;
    });

    // Calculate variance
    const variance = totalEstimated - totalActual;
    const variancePercent = totalEstimated > 0 ? ((variance / totalEstimated) * 100).toFixed(2) : "0";

    // Monthly burn rate (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentCosts = costItems.filter(item => 
      item.createdAt && new Date(item.createdAt) >= threeMonthsAgo
    );
    const recentTotal = recentCosts.reduce((sum, item) => sum + item.actualAmount, 0);
    const monthlyBurnRate = recentTotal / 3;

    // Project at completion (EAC) forecast
    // Using simple formula: EAC = Actual + (Budget - Earned)
    // Contingency: Add 10% buffer for unknowns
    const contingencyPercent = 0.10;
    const projectedAtCompletion = totalActual + (totalCommitted - totalActual) * (1 + contingencyPercent);

    // Budget health assessment
    const budgetUtilization = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;
    let healthStatus: "healthy" | "warning" | "critical" = "healthy";
    if (budgetUtilization > 90) healthStatus = "critical";
    else if (budgetUtilization > 75) healthStatus = "warning";

    // Trend analysis - monthly spending
    const monthlyTrend: Array<{ month: string; amount: number }> = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthCosts = costItems.filter(item => {
        const created = new Date(item.createdAt);
        return created >= monthStart && created < monthEnd;
      });
      
      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        amount: monthCosts.reduce((sum, item) => sum + item.actualAmount, 0)
      });
    }

    // Risk assessment
    const overBudgetCategories = Object.entries(categoryBreakdown)
      .filter(([_, data]) => data.actual > data.estimated)
      .map(([category, data]) => ({
        category,
        overBy: data.actual - data.estimated,
        percentOver: ((data.actual - data.estimated) / data.estimated * 100).toFixed(1)
      }));

    return NextResponse.json({
      summary: {
        totalEstimated,
        totalActual,
        totalCommitted,
        remaining: totalEstimated - totalActual,
        variance,
        variancePercent: parseFloat(variancePercent),
        itemCount: costItems.length
      },
      forecast: {
        projectedAtCompletion,
        monthlyBurnRate,
        estimatedCompletionMonths: monthlyBurnRate > 0 
          ? Math.ceil((totalEstimated - totalActual) / monthlyBurnRate) 
          : null,
        contingencyAmount: projectedAtCompletion * contingencyPercent
      },
      health: {
        status: healthStatus,
        utilization: parseFloat(budgetUtilization.toFixed(2)),
        overBudgetCategories
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        ...data,
        percentOfTotal: totalEstimated > 0 ? ((data.estimated / totalEstimated) * 100).toFixed(1) : "0"
      })),
      monthlyTrend
    });
  } catch (error) {
    console.error("Error generating budget forecast:", error);
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 });
  }
}
