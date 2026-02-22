import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateQRCodeURI, generateTOTPSecret } from '@/lib/mfa';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Start MFA setup (returns secret and QR code data)
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; email: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const secret = generateTOTPSecret();

    // Create a pending MFA method (not enabled until verified)
    const mfaMethod = await prisma.userMFA.create({
      data: {
        userId: user.id,
        mfaType: 'TOTP',
        secret,
        status: 'PENDING_SETUP',
      },
    });

    const otpauthUri = generateQRCodeURI(secret, user.email);

    return NextResponse.json({
      id: mfaMethod.id,
      secret,
      qrCodeUri: otpauthUri,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    }, { status: 201 });
  } catch (error) {
    console.error('Setup MFA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
