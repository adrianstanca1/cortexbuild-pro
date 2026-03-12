import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const dashboards = await prisma.customReport.findMany({
      where: { dataSource: 'ANALYTICS_DASHBOARD' },
      include: { organization: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ dashboards });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    let orgId = body.organizationId;
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
      orgId = firstOrg?.id || null;
    }
    const dashboard = await prisma.customReport.create({
      data: {
        organizationId: orgId,
        name: body.name || 'New Dashboard',
        description: body.description || null,
        dataSource: 'ANALYTICS_DASHBOARD',
        columns: body.columns || [],
        filters: body.filters || {},
        chartConfig: body.config || {},
        isActive: true,
      },
    });
    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}