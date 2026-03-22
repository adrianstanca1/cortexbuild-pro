import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getProjectStats, getProjectAnalytics, getAllProjectsSummary, getProductivityTrends } from '@/lib/analytics/project';
import { getSafetyMetrics, getSafetyTrends } from '@/lib/analytics/safety';
import { getBudgetOverview, getBudgetByCategory, getProjectBudgetSummary } from '@/lib/analytics/budget';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const projectId = searchParams.get('projectId');

    switch (action) {
      case 'project-stats': {
        if (!projectId) {
          return NextResponse.json({ error: 'projectId required' }, { status: 400 });
        }
        const stats = await getProjectStats(projectId);
        if (!stats) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        return NextResponse.json(stats);
      }

      case 'project-analytics': {
        if (!projectId) {
          return NextResponse.json({ error: 'projectId required' }, { status: 400 });
        }
        const period = (searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year') || 'month';
        const analytics = await getProjectAnalytics(projectId, period);
        return NextResponse.json(analytics);
      }

      case 'all-projects-summary': {
        const summary = await getAllProjectsSummary();
        return NextResponse.json(summary);
      }

      case 'productivity-trends': {
        if (!projectId) {
          return NextResponse.json({ error: 'projectId required' }, { status: 400 });
        }
        const days = parseInt(searchParams.get('days') || '30', 10);
        const trends = await getProductivityTrends(projectId, days);
        return NextResponse.json(trends);
      }

      case 'safety-metrics': {
        const metrics = await getSafetyMetrics(projectId || undefined);
        return NextResponse.json(metrics);
      }

      case 'safety-trends': {
        const days = parseInt(searchParams.get('days') || '90', 10);
        const trends = await getSafetyTrends(projectId || undefined, days);
        return NextResponse.json(trends);
      }

      case 'budget-overview': {
        if (!projectId) {
          return NextResponse.json({ error: 'projectId required' }, { status: 400 });
        }
        const overview = await getBudgetOverview(projectId);
        return NextResponse.json(overview);
      }

      case 'budget-by-category': {
        if (!projectId) {
          return NextResponse.json({ error: 'projectId required' }, { status: 400 });
        }
        const byCategory = await getBudgetByCategory(projectId);
        return NextResponse.json(byCategory);
      }

      case 'all-projects-budget': {
        const summary = await getProjectBudgetSummary();
        return NextResponse.json(summary);
      }

      case 'dashboard': {
        const [projectsSummary, safetyMetrics, budgetSummary] = await Promise.all([
          getAllProjectsSummary(),
          getSafetyMetrics(),
          getProjectBudgetSummary(),
        ]);

        return NextResponse.json({
          projects: projectsSummary,
          safety: safetyMetrics,
          budgets: budgetSummary,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
