import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendCompanyInvitationNotification } from '@/lib/email-notifications';
import crypto from 'crypto';

// GET /api/admin/invitations/[id] - Get invitation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const invitation = await prisma.companyInvitation.findUnique({
      where: { id },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { users: true, projects: true } },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}

// PATCH /api/admin/invitations/[id] - Update invitation (resend, revoke)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, entitlements } = body;

    const invitation = await prisma.companyInvitation.findUnique({ where: { id } });
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Handle different actions
    if (action === 'resend') {
      if (invitation.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Can only resend pending invitations' },
          { status: 400 }
        );
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomBytes(32).toString('hex');
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      const updated = await prisma.companyInvitation.update({
        where: { id },
        data: {
          token: newToken,
          expiresAt: newExpiry,
          ...(entitlements && { entitlements }),
        },
      });

      // Resend email using notification API
      try {
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const acceptUrl = `${appUrl}/invitation/accept/${newToken}`;
        const parsedEntitlements = (entitlements || updated.entitlements) as Record<string, Record<string, unknown>>;

        const enabledModules = Object.entries(parsedEntitlements.modules || {})
          .filter(([_, enabled]) => enabled)
          .map(([key]) => {
            const labels: Record<string, string> = {
              projects: 'Projects', tasks: 'Tasks', documents: 'Documents',
              rfis: 'RFIs', submittals: 'Submittals', changeOrders: 'Change Orders',
              dailyReports: 'Daily Reports', safety: 'Safety Management',
              reports: 'Reports & Analytics', team: 'Team Management',
            };
            return labels[key] || key;
          });

        await sendCompanyInvitationNotification({
          ownerName: updated.ownerName,
          companyName: updated.companyName,
          ownerEmail: updated.ownerEmail,
          acceptUrl,
          expiresAt: newExpiry,
          enabledModules,
          storageGB: (parsedEntitlements.limits as Record<string, number>)?.storageGB || 10,
          maxUsers: (parsedEntitlements.limits as Record<string, number>)?.maxUsers || 50
        });
      } catch (emailError) {
        console.error('Failed to resend invitation email:', emailError);
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'Invitation Resent',
          entityType: 'CompanyInvitation',
          entityId: id,
          entityName: updated.companyName,
          details: `Resent invitation to ${updated.ownerEmail}`,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ invitation: updated, message: 'Invitation resent successfully' });
    }

    if (action === 'revoke') {
      if (invitation.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Can only revoke pending invitations' },
          { status: 400 }
        );
      }

      const updated = await prisma.companyInvitation.update({
        where: { id },
        data: { status: 'REVOKED' },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'Invitation Revoked',
          entityType: 'CompanyInvitation',
          entityId: id,
          entityName: updated.companyName,
          details: `Revoked invitation for ${updated.ownerEmail}`,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ invitation: updated, message: 'Invitation revoked' });
    }

    // Update entitlements only
    if (entitlements && invitation.status === 'PENDING') {
      const updated = await prisma.companyInvitation.update({
        where: { id },
        data: { entitlements },
      });
      return NextResponse.json({ invitation: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
  }
}

// DELETE /api/admin/invitations/[id] - Delete invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const invitation = await prisma.companyInvitation.findUnique({ where: { id } });
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Cannot delete accepted invitations' },
        { status: 400 }
      );
    }

    await prisma.companyInvitation.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Invitation Deleted',
        entityType: 'CompanyInvitation',
        entityId: id,
        entityName: invitation.companyName,
        details: `Deleted invitation for ${invitation.ownerEmail}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Invitation deleted' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
  }
}
