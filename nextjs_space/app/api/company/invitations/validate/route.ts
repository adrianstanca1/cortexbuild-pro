import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";

// GET - Validate invitation token (public endpoint)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { name: true, logoUrl: true }
        },
        invitedBy: {
          select: { name: true }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      // Update status to expired if it was pending
      if (invitation.status === "PENDING") {
        await prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" }
        });
      }
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Check status
    if (invitation.status !== "PENDING") {
      const messages: Record<string, string> = {
        ACCEPTED: "This invitation has already been accepted",
        REVOKED: "This invitation has been revoked",
        EXPIRED: "This invitation has expired",
      };
      return NextResponse.json({ 
        error: messages[invitation.status] || "Invalid invitation status" 
      }, { status: 410 });
    }

    // Check if user with this email already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: invitation.email,
        organizationId: invitation.organizationId
      }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: "An account with this email already exists. Please login instead." 
      }, { status: 409 });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        jobTitle: invitation.jobTitle,
        department: invitation.department,
        organization: invitation.organization,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
      }
    });
  } catch {
    console.error("Error validating invitation:", error);
    return NextResponse.json({ error: "Failed to validate invitation" }, { status: 500 });
  }
}
