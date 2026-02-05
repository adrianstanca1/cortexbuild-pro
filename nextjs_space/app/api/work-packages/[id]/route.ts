export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single work package
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    const workPackage = await prisma.workPackage.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        responsibleParty: { select: { id: true, name: true, email: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        dependencies: {
          include: {
            precedingPackage: { select: { id: true, name: true, code: true } }
          }
        },
        dependents: {
          include: {
            dependentPackage: { select: { id: true, name: true, code: true } }
          }
        }
      }
    });

    if (!workPackage) {
      return NextResponse.json({ error: "Work package not found" }, { status: 404 });
    }

    // Verify belongs to user's organization
    if (workPackage.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ workPackage });
  } catch (error) {
    console.error("Get work package error:", error);
    return NextResponse.json({ error: "Failed to fetch work package" }, { status: 500 });
  }
}

// PUT update work package
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    // Verify work package exists and belongs to user's organization
    const existing = await prisma.workPackage.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Work package not found" }, { status: 404 });
    }

    if (existing.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      code,
      scopeDescription,
      budget,
      startDate,
      endDate,
      responsiblePartyId,
      status,
      priority,
      progressPercent,
      isCriticalPath,
      orderIndex
    } = body;

    // If code is being changed, check uniqueness
    if (code && code !== existing.code) {
      const duplicate = await prisma.workPackage.findUnique({
        where: { projectId_code: { projectId: existing.projectId, code } }
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Work package code already exists for this project" },
          { status: 400 }
        );
      }
    }

    const workPackage = await prisma.workPackage.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        code: code || existing.code,
        scopeDescription: scopeDescription !== undefined ? scopeDescription : existing.scopeDescription,
        budget: budget !== undefined ? budget : existing.budget,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        responsiblePartyId: responsiblePartyId !== undefined ? responsiblePartyId : existing.responsiblePartyId,
        status: status || existing.status,
        priority: priority || existing.priority,
        progressPercent: progressPercent !== undefined ? progressPercent : existing.progressPercent,
        isCriticalPath: isCriticalPath !== undefined ? isCriticalPath : existing.isCriticalPath,
        orderIndex: orderIndex !== undefined ? orderIndex : existing.orderIndex
      },
      include: {
        responsibleParty: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } }
      }
    });

    // Broadcast to organization
    if (orgId) {
      await broadcastToOrganization(orgId, {
        type: "work_package_updated",
        workPackage
      });
    }

    return NextResponse.json({ workPackage });
  } catch (error) {
    console.error("Update work package error:", error);
    return NextResponse.json({ error: "Failed to update work package" }, { status: 500 });
  }
}

// DELETE work package
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    // Verify work package exists and belongs to user's organization
    const existing = await prisma.workPackage.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Work package not found" }, { status: 404 });
    }

    if (existing.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.workPackage.delete({ where: { id } });

    // Broadcast to organization
    if (orgId) {
      await broadcastToOrganization(orgId, {
        type: "work_package_deleted",
        workPackageId: id
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete work package error:", error);
    return NextResponse.json({ error: "Failed to delete work package" }, { status: 500 });
  }
}
