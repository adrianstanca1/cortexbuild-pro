import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            lastLogin: true
          }
        },
        projects: {
          include: {
            manager: { select: { name: true } },
            _count: { select: { tasks: true, documents: true } }
          }
        },
        teamMembers: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, logoUrl } = body;

    const existingOrg = await prisma.organization.findUnique({ where: { id: id } });
    if (!existingOrg) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check slug uniqueness if changing
    if (slug && slug !== existingOrg.slug) {
      const slugExists = await prisma.organization.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug.toLowerCase().replace(/\s+/g, "-");
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const organization = await prisma.organization.update({
      where: { id: id },
      data: updateData
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "updated organization",
        entityType: "Organization",
        entityId: organization.id,
        entityName: organization.name,
        userId: session.user.id,
        details: `Updated organization ${organization.name}`
      }
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: id },
      include: { count: { select: { users: true, projects: true } } }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if organization has users or projects
    if (organization._count.users > 0 || organization._count.projects > 0) {
      return NextResponse.json(
        { error: "Cannot delete organization with existing users or projects. Please reassign or delete them first." },
        { status: 400 }
      );
    }

    await prisma.organization.delete({ where: { id: id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "deleted organization",
        entityType: "Organization",
        entityName: organization.name,
        userId: session.user.id,
        details: `Deleted organization ${organization.name}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
