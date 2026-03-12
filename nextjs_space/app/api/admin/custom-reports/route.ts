import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const dataSource = searchParams.get('type'); // client sends 'type', map to dataSource
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { isActive: true };
    if (dataSource && dataSource !== 'all' && dataSource !== 'ANALYTICS_DASHBOARD') {
      where.dataSource = dataSource;
    }
    if (dataSource === 'ANALYTICS_DASHBOARD') {
      // Exclude dashboards from reports list
      where.NOT = { dataSource: 'ANALYTICS_DASHBOARD' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.customReport.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { executions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customReport.count({ where }),
    ]);
    return NextResponse.json({ reports, total, page, limit });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { organizationId, name, description, type, config, filters } = body;
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Get an org if not provided
    let orgId = organizationId;
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
      orgId = firstOrg?.id || null;
    }

    const report = await prisma.customReport.create({
      data: {
        organizationId: orgId,
        name,
        description: description || null,
        dataSource: type || 'CUSTOM',
        columns: config?.columns || [],
        filters: filters || {},
        isActive: true,
      },
      include: { organization: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}