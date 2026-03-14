export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        teamMemberships: {
          include: {
            organization: true,
            projectAssignments: {
              include: { project: true }
            }
          }
        },
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true,
            uploadedDocs: true,
            activities: true,
            createdRFIs: true,
            dailyReports: true,
            reportedIncidents: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, role, organizationId, phone, password, suspended } = body;

    const existingUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check email uniqueness if changing
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (organizationId !== undefined) updateData.organizationId = organizationId || null;
    if (phone !== undefined) updateData.phone = phone;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        phone: true,
        updatedAt: true,
        organization: { select: { id: true, name: true } }
      }
    });

    // Handle organization change - update team membership
    if (organizationId !== undefined && organizationId !== existingUser.organizationId) {
      // Remove old team membership
      if (existingUser.organizationId) {
        await prisma.teamMember.deleteMany({
          where: { userId: params.id, organizationId: existingUser.organizationId }
        });
      }
      // Create new team membership
      if (organizationId) {
        await prisma.teamMember.upsert({
          where: { userId_organizationId: { userId: params.id, organizationId } },
          update: {},
          create: {
            userId: params.id,
            organizationId,
            jobTitle: role === "ADMIN" ? "Administrator" : role === "PROJECT_MANAGER" ? "Project Manager" : "Team Member"
          }
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "updated user",
        entityType: "User",
        entityId: user.id,
        entityName: user.name,
        userId: session.user.id,
        details: `Updated user ${user.email}`
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent self-deletion
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete related team memberships first
    await prisma.teamMember.deleteMany({ where: { userId: params.id } });

    // Delete user
    await prisma.user.delete({ where: { id: params.id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "deleted user",
        entityType: "User",
        entityName: user.name,
        userId: session.user.id,
        details: `Deleted user ${user.email}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
