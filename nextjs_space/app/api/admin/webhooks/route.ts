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
    const organizationId = searchParams.get('organizationId');
    const where = organizationId ? { organizationId } : {};
    const webhooks = await prisma.webhook.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ webhooks });
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
    const { organizationId, name, url, events, secret, isActive, headers } = body;
    if (!organizationId || !name || !url || !events) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const webhook = await prisma.webhook.create({
      data: {
        organizationId,
        name,
        url,
        events,
        secret: secret || null,
        isActive: isActive ?? true,
        headers: headers || {},
        createdById: session.user.id,
      },
      include: { organization: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ webhook }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}