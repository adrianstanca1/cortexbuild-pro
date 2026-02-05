import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Verify MFA code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const body = await request.json();
    const { methodId, code } = body;

    if (!methodId || !code) {
      return NextResponse.json({ error: 'Method ID and code are required' }, { status: 400 });
    }

    const mfaMethod = await prisma.userMFA.findFirst({
      where: { id: methodId, userId: user.id },
    });

    if (!mfaMethod) {
      return NextResponse.json({ error: 'MFA method not found' }, { status: 404 });
    }

    // TODO: Implement actual TOTP verification
    // For now, simulate verification
    const isValid = code.length === 6; // Simple validation

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Enable the MFA method after successful verification
    await prisma.userMFA.update({
      where: { id: methodId },
      data: {
        status: 'ACTIVE',
        isVerified: true,
        verifiedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'MFA enabled successfully' });
  } catch {
    console.error('Verify MFA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
