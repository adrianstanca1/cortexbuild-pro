import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER', 'VIEWER']).optional(),
  organizationId: z.string(),
});

const TOKEN_EXPIRY_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (organizationId) where.organizationId = organizationId;
    if (status) where.status = status;

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = invitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role, organizationId } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          userId: existingUser.id,
          organizationId,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 409 }
        );
      }
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 409 }
      );
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role || 'FIELD_WORKER',
        organizationId,
        token,
        expiresAt,
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;

    // TODO: Send email notification
    // await sendInvitationEmail(email, acceptUrl, invitation.organization.name);

    return NextResponse.json(
      {
        invitation,
        acceptUrl,
        message: 'Invitation sent successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    await prisma.invitation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
  }
}
