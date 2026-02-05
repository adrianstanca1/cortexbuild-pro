import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get all analytics widgets for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('dashboardId');

    const where: any = { organizationId: user.organizationId };
    if (dashboardId) {
      where.dashboardId = dashboardId;
    }

    const widgets = await prisma.analyticsWidget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(widgets);
  } catch {
    console.error('Get analytics widgets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new analytics widget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, chartType, dataSource, query, dashboardId, position, settings } = body;

    if (!name || !chartType || !dataSource || !query) {
      return NextResponse.json({ error: 'Name, chartType, dataSource, and query are required' }, { status: 400 });
    }

    const widget = await prisma.analyticsWidget.create({
      data: {
        name,
        chartType,
        dataSource,
        query,
        dashboardId: dashboardId || null,
        position: position || null,
        settings: settings || {},
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(widget, { status: 201 });
  } catch {
    console.error('Create analytics widget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
