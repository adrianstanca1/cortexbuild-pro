import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get all analytics dashboards for organization
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const dashboards = await prisma.analyticsDashboard.findMany({
      where: { organizationId: user.organizationId },
      include: {
        widgets: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error('Get analytics dashboards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new analytics dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, layout, isPublic, isDefault } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const dashboard = await prisma.analyticsDashboard.create({
      data: {
        name,
        description,
        layout: layout || {},
        isPublic: isPublic || false,
        isDefault: isDefault || false,
        organizationId: user.organizationId,
      },
      include: {
        widgets: true,
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error('Create analytics dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
