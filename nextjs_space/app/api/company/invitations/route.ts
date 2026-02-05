export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { parseEntitlements } from "@/lib/entitlements";
import { sendEmail, generateTeamInvitationEmail } from "@/lib/email-service";
import { Prisma } from "@prisma/client";

// GET - List team invitations for the organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    
    // Only COMPANY_OWNER, ADMIN, or SUPER_ADMIN can view invitations
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: Prisma.TeamInvitationWhereInput = {
      organizationId: user.organizationId,
    };

    if (status && status !== "all") {
      whereClause.status = status as any;
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: whereClause,
      include: {
        invitedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Get counts by status
    const counts = await prisma.teamInvitation.groupBy({
      by: ["status"],
      where: { organizationId: user.organizationId },
      _count: { status: true }
    });

    const statusCounts = {
      total: counts.reduce((sum: number, c: { _count: { status: number } }) => sum + c._count.status, 0),
      PENDING: counts.find((c: { status: string; _count: { status: number } }) => c.status === "PENDING")?._count.status || 0,
      ACCEPTED: counts.find((c: { status: string; _count: { status: number } }) => c.status === "ACCEPTED")?._count.status || 0,
      EXPIRED: counts.find((c: { status: string; _count: { status: number } }) => c.status === "EXPIRED")?._count.status || 0,
      REVOKED: counts.find((c: { status: string; _count: { status: number } }) => c.status === "REVOKED")?._count.status || 0,
    };

    return NextResponse.json({ invitations, counts: statusCounts });
  } catch (error) {
    console.error("Error fetching team invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

// POST - Create a new team invitation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    
    // Only COMPANY_OWNER, ADMIN, or SUPER_ADMIN can create invitations
    if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const body = await req.json();
    const { email, name, role, jobTitle, department } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: user.organizationId
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists in this organization" }, { status: 400 });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: user.organizationId,
        status: "PENDING"
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ error: "There's already a pending invitation for this email" }, { status: 400 });
    }

    // Check organization limits
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        _count: { select: { teamMembers: true } },
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const entitlements = parseEntitlements(organization.entitlements);
    const pendingCount = await prisma.teamInvitation.count({
      where: { organizationId: user.organizationId, status: "PENDING" }
    });

    if (organization._count.teamMembers + pendingCount >= entitlements.limits.maxUsers) {
      return NextResponse.json({ 
        error: `User limit reached (${entitlements.limits.maxUsers}). Please upgrade your plan.` 
      }, { status: 400 });
    }

    // Validate role - non-owners can only invite roles below their level
    const validRoles = ["ADMIN", "PROJECT_MANAGER", "FIELD_WORKER"];
    const inviteRole = role || "FIELD_WORKER";
    
    if (!validRoles.includes(inviteRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // ADMIN can't invite other ADMINs
    if (user.role === "ADMIN" && inviteRole === "ADMIN") {
      return NextResponse.json({ error: "You cannot invite admin users" }, { status: 403 });
    }

    // Create the invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const invitation = await prisma.teamInvitation.create({
      data: {
        email: email.toLowerCase(),
        name,
        role: inviteRole,
        jobTitle,
        department,
        organizationId: user.organizationId,
        invitedById: user.id,
        expiresAt,
      },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true } }
      }
    });

    // Send invitation email using dynamic email service
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const acceptUrl = `${baseUrl}/team-invite/accept/${invitation.token}`;
      
      // Use the unified email service (tries SendGrid first, then falls back to Abacus)
      const emailHtml = generateTeamInvitationEmail({
        memberName: name,
        inviterName: invitation.invitedBy.name || "A team member",
        organizationName: organization.name,
        role: inviteRole,
        acceptUrl
      });

      const emailResult = await sendEmail({
        to: email.toLowerCase(),
        subject: `You're invited to join ${organization.name} on CortexBuild Pro`,
        html: emailHtml,
        from: { name: "CortexBuild Pro" }
      });

      if (!emailResult.success) {
        console.warn("Email sending warning:", emailResult.error, "(provider:", emailResult.provider, ")");
      } else {
        console.log("Team invitation email sent via:", emailResult.provider);
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "Invited team member",
        entityType: "TeamInvitation",
        entityId: invitation.id,
        entityName: name,
        details: `Invited ${email} as ${inviteRole}`,
        userId: user.id,
      }
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error("Error creating team invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
