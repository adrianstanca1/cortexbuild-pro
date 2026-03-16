export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-service';
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

      // Resend email
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

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7c3aed; margin: 0;">CortexBuild Pro</h1>
              <p style="color: #6b7280; margin: 5px 0;">Construction Management Platform</p>
            </div>
            
            <h2 style="color: #1f2937; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
              Invitation Reminder
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              This is a reminder about your invitation to join <strong>CortexBuild Pro</strong> as the owner of <strong>${updated.companyName}</strong>.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #374151; margin-top: 0;">Your Company Details</h3>
              <p style="margin: 8px 0;"><strong>Company:</strong> ${updated.companyName}</p>
              <p style="margin: 8px 0;"><strong>Your Name:</strong> ${updated.ownerName}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${updated.ownerEmail}</p>
            </div>
            
            <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #5b21b6; margin-top: 0;">Enabled Features</h3>
              <ul style="color: #4b5563; padding-left: 20px;">
                ${enabledModules.map(m => `<li style="margin: 5px 0;">${m}</li>`).join('')}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invitation & Set Password
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              This invitation expires on ${newExpiry.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        `;

        await sendEmail({
          to: updated.ownerEmail,
          subject: `Reminder: You're invited to join ${updated.companyName} on CortexBuild Pro`,
          html: htmlBody,
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
