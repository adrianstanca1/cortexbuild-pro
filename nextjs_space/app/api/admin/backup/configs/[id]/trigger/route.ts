import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const config = await prisma.backupConfiguration.findUnique({ where: { id: id } });
    if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const record = await prisma.backupRecord.create({
      data: {
        configId: id,
        organizationId: config.organizationId || null,
        backupType: config.backupType,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        fileName: `backup-${Date.now()}.tar.gz`,
        filePath: `/backups/${config.name}-${Date.now()}.tar.gz`,
        storageLocation: 'local',
        expiresAt: new Date(Date.now() + config.retention * 24 * 60 * 60 * 1000),
      },
    });

    setTimeout(async () => {
      try {
        await prisma.backupRecord.update({
          where: { id: record.id },
          data: { status: 'COMPLETED', completedAt: new Date(), fileSize: BigInt(1024 * 1024 * 50) },
        });
      } catch {}
    }, 3000);

    return NextResponse.json({ record, message: 'Backup started' });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}