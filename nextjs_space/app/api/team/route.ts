export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const teamMembers = await prisma.teamMember.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return NextResponse.json({ teamMembers });
  } catch {
    console.error("Get team error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN" && userRole !== "PROJECT_MANAGER" && userRole !== "COMPANY_OWNER" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const currentUserId = (session.user as { id?: string })?.id || '';
    const body = await request.json();
    const { name, email, role, jobTitle } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user with default password
      const hashedPassword = await bcrypt.hash("welcome123", 12);
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          password: hashedPassword,
          role: role || "FIELD_WORKER",
          organizationId: orgId
        }
      });
    }

    // Check if already a team member
    const existing = await prisma.teamMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
    });

    if (existing) {
      return NextResponse.json({ error: "User is already a team member" }, { status: 400 });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        jobTitle: jobTitle?.trim() || null
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "added team member",
        entityType: "TeamMember",
        entityId: teamMember.id,
        entityName: user.name || '',
        userId: currentUserId
      }
    });

    // Broadcast real-time event to organization
    broadcastToOrganization(orgId, {
      type: 'team_member_added',
      timestamp: new Date().toISOString(),
      payload: {
        teamMember: {
          id: teamMember.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          jobTitle: teamMember.jobTitle
        },
        addedBy: currentUserId
      }
    });

    return NextResponse.json({ teamMember });
  } catch {
    console.error("Add team member error:", error);
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}
