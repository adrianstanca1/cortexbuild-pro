import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const where = organizationId ? { organizationId } : {};
    const quotas = await prisma.resourceQuota.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { usage: true } },
      },
      orderBy: [{ organizationId: 'asc' }, { quotaType: 'asc' }],
    });
    return NextResponse.json(bigintSafe({ quotas }));
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
    const { organizationId, quotaType, name, limitValue, period, warningThreshold } = body;
    if (!organizationId || !quotaType || !name || limitValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const quota = await prisma.resourceQuota.create({
      data: {
        organizationId,
        quotaType,
        name,
        limitValue: BigInt(limitValue),
        period: period || 'MONTHLY',
        warningThreshold: warningThreshold ?? 0.8,
      },
    });
    return NextResponse.json(bigintSafe({ quota: serializeBigInt(quota) }), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}