export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET production metrics for a project
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const workPackageId = searchParams.get("workPackageId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    const where: Prisma.ProductionLogWhereInput = {
      ...(workPackageId ? { workPackageId } : {}),
      workPackage: { projectId }
    };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const metrics = await prisma.productionLog.findMany({
      where,
      include: {
        workPackage: { select: { id: true, name: true, number: true } },
        recordedBy: { select: { id: true, name: true } }
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Get production metrics error:", error);
    return NextResponse.json({ error: "Failed to fetch production metrics" }, { status: 500 });
  }
}

// POST create production metric
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
      workPackageId,
      shift,
      unit,
      plannedQuantity,
      actualQuantity,
      cumulativeQuantity,
      plannedProductivity,
      actualProductivity,
      crewSize,
      crewHours,
      weatherCondition,
      weatherImpact,
      date,
      notes
    } = body;

    if (!projectId || !workPackageId || !unit) {
      return NextResponse.json(
        { error: "Project ID, work package ID, and unit are required" },
        { status: 400 }
      );
    }

    const numericFields: Record<string, number | null | undefined> = {
      plannedQuantity,
      actualQuantity,
      cumulativeQuantity,
      plannedProductivity,
      actualProductivity,
      crewSize,
      crewHours
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (value != null && !Number.isFinite(value)) {
        const label = field
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/^./, char => char.toUpperCase());
        return NextResponse.json({ error: `${label} must be a valid number` }, { status: 400 });
      }
    }

    // Verify work package belongs to user's organization and project
    const workPackage = await prisma.workPackage.findFirst({
      where: {
        id: workPackageId,
        projectId,
        project: { organizationId: orgId }
      }
    });

    if (!workPackage) {
      return NextResponse.json({ error: "Work package not found" }, { status: 404 });
    }

    const metric = await prisma.productionLog.create({
      data: {
        workPackageId,
        shift: shift || null,
        unit,
        plannedQuantity: plannedQuantity ?? 0,
        actualQuantity: actualQuantity ?? 0,
        cumulativeQuantity: cumulativeQuantity ?? 0,
        plannedProductivity: plannedProductivity ?? null,
        actualProductivity: actualProductivity ?? null,
        crewSize: crewSize ?? 0,
        crewHours: crewHours ?? 0,
        weatherCondition: weatherCondition || null,
        weatherImpact: weatherImpact || null,
        date: date ? new Date(date) : new Date(),
        notes,
        recordedById: userId
      },
      include: {
        workPackage: { select: { id: true, name: true, number: true } },
        recordedBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error("Create production metric error:", error);
    return NextResponse.json({ error: "Failed to create production metric" }, { status: 500 });
  }
}
