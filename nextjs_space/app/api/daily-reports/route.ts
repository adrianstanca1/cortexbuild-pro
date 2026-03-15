import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  getOrganizationContext,
  parseQueryParams,
  getPagination,
  getDateRange,
  buildOrgScopedWhere,
  errorResponse,
  withAuthHandler,
} from "@/lib/api-utils";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export const GET = withAuthHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const { projectId, searchParams: _searchParams } = parseQueryParams(request);
  const { page, limit, skip } = getPagination(request);
  const { startDate, endDate } = getDateRange(request);

  // Validate dates if provided
  if (startDate && isNaN(startDate.getTime())) {
    return errorResponse("BAD_REQUEST", "Invalid startDate format");
  }
  if (endDate && isNaN(endDate.getTime())) {
    return errorResponse("BAD_REQUEST", "Invalid endDate format");
  }

  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;

  const where = buildOrgScopedWhere(context!.organizationId!, projectId, {
    ...(Object.keys(dateFilter).length > 0 && { reportDate: dateFilter }),
  });

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        photos: true,
      },
      orderBy: { reportDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.dailyReport.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const POST = withAuthHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const body = await request.json();
  const {
    projectId,
    reportDate,
    weather,
    temperature,
    workPerformed,
    materialsUsed,
    equipmentUsed,
    visitors,
    delays,
    safetyNotes,
    manpowerCount,
  } = body;

  if (!projectId || !reportDate) {
    return errorResponse("BAD_REQUEST", "Project and report date are required");
  }

  // Check if report already exists for this date
  const existing = await prisma.dailyReport.findUnique({
    where: {
      projectId_reportDate: { projectId, reportDate: new Date(reportDate) },
    },
  });

  if (existing) {
    return errorResponse("CONFLICT", "A report already exists for this date");
  }

  const report = await prisma.dailyReport.create({
    data: {
      projectId,
      reportDate: new Date(reportDate),
      weather: weather || "SUNNY",
      temperature,
      workPerformed,
      materialsUsed,
      equipmentUsed,
      visitors,
      delays,
      safetyNotes,
      manpowerCount: manpowerCount || 0,
      createdById: context!.userId,
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "created",
      entityType: "daily_report",
      entityId: report.id,
      entityName: `Daily Report - ${new Date(reportDate).toLocaleDateString()}`,
      userId: context!.userId,
      projectId,
    },
  });

  // Get organization for broadcasting
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (project?.organizationId) {
    broadcastToOrganization(project.organizationId, {
      type: "daily_report_created",
      payload: {
        ...report,
        createdByName: context!.userName,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(report, { status: 201 });
});
