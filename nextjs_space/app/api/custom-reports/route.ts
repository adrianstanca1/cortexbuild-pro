import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get all custom reports for organization
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const reports = await prisma.customReport.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Get custom reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new custom report
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
    const { name, description, dataSource, columns, filters, groupBy, sortBy } = body;

    if (!name || !dataSource) {
      return NextResponse.json({ error: 'Name and dataSource are required' }, { status: 400 });
    }

    const report = await prisma.customReport.create({
      data: {
        name,
        description: description || null,
        dataSource,
        columns: columns || [],
        filters: filters || null,
        groupBy: groupBy || null,
        sortBy: sortBy || null,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Create custom report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
