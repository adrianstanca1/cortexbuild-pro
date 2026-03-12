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
    const webhookId = searchParams.get('webhookId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const where = webhookId ? { webhookId } : {};
    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        include: { webhook: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.webhookDelivery.count({ where }),
    ]);
    return NextResponse.json({ deliveries, total, page, limit });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}