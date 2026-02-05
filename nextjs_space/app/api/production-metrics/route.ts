export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    const where: any = { projectId };
    
    if (workPackageId) {
      where.workPackageId = workPackageId;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const metrics = await prisma.productionMetric.findMany({
      where,
      include: {
        workPackage: { select: { id: true, name: true, code: true } },
        dailyReport: { select: { id: true, reportDate: true } },
        createdBy: { select: { id: true, name: true } }
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
      dailyReportId,
      name,
      unit,
      plannedQuantity,
      actualQuantity,
      date,
      notes
    } = body;

    if (!projectId || !name || !unit) {
      return NextResponse.json(
        { error: "Project ID, name, and unit are required" },
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

    const metric = await prisma.productionMetric.create({
      data: {
        projectId,
        workPackageId: workPackageId || null,
        dailyReportId: dailyReportId || null,
        name,
        unit,
        plannedQuantity: plannedQuantity || 0,
        actualQuantity: actualQuantity || 0,
        date: date ? new Date(date) : new Date(),
        notes,
        createdById: userId
      },
      include: {
        workPackage: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error("Create production metric error:", error);
    return NextResponse.json({ error: "Failed to create production metric" }, { status: 500 });
  }
}
