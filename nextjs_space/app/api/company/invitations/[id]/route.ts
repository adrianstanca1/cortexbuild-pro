export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Get invitation details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: params.id,
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
        where: { id: params.id },
        data: {
          status: "PENDING",
          expiresAt: newExpiresAt,
        }
      });

      // Resend email
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const acceptUrl = `${baseUrl}/team-invite/accept/${invitation.token}`;
        
        await fetch("https://apps.abacus.ai/api/sendEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
          },
          body: JSON.stringify({
            toEmails: [invitation.email],
            subject: `Reminder: You're invited to join ${invitation.organization.name}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Team Invitation Reminder</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                  <p style="font-size: 16px;">Hello <strong>${invitation.name}</strong>,</p>
                  <p style="font-size: 16px;">
                    This is a reminder that you've been invited to join 
                    <strong>${invitation.organization.name}</strong> as a <strong>${invitation.role.replace("_", " ")}</strong>.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${acceptUrl}" 
                       style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Accept Invitation
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    This invitation will expire in 7 days.
                  </p>
                </div>
              </div>
            `
          })
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
        where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    await prisma.teamInvitation.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Invitation deleted" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 });
  }
}
