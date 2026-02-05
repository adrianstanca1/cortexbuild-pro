import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get user's MFA methods
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const mfaMethods = await prisma.userMFA.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        mfaType: true,
        status: true,
        isVerified: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return NextResponse.json(mfaMethods);
  } catch {
    console.error('Get MFA methods error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disable MFA
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Disable all MFA methods for the user
    await prisma.userMFA.updateMany({
      where: { userId: user.id },
      data: { status: 'DISABLED' },
    });

    return NextResponse.json({ success: true });
  } catch {
    console.error('Disable MFA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
