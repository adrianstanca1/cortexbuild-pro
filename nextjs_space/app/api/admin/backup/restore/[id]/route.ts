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
    const record = await prisma.backupRecord.findUnique({
      where: { id: id },
      include: { configuration: { select: { id: true, name: true } } },
    });
    if (!record) return NextResponse.json({ error: 'Backup record not found' }, { status: 404 });
    if (record.status !== 'COMPLETED') return NextResponse.json({ error: 'Only completed backups can be restored' }, { status: 400 });

    const restoreRecord = await prisma.backupRecord.create({
      data: {
        configId: record.configId,
        organizationId: record.organizationId,
        backupType: record.backupType,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        fileName: `restore-from-${record.fileName}`,
        filePath: record.filePath,
        storageLocation: record.storageLocation,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    setTimeout(async () => {
      try {
        await prisma.backupRecord.update({
          where: { id: restoreRecord.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      } catch {}
    }, 5000);

    return NextResponse.json({ restoreRecord: JSON.parse(JSON.stringify(restoreRecord, (_, v) => typeof v === 'bigint' ? v.toString() : v)), message: 'Restore initiated' });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}