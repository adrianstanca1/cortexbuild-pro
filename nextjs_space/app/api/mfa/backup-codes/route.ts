import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Generate backup codes
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Check if user has MFA enabled
    const mfaMethod = await prisma.mFAMethod.findFirst({
      where: { userId: user.id, isEnabled: true },
    });

    if (!mfaMethod) {
      return NextResponse.json({ error: 'MFA must be enabled before generating backup codes' }, { status: 400 });
    }

    // Generate 10 backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
    }

    // Store hashed backup codes
    const hashedCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await prisma.mFABackupCode.createMany({
      data: hashedCodes.map(hashedCode => ({
        userId: user.id,
        code: hashedCode,
        isUsed: false,
      })),
    });

    return NextResponse.json({
      backupCodes,
      message: 'Save these backup codes in a secure location. Each code can only be used once.',
    }, { status: 201 });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
