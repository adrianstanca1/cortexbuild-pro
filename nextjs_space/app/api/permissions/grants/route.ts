import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get permission grants for organization
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    const where: any = { organizationId: user.organizationId };
    if (userId) {
      where.userId = userId;
    }
    if (role) {
      where.role = role;
    }

    const grants = await prisma.permissionGrant.findMany({
      where,
      include: {
        permission: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(grants);
  } catch (error) {
    console.error('Get permission grants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Grant a permission
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
    const { permissionId, userId, role } = body;

    if (!permissionId || (!userId && !role)) {
      return NextResponse.json({ error: 'Permission ID and either user ID or role are required' }, { status: 400 });
    }

    if (userId && role) {
      return NextResponse.json({ error: 'Provide either userId or role, not both' }, { status: 400 });
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if user exists in organization
    if (userId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, organizationId: user.organizationId },
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
    }

    const grant = await prisma.permissionGrant.create({
      data: {
        permissionId,
        userId: userId || null,
        role: role || null,
        organizationId: user.organizationId,
        grantedById: user.id,
      },
      include: {
        permission: true,
        user: true,
      },
    });

    return NextResponse.json(grant, { status: 201 });
  } catch (error) {
    console.error('Grant permission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
