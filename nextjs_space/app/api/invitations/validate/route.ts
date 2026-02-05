import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



// GET /api/invitations/validate?token=xxx - Validate invitation token (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await prisma.companyInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        companyName: true,
        ownerName: true,
        ownerEmail: true,
        status: true,
        entitlements: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { valid: false, error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }

    // Check if revoked
    if (invitation.status === 'REVOKED') {
      return NextResponse.json(
        { valid: false, error: 'This invitation has been revoked' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      // Update status to expired
      await prisma.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { valid: false, error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        companyName: invitation.companyName,
        ownerName: invitation.ownerName,
        ownerEmail: invitation.ownerEmail,
        entitlements: invitation.entitlements,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch {
    console.error('Error validating invitation:', error);
    return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 });
  }
}
