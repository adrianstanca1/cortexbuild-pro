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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = (page - 1) * limit;

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Build filter directly without separate project query (removes N+1 problem)
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Build where clause conditionally
    const where: any = projectId
      ? { 
          projectId,
          ...(Object.keys(dateFilter).length > 0 && { reportDate: dateFilter })
        }
      : { 
          project: { organizationId },
          ...(Object.keys(dateFilter).length > 0 && { reportDate: dateFilter })
        };

    const [reports, total] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          photos: true
        },
        orderBy: { reportDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.dailyReport.count({ where })
    ]);

    return NextResponse.json({ 
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      reportDate,
      weather,
      temperature,
      workPerformed,
      materialsUsed,
      equipmentUsed,
      visitors,
      delays,
      safetyNotes,
      manpowerCount
    } = body;

    if (!projectId || !reportDate) {
      return NextResponse.json({ error: 'Project and report date are required' }, { status: 400 });
    }

    // Check if report already exists for this date
    const existing = await prisma.dailyReport.findUnique({
      where: { projectId_reportDate: { projectId, reportDate: new Date(reportDate) } }
    });

    if (existing) {
      return NextResponse.json({ error: 'A report already exists for this date' }, { status: 409 });
    }

    const report = await prisma.dailyReport.create({
      data: {
        projectId,
        reportDate: new Date(reportDate),
        weather: weather || 'SUNNY',
        temperature,
        workPerformed,
        materialsUsed,
        equipmentUsed,
        visitors,
        delays,
        safetyNotes,
        manpowerCount: manpowerCount || 0,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'created',
        entityType: 'daily_report',
        entityId: report.id,
        entityName: `Daily Report - ${new Date(reportDate).toLocaleDateString()}`,
        userId: session.user.id,
        projectId
      }
    });

    // Get organization for broadcasting
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });

    if (project?.organizationId) {
      broadcastToOrganization(project.organizationId, {
        type: 'daily_report_created',
        payload: {
          ...report,
          createdByName: session.user.name
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating daily report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
