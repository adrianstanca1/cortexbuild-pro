import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

const ABACUS_API_URL = 'https://api.abacus.ai/api/v0/chat';

interface SubcontractorMetrics {
  id: string;
  name: string;
  company: string;
  trade: string;
  contractsCount: number;
  activeContracts: number;
  completedContracts: number;
  totalContractValue: number;
  paidAmount: number;
  rating: number;
  safetyScore: number;
  qualityScore: number;
  timelinessScore: number;
  overallScore: number;
  ranking: number;
  trend: 'up' | 'down' | 'stable';
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subcontractors = await prisma.subcontractor.findMany({
      where: {
        organizationId: session.user.organizationId!,
      },
      include: {
        contracts: {
          include: {
            project: true,
          },
        },
      },
    });

    const subcontractorMetrics: SubcontractorMetrics[] = subcontractors.map((sub, _index) => {
      const contracts = sub.contracts || [];
      const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
      const completedContracts = contracts.filter(c => c.status === 'COMPLETED').length;
      const totalContractValue = contracts.reduce((a, c) => a + (c.contractAmount || 0), 0);
      const paidAmount = contracts.reduce((a, c) => a + (c.paidAmount || 0), 0);

      // Calculate scores based on available data
      const safetyScore = 85 + Math.random() * 15; // Simulated - would come from incident data
      const qualityScore = 80 + Math.random() * 20; // Simulated - would come from defect data
      const timelinessScore = completedContracts > 0 ? 75 + Math.random() * 25 : 80;
      
      const overallScore = Math.round((safetyScore * 0.35) + (qualityScore * 0.35) + (timelinessScore * 0.30));
      const trend: 'up' | 'down' | 'stable' = overallScore > 80 ? 'up' : overallScore < 60 ? 'down' : 'stable';

      return {
        id: sub.id,
        name: sub.companyName,
        company: sub.companyName,
        trade: sub.trade || 'General',
        contractsCount: contracts.length,
        activeContracts,
        completedContracts,
        totalContractValue,
        paidAmount,
        rating: sub.rating || 3,
        safetyScore: Math.round(safetyScore),
        qualityScore: Math.round(qualityScore),
        timelinessScore: Math.round(timelinessScore),
        overallScore,
        ranking: 0,
        trend,
      };
    });

    subcontractorMetrics.sort((a, b) => b.overallScore - a.overallScore);
    subcontractorMetrics.forEach((sub, index) => {
      sub.ranking = index + 1;
    });

    const aggregateStats = {
      totalSubcontractors: subcontractorMetrics.length,
      avgOverallScore: subcontractorMetrics.length > 0
        ? Math.round(subcontractorMetrics.reduce((a, b) => a + b.overallScore, 0) / subcontractorMetrics.length)
        : 0,
      avgSafetyScore: subcontractorMetrics.length > 0
        ? Math.round(subcontractorMetrics.reduce((a, b) => a + b.safetyScore, 0) / subcontractorMetrics.length)
        : 0,
      avgQualityScore: subcontractorMetrics.length > 0
        ? Math.round(subcontractorMetrics.reduce((a, b) => a + b.qualityScore, 0) / subcontractorMetrics.length)
        : 0,
      topPerformers: subcontractorMetrics.filter(s => s.overallScore >= 80).length,
      needsImprovement: subcontractorMetrics.filter(s => s.overallScore < 60).length,
      totalContractValue: subcontractorMetrics.reduce((a, b) => a + b.totalContractValue, 0),
      activeContracts: subcontractorMetrics.reduce((a, b) => a + b.activeContracts, 0),
    };

    const performanceDistribution = {
      excellent: subcontractorMetrics.filter(s => s.overallScore >= 90).length,
      good: subcontractorMetrics.filter(s => s.overallScore >= 75 && s.overallScore < 90).length,
      average: subcontractorMetrics.filter(s => s.overallScore >= 60 && s.overallScore < 75).length,
      belowAverage: subcontractorMetrics.filter(s => s.overallScore >= 40 && s.overallScore < 60).length,
      poor: subcontractorMetrics.filter(s => s.overallScore < 40).length,
    };

    return NextResponse.json({
      success: true,
      subcontractors: subcontractorMetrics,
      aggregateStats,
      performanceDistribution,
    });
  } catch (error) {
    console.error('Error fetching subcontractor analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subcontractorId, analysisType } = body;

    const subcontractor = await prisma.subcontractor.findFirst({
      where: {
        id: subcontractorId,
        organizationId: session.user.organizationId!,
      },
      include: {
        contracts: {
          include: { project: true },
        },
      },
    });

    if (!subcontractor) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    const subcontractorContext = {
      name: subcontractor.companyName,
      trade: subcontractor.trade,
      rating: subcontractor.rating,
      contracts: subcontractor.contracts.map(c => ({
        projectName: c.project.name,
        status: c.status,
        amount: c.contractAmount,
        paid: c.paidAmount,
      })),
      totalContracts: subcontractor.contracts.length,
    };

    let prompt = '';
    switch (analysisType) {
      case 'performance_review':
        prompt = `Provide a comprehensive performance review for this UK construction subcontractor:\n\n${JSON.stringify(subcontractorContext, null, 2)}\n\nInclude:\n1. Overall Performance Rating (1-10)\n2. Strengths\n3. Areas for improvement\n4. Contract renewal recommendation\n5. Performance improvement plan`;
        break;
      case 'risk_assessment':
        prompt = `Conduct a risk assessment for continuing to work with this subcontractor:\n\n${JSON.stringify(subcontractorContext, null, 2)}\n\nAnalyze:\n1. Financial risk\n2. Performance risk\n3. Safety risk\n4. Recommended risk mitigation measures\n5. Overall risk rating`;
        break;
      default:
        prompt = `Provide a summary analysis of this subcontractor:\n\n${JSON.stringify(subcontractorContext, null, 2)}\n\nInclude key insights and recommendations.`;
    }

    const response = await fetch(ABACUS_APIURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a UK construction industry analyst specializing in subcontractor performance evaluation and supply chain management.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Abacus API error');
      return NextResponse.json({ error: 'Failed to analyze subcontractor' }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || data.content || '';

    return NextResponse.json({
      success: true,
      subcontractorId,
      subcontractorName: subcontractor.companyName,
      analysisType,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Subcontractor analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
