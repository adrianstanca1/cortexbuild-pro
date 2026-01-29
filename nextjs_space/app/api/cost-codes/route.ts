export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET all cost codes for a project
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

    const costCodes = await prisma.costCode.findMany({
      where: { projectId, isActive: true },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, budgetAmount: true } },
        _count: { select: { costItems: true, children: true } }
      },
      orderBy: { code: "asc" }
    });

    return NextResponse.json({ costCodes });
  } catch (error) {
    console.error("Get cost codes error:", error);
    return NextResponse.json({ error: "Failed to fetch cost codes" }, { status: 500 });
  }
}

// POST create new cost code
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const body = await request.json();
    const {
      projectId,
      code,
      name,
      description,
      level,
      parentId,
      budgetAmount,
      varianceThreshold
    } = body;

    if (!projectId || !code || !name) {
      return NextResponse.json(
        { error: "Project ID, code, and name are required" },
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
    const existing = await prisma.costCode.findUnique({
      where: { projectId_code: { projectId, code } }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Cost code already exists for this project" },
        { status: 400 }
      );
    }

    const costCode = await prisma.costCode.create({
      data: {
        projectId,
        code,
        name,
        description,
        level: level || 1,
        parentId: parentId || null,
        budgetAmount: budgetAmount || 0,
        varianceThreshold: varianceThreshold || 10
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        _count: { select: { costItems: true, children: true } }
      }
    });

    return NextResponse.json({ costCode }, { status: 201 });
  } catch (error) {
    console.error("Create cost code error:", error);
    return NextResponse.json({ error: "Failed to create cost code" }, { status: 500 });
  }
}
