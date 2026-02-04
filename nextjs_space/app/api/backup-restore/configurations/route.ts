import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get all backup configurations for organization
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

    const configurations = await prisma.backupConfiguration.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(configurations);
  } catch (error) {
    console.error('Get backup configurations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new backup configuration
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
    const { name, schedule, retentionDays, isEnabled, includeFiles, includeDatabase } = body;

    if (!name || !schedule) {
      return NextResponse.json({ error: 'Name and schedule are required' }, { status: 400 });
    }

    const configuration = await prisma.backupConfiguration.create({
      data: {
        name,
        schedule,
        retentionDays: retentionDays || 30,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        includeFiles: includeFiles !== undefined ? includeFiles : true,
        includeDatabase: includeDatabase !== undefined ? includeDatabase : true,
        organizationId: user.organizationId,
        createdById: user.id,
      },
    });

    return NextResponse.json(configuration, { status: 201 });
  } catch (error) {
    console.error('Create backup configuration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
