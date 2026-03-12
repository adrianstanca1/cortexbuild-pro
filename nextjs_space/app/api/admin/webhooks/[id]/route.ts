import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const webhook = await prisma.webhook.findUnique({
      where: { id: id },
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        deliveries: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ webhook });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const webhook = await prisma.webhook.update({
      where: { id: id },
      data: {
        name: body.name,
        url: body.url,
        events: body.events,
        secret: body.secret,
        isActive: body.isActive,
        headers: body.headers,
      },
    });
    return NextResponse.json({ webhook });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.webhookDelivery.deleteMany({ where: { webhookId: id } });
    await prisma.webhook.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}