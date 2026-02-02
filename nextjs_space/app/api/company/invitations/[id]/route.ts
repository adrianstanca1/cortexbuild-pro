import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { sendTeamMemberInvitationNotification } from "@/lib/email-notifications";

// GET - Get invitation details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      include: {
        invitedBy: { select: { name: true, email: true } },
        organization: { select: { name: true } }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 });
  }
}

// PATCH - Resend or revoke invitation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true } }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (action === "resend") {
      if (invitation.status !== "PENDING" && invitation.status !== "EXPIRED") {
        return NextResponse.json({ error: "Can only resend pending or expired invitations" }, { status: 400 });
      }

      // Update expiry
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      const updated = await prisma.teamInvitation.update({
        where: { id: id },
        data: {
          status: "PENDING",
          expiresAt: newExpiresAt,
        }
      });

      // Resend email using notification API
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const acceptUrl = `${baseUrl}/team-invite/accept/${invitation.token}`;
        
        await sendTeamMemberInvitationNotification({
          memberName: invitation.name,
          memberEmail: invitation.email,
          inviterName: invitation.invitedBy.name || "A team member",
          organizationName: invitation.organization.name,
          role: invitation.role,
          jobTitle: invitation.jobTitle || undefined,
          department: invitation.department || undefined,
          acceptUrl,
          expiresAt: newExpiresAt
        });
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }

      return NextResponse.json({ invitation: updated, message: "Invitation resent" });
    }

    if (action === "revoke") {
      if (invitation.status !== "PENDING") {
        return NextResponse.json({ error: "Can only revoke pending invitations" }, { status: 400 });
      }

      const updated = await prisma.teamInvitation.update({
        where: { id: id },
        data: { status: "REVOKED" }
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "Revoked team invitation",
          entityType: "TeamInvitation",
          entityId: invitation.id,
          entityName: invitation.name,
          userId: user.id,
        }
      });

      return NextResponse.json({ invitation: updated, message: "Invitation revoked" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json({ error: "Failed to update invitation" }, { status: 500 });
  }
}

// DELETE - Delete invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    await prisma.teamInvitation.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Invitation deleted" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 });
  }
}
