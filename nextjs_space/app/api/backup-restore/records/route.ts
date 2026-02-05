import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get all backup records for organization
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const records = await prisma.backupRecord.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        configuration: true,
      },
    });

    return NextResponse.json(records);
  } catch {
    console.error('Get backup records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Trigger a new backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { configurationId, backupType } = body;

    if (!configurationId) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 });
    }

    const configuration = await prisma.backupConfiguration.findFirst({
      where: { id: configurationId, organizationId: user.organizationId },
    });

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    const record = await prisma.backupRecord.create({
      data: {
        configId: configurationId,
        backupType: backupType || 'MANUAL',
        status: 'PENDING',
        fileName: `backup-${Date.now()}.zip`, // Placeholder filename
        organizationId: user.organizationId,
      },
    });

    // TODO: Trigger actual backup process asynchronously

    return NextResponse.json(record, { status: 201 });
  } catch {
    console.error('Trigger backup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
