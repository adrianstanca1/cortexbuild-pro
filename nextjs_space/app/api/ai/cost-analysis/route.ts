import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { generateAIResponse } from '@/lib/ai-service';

// Cost analysis endpoint - supports Ollama (primary), Gemini, and Abacus AI
// Analyzes project costs, forecasts, and variances


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, analysisType = 'trend' } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    // Fetch project with cost data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user?.organizationId || undefined
      },
      select: {
        id: true,
        name: true,
        budget: true,
        status: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch change orders separately
    const changeOrders = await prisma.changeOrder.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        costChange: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Fetch forecast entries separately
    const forecastEntries = await prisma.forecastEntry.findMany({
      where: { projectId },
      orderBy: { forecastDate: 'desc' },
      take: 10
    });

    // Calculate cost metrics
    const totalChangeOrderValue = changeOrders
      .filter(co => co.status === 'APPROVED')
      .reduce((sum, co) => sum + (co.costChange || 0), 0);

    const pendingChangeOrderValue = changeOrders
      .filter(co => co.status === 'PENDING_APPROVAL')
      .reduce((sum, co) => sum + (co.costChange || 0), 0);

    const latestForecast = forecastEntries[0];

    // Build context for AI
    const costContext = `
Project: ${project.name}
Original Budget: £${(project.budget || 0).toLocaleString()}
Approved Change Orders: £${totalChangeOrderValue.toLocaleString()}
Pending Change Orders: £${pendingChangeOrderValue.toLocaleString()}
Current Budget (inc. approved changes): £${((project.budget || 0) + totalChangeOrderValue).toLocaleString()}
Project Status: ${project.status}
${latestForecast ? `
Latest Forecast Data:
- Forecast at Completion: £${(latestForecast.forecastAtCompletion || 0).toLocaleString()}
- CPI (Cost Performance Index): ${latestForecast.costPerformanceIndex?.toFixed(2) || 'N/A'}
- SPI (Schedule Performance Index): ${latestForecast.schedulePerformanceIndex?.toFixed(2) || 'N/A'}
- Earned Value: £${(latestForecast.earnedValue || 0).toLocaleString()}
- Actual Cost: £${(latestForecast.actualCost || 0).toLocaleString()}` : ''}

Recent Change Orders:
${changeOrders.slice(0, 5).map(co => `- ${co.title}: £${(co.costChange || 0).toLocaleString()} (${co.status})`).join('\n')}
`;

    let prompt = '';
    switch (analysisType) {
      case 'forecast':
        prompt = `You are a UK construction cost consultant analyzing project finances.

${costContext}

Provide a cost forecast analysis including:

1. **Current Financial Position**: Summary of budget vs actual spending
2. **Cost Performance Analysis**: Interpret CPI/SPI metrics (>1 is good, <1 is concerning)
3. **Forecast at Completion**: Projected final cost with confidence level
4. **Cost Risk Factors**: Identify potential cost overrun risks
5. **Savings Opportunities**: Areas where costs could be optimized
6. **Recommendations**: Specific actions to improve cost performance

Use UK construction terminology and £ currency. Be specific with numbers.`;
        break;

      case 'variance':
        prompt = `You are a UK construction cost consultant analyzing budget variances.

${costContext}

Provide a variance analysis including:

1. **Budget Variance Summary**: Compare original vs current budget
2. **Change Order Impact**: Analyze the impact of approved and pending changes
3. **Variance Trends**: Identify patterns in cost changes
4. **Root Causes**: Likely reasons for significant variances
5. **Mitigation Strategies**: How to address negative variances
6. **Contingency Assessment**: Is the contingency adequate?

Use UK construction terminology and £ currency.`;
        break;

      default: // trend
        prompt = `You are a UK construction cost consultant analyzing cost trends.

${costContext}

Provide a cost trend analysis including:

1. **Overall Trend Assessment**: Is the project trending over/under budget?
2. **Key Cost Drivers**: Main factors affecting costs
3. **Monthly Burn Rate**: Estimated spending rate and implications
4. **Forecast Accuracy**: How reliable are current projections?
5. **Early Warning Signs**: Any indicators of future cost issues?
6. **Action Items**: Priority actions to manage costs

Use UK construction terminology and £ currency.`;
    }

    const messages = [
      { role: 'user', content: prompt }
    ];

    const result = await generateAIResponse({ messages: messages as any, maxTokens: 2000 });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'AI service unavailable' }, { status: 503 });
    }

    let parsed: any = {};
    try {
      const jsonMatch = result.response?.match(/```json\n?([\s\S]*?)\n?```/) || [null, result.response];
      parsed = JSON.parse(jsonMatch[1] || '{}');
    } catch {
      parsed = { analysis: result.response };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Cost analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze costs' },
      { status: 500 }
    );
  }
}

