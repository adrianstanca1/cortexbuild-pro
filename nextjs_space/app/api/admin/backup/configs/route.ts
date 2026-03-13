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
    const where = organizationId ? { organizationId } : {};
    const configs = await prisma.backupConfiguration.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { backups: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(bigintSafe({ configs }));
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { organizationId, name, description, backupType, schedule, retention, isActive, includeDocuments, includeDatabase, includeMedia } = body;
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const config = await prisma.backupConfiguration.create({
      data: {
        organizationId: organizationId || null,
        name,
        description: description || null,
        backupType: backupType || 'FULL',
        schedule: schedule || null,
        retention: retention || 30,
        isActive: isActive ?? true,
        includeDocuments: includeDocuments ?? true,
        includeDatabase: includeDatabase ?? true,
        includeMedia: includeMedia ?? true,
      },
    });
    return NextResponse.json(bigintSafe({ config }), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}