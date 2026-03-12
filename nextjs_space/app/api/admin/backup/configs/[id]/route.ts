import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const config = await prisma.backupConfiguration.findUnique({
      where: { id: id },
      include: {
        organization: { select: { id: true, name: true } },
        backups: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ config: serializeBigInt(config) });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const config = await prisma.backupConfiguration.update({
      where: { id: id },
      data: {
        name: body.name,
        description: body.description,
        schedule: body.schedule,
        retention: body.retention,
        isActive: body.isActive,
        includeDocuments: body.includeDocuments,
        includeDatabase: body.includeDatabase,
        includeMedia: body.includeMedia,
      },
    });
    return NextResponse.json({ config });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.backupRecord.deleteMany({ where: { configId: id } });
    await prisma.backupConfiguration.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}