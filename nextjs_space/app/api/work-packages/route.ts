export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// GET all work packages for a project
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const workPackages = await prisma.workPackage.findMany({
      where: { projectId },
      include: {
        responsibleParty: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, title: true, status: true } },
        dependencies: {
          include: {
            precedingPackage: { select: { id: true, name: true, code: true } }
          }
        },
        dependents: {
          include: {
            dependentPackage: { select: { id: true, name: true, code: true } }
          }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { orderIndex: "asc" }
    });

    return NextResponse.json({ workPackages });
  } catch (error) {
    console.error("Get work packages error:", error);
    return NextResponse.json({ error: "Failed to fetch work packages" }, { status: 500 });
  }
}

// POST create new work package
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    const body = await request.json();
    const {
      projectId,
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
      isCriticalPath,
      orderIndex
    } = body;

    if (!projectId || !name || !code) {
      return NextResponse.json(
        { error: "Project ID, name, and code are required" },
        { status: 400 }
      );
    }

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if code already exists for this project
    const existing = await prisma.workPackage.findUnique({
      where: { projectId_code: { projectId, code } }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Work package code already exists for this project" },
        { status: 400 }
      );
    }

    const workPackage = await prisma.workPackage.create({
      data: {
        projectId,
        name,
        description,
        code,
        scopeDescription,
        budget: budget || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        responsiblePartyId: responsiblePartyId || null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        isCriticalPath: isCriticalPath || false,
        orderIndex: orderIndex ?? 0
      },
      include: {
        responsibleParty: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } }
      }
    });

    // Broadcast to organization for real-time updates
    if (orgId) {
      await broadcastToOrganization(orgId, {
        type: "work_package_created",
        workPackage
      });
    }

    return NextResponse.json({ workPackage }, { status: 201 });
  } catch (error) {
    console.error("Create work package error:", error);
    return NextResponse.json({ error: "Failed to create work package" }, { status: 500 });
  }
}
