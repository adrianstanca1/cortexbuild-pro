import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

const ABACUS_API_URL = 'https://api.abacus.ai/api/v0/chat';

interface ResourceAllocation {
  resourceId: string;
  resourceName: string;
  resourceType: 'labour' | 'equipment';
  trade?: string;
  projects: {
    projectId: string;
    projectName: string;
    allocation: number;
  }[];
  totalAllocation: number;
  availability: number;
  status: 'available' | 'allocated' | 'overallocated';
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch team members with project assignments
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: session.user.organizationId!,
      },
      include: {
        user: true,
        projectAssignments: {
          include: {
            project: true,
          },
        },
      },
    });

    // Fetch equipment
    const equipment = await prisma.equipment.findMany({
      where: {
        organizationId: session.user.organizationId!,
      },
      include: {
        currentProject: true,
      },
    });

    // Fetch active projects
    const projects = await prisma.project.findMany({
      where: {
        organizationId: session.user.organizationId!,
        status: { in: ['PLANNING', 'IN_PROGRESS'] },
      },
      include: {
        tasks: true,
        teamMembers: true,
      },
    });

    // Process labour allocations
    const labourAllocations: ResourceAllocation[] = teamMembers.map((tm) => {
      const projectAllocations = tm.projectAssignments.map((pa) => ({
        projectId: pa.project.id,
        projectName: pa.project.name,
        allocation: 100 / Math.max(tm.projectAssignments.length, 1),
      }));

      const totalAllocation = projectAllocations.reduce((a, b) => a + b.allocation, 0);
      const availability = Math.max(0, 100 - totalAllocation);
      let status: 'available' | 'allocated' | 'overallocated' = 'available';
      if (totalAllocation > 100) status = 'overallocated';
      else if (totalAllocation > 60) status = 'allocated';

      return {
        resourceId: tm.id,
        resourceName: tm.user?.name || 'Unknown',
        resourceType: 'labour',
        trade: tm.department || tm.jobTitle || 'General',
        projects: projectAllocations,
        totalAllocation: Math.min(totalAllocation, 100),
        availability,
        status,
      };
    });

    // Process equipment allocations
    const equipmentAllocations: ResourceAllocation[] = equipment.map((eq) => {
      const allocation = eq.status === 'IN_USE' ? 100 : eq.status === 'MAINTENANCE' ? 0 : 50;
      const projectAllocation = eq.currentProject ? {
        projectId: eq.currentProject.id,
        projectName: eq.currentProject.name,
        allocation,
      } : null;

      return {
        resourceId: eq.id,
        resourceName: eq.name,
        resourceType: 'equipment',
        trade: eq.category || 'Equipment',
        projects: projectAllocation ? [projectAllocation] : [],
        totalAllocation: allocation,
        availability: Math.max(0, 100 - allocation),
        status: allocation > 100 ? 'overallocated' : allocation > 60 ? 'allocated' : 'available',
      };
    });

    const allAllocations = [...labourAllocations, ...equipmentAllocations];

    const metrics = {
      totalResources: allAllocations.length,
      totalLabour: labourAllocations.length,
      totalEquipment: equipmentAllocations.length,
      avgUtilization: allAllocations.length > 0
        ? Math.round(allAllocations.reduce((a, b) => a + b.totalAllocation, 0) / allAllocations.length)
        : 0,
      overallocatedCount: allAllocations.filter(r => r.status === 'overallocated').length,
      underutilizedCount: allAllocations.filter(r => r.totalAllocation < 40).length,
      optimallyAllocatedCount: allAllocations.filter(r => r.totalAllocation >= 60 && r.totalAllocation <= 100).length,
    };

    const byTrade = allAllocations.reduce((acc, r) => {
      const trade = r.trade || 'General';
      if (!acc[trade]) {
        acc[trade] = { count: 0, avgUtilization: 0, available: 0 };
      }
      acc[trade].count += 1;
      acc[trade].avgUtilization += r.totalAllocation;
      if (r.status === 'available') acc[trade].available += 1;
      return acc;
    }, {} as Record<string, { count: number; avgUtilization: number; available: number }>);

    Object.keys(byTrade).forEach((trade) => {
      byTrade[trade].avgUtilization = Math.round(byTrade[trade].avgUtilization / byTrade[trade].count);
    });

    return NextResponse.json({
      success: true,
      resources: allAllocations,
      metrics,
      byTrade,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        taskCount: p.tasks.length,
        teamCount: p.teamMembers.length,
      })),
    });
  } catch {
    console.error('Error fetching resource data:', error);
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
    const { resources, metrics, projects, analysisType } = body;

    const context = {
      resources: resources?.slice(0, 30),
      metrics,
      projects: projects?.slice(0, 10),
      overallocatedResources: resources?.filter((r: ResourceAllocation) => r.status === 'overallocated'),
      underutilizedResources: resources?.filter((r: ResourceAllocation) => r.totalAllocation < 40),
    };

    let prompt = '';
    switch (analysisType) {
      case 'optimization':
        prompt = `As a UK construction resource planning specialist, analyze this resource allocation data:\n\n${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Current Allocation Analysis\n2. Overallocation Issues & Solutions\n3. Underutilization Opportunities\n4. Recommended Resource Rebalancing\n5. Hiring/Contracting Needs\n6. 30-Day Resource Plan\n\nUse UK construction industry standards.`;
        break;
      case 'capacity_planning':
        prompt = `Analyze capacity planning needs for this UK construction operation:\n\n${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Current Capacity Assessment\n2. Peak Demand Periods\n3. Capacity Bottlenecks\n4. Resource Requirements Forecast\n5. Contingency Planning\n\nUse realistic UK construction benchmarks.`;
        break;
      case 'productivity':
        prompt = `Assess productivity and provide improvement recommendations:\n\n${JSON.stringify(context, null, 2)}\n\nAnalyze:\n1. Current Productivity Levels\n2. Utilization Efficiency\n3. Productivity Blockers\n4. Process Improvements\n5. Estimated Productivity Gains\n\nReference UK construction productivity benchmarks.`;
        break;
      default:
        prompt = `Provide a comprehensive resource scheduling analysis:\n\n${JSON.stringify(context, null, 2)}\n\nInclude overview, key insights, and actionable recommendations.`;
    }

    const response = await fetch(ABACUS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a UK construction resource planning and scheduling expert. Provide practical, data-driven recommendations for optimizing resource allocation.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Abacus API error');
      return NextResponse.json({ error: 'Failed to analyze resources' }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || data.content || '';

    return NextResponse.json({
      success: true,
      analysisType,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch {
    console.error('Resource analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
