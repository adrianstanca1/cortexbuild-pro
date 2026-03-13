import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const [permissions, roleCounts] = await Promise.all([
      prisma.permission.findMany({
        include: {
          grants: {
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
          },
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: organizationId ? { organizationId } : {},
      }),
    ]);

    const byResource: Record<string, unknown[]> = {};
    for (const p of permissions) {
      if (!byResource[p.resource]) byResource[p.resource] = [];
      byResource[p.resource].push(p);
    }

    return NextResponse.json(bigintSafe({ byResource, roleCounts, permissions }));
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
