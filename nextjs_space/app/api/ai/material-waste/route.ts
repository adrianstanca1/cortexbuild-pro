import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

const ABACUS_API_URL = 'https://api.abacus.ai/api/v0/chat';

interface MaterialUsage {
  id: string;
  name: string;
  category: string;
  unit: string;
  budgeted: number;
  ordered: number;
  delivered: number;
  used: number;
  wasted: number;
  wastePercentage: number;
  costPerUnit: number;
  wasteCost: number;
  status: 'on_track' | 'warning' | 'critical';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const whereClause = projectId
      ? { projectId }
      : { project: { organizationId: session.user.organizationId! } };

    const materials = await prisma.material.findMany({
      where: whereClause,
      include: { project: true },
    });

    // Process materials into usage metrics
    const materialUsage: MaterialUsage[] = materials.map((mat) => {
      const budgeted = mat.quantityNeeded || 0;
      const ordered = mat.quantityOrdered || 0;
      const delivered = mat.quantityReceived || 0;
      
      // Simulate usage and waste based on status
      const usedRatio = mat.status === 'DELIVERED' || mat.status === 'INSTALLED' ? 0.85 : mat.status === 'ORDERED' ? 0.3 : 0.1;
      const used = Math.round(delivered * usedRatio);
      
      // Typical waste percentages by material type
      const wasteRates: Record<string, number> = {
        'Concrete': 0.05,
        'Timber': 0.10,
        'Steel': 0.03,
        'Bricks': 0.08,
        'Plasterboard': 0.12,
        'Insulation': 0.07,
        'default': 0.06,
      };
      
      const wasteRate = wasteRates[mat.category || ''] || wasteRates['default'];
      const wasted = Math.round(delivered * wasteRate);
      const wastePercentage = delivered > 0 ? Math.round((wasted / delivered) * 100) : 0;
      
      const costPerUnit = mat.unitCost || 0;
      const wasteCost = wasted * costPerUnit;
      
      let status: 'on_track' | 'warning' | 'critical' = 'on_track';
      if (wastePercentage > 15) status = 'critical';
      else if (wastePercentage > 10) status = 'warning';
      
      return {
        id: mat.id,
        name: mat.name,
        category: mat.category || 'General',
        unit: mat.unit || 'units',
        budgeted,
        ordered,
        delivered,
        used,
        wasted,
        wastePercentage,
        costPerUnit,
        wasteCost,
        status,
      };
    });

    const metrics = {
      totalBudgeted: materialUsage.reduce((a, b) => a + b.budgeted * b.costPerUnit, 0),
      totalUsed: materialUsage.reduce((a, b) => a + b.used * b.costPerUnit, 0),
      totalWasted: materialUsage.reduce((a, b) => a + b.wasted, 0),
      totalWasteCost: materialUsage.reduce((a, b) => a + b.wasteCost, 0),
      avgWastePercentage: materialUsage.length > 0
        ? Math.round(materialUsage.reduce((a, b) => a + b.wastePercentage, 0) / materialUsage.length)
        : 0,
      materialsAtRisk: materialUsage.filter(m => m.status !== 'on_track').length,
      materialsOnTrack: materialUsage.filter(m => m.status === 'on_track').length,
    };

    const wasteByCategory = materialUsage.reduce((acc, m) => {
      if (!acc[m.category]) {
        acc[m.category] = { waste: 0, cost: 0, count: 0 };
      }
      acc[m.category].waste += m.wasted;
      acc[m.category].cost += m.wasteCost;
      acc[m.category].count += 1;
      return acc;
    }, {} as Record<string, { waste: number; cost: number; count: number }>);

    return NextResponse.json({
      success: true,
      materials: materialUsage,
      metrics,
      wasteByCategory,
    });
  } catch (error) {
    console.error('Error fetching material waste data:', error);
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
    const { materials, metrics, analysisType } = body;

    const context = { materials: materials?.slice(0, 20), metrics };

    let prompt = '';
    switch (analysisType) {
      case 'waste_reduction':
        prompt = `As a UK construction waste management specialist, analyze this material waste data:\n\n${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Key Waste Hotspots\n2. Root Cause Analysis\n3. Reduction Strategies\n4. Cost Savings Potential (\u00a3)\n5. Best Practice Recommendations\n6. WRAP Guidelines Compliance\n\nUse UK construction waste management standards.`;
        break;
      case 'cost_impact':
        prompt = `Analyze the cost impact of material waste for this UK construction project:\n\n${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Total Waste Cost Analysis\n2. Cost Breakdown by Category\n3. Industry Benchmarks Comparison\n4. Cost Recovery Opportunities\n5. Recommendations\n\nAll costs in \u00a3 (GBP).`;
        break;
      case 'sustainability':
        prompt = `Assess environmental sustainability of material usage for this UK construction project:\n\n${JSON.stringify(context, null, 2)}\n\nAnalyze:\n1. Carbon Footprint of Waste\n2. Circular Economy Opportunities\n3. Recycling & Reuse Potential\n4. BREEAM Impact\n5. Sustainability Recommendations\n\nReference UK sustainability standards.`;
        break;
      default:
        prompt = `Provide a comprehensive waste analysis for this construction project:\n\n${JSON.stringify(context, null, 2)}\n\nInclude overview, key findings, and recommendations.`;
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
          { role: 'system', content: 'You are a UK construction waste management and sustainability expert. Provide practical, actionable recommendations referencing UK regulations and WRAP guidelines.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Abacus API error');
      return NextResponse.json({ error: 'Failed to analyze waste data' }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || data.content || '';

    return NextResponse.json({
      success: true,
      analysisType,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Waste analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
