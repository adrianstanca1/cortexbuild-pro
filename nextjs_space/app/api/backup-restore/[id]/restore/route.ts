import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Restore from a backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions - only SUPER_ADMIN and COMPANY_OWNER can restore' }, { status: 403 });
    }

    const backup = await prisma.backupRecord.findFirst({
      where: { id: id, organizationId: user.organizationId, status: 'COMPLETED' },
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found or not completed' }, { status: 404 });
    }

    const body = await request.json();
    const { restoreFiles, restoreDatabase } = body;

    // TODO: Trigger actual restore process asynchronously
    // For now, just update the backup record status
    await prisma.backupRecord.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({ 
      message: 'Restore initiated',
      backupId: id,
      restoreFiles: restoreFiles !== undefined ? restoreFiles : true,
      restoreDatabase: restoreDatabase !== undefined ? restoreDatabase : true,
    }, { status: 201 });
  } catch {
    console.error('Restore backup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
