import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  withAuthHandler,
  sanitizeEntityFields,
  broadcastEntityEvent,
  logActivity,
  errorResponse,
} from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

/**
 * GET /api/dayworks - List all dayworks
 * Query params:
 *   - projectId (optional): Filter by project
 *   - page, pageSize: Pagination
 *   - startDate, endDate: Date range filter
 */
export const GET = withAuthHandler(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const skip = (page - 1) * pageSize;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Build where clause
  const where: Record<string, unknown> = {};

  if (projectId) {
    where.projectId = projectId;
  }

  if (startDate || endDate) {
    where.reportDate = {};
    if (startDate) {
      where.reportDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.reportDate.lte = new Date(endDate);
    }
  }

  // For users without organization, filter by project's organization
  if (!context.organizationId && !projectId) {
    return errorResponse("FORBIDDEN", "Must specify projectId or belong to an organization");
  }

  if (context.organizationId && !projectId) {
    where.project = { organizationId: context.organizationId };
  }

  const [dayworks, totalCount] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        materialEntries: true,
        equipmentEntries: true,
        laborEntries: true,
        photos: true,
      },
      orderBy: { reportDate: "desc" },
      take: pageSize,
      skip,
    }),
    prisma.dailyReport.count({ where }),
  ]);

  // Map DailyReport to Daywork format for the component
  const formattedDayworks = dayworks.map((d) => ({
    id: d.id,
    date: d.reportDate.toISOString().split('T')[0],
    project_id: d.projectId,
    project: d.project,
    weather: d.weather?.toString().toLowerCase().replace('_', ' ') || 'SUNNY',
    crew_size: d.manpowerCount?.toString() || '',
    work_description: d.workPerformed || '',
    progress_percentage: '', // Not in schema, can be added later
    materials: d.materialEntries.map((m) => ({
      name: m.materialName,
      quantity: m.quantityUsed,
      unit: m.unit,
    })),
    equipment: d.equipmentEntries.map((e) => ({
      name: e.equipmentName,
      hours: e.hoursUsed,
    })),
    labor: d.laborEntries.map((l) => ({
      trade: l.trade,
      company: l.company,
      classification: l.classification,
      regularHours: l.regularHours,
      overtimeHours: l.overtimeHours,
      doubleTimeHours: l.doubleTimeHours,
      headcount: l.headcount,
      workArea: l.workArea,
      workDescription: l.workDescription,
    })),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return NextResponse.json(bigintSafe({
    dayworks: formattedDayworks,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  }));
});

/**
 * POST /api/dayworks - Create new daywork
 * Body:
 *   - date: string (ISO date)
 *   - project_id: string
 *   - weather: string (SUNNY, CLOUDY, RAINY, STORMY, SNOWY, WINDY)
 *   - crew_size: number (manpowerCount)
 *   - work_description: string (workPerformed)
 *   - materials: array of { name, quantity, unit }
 *   - equipment: array of { name, hours }
 *   - labor: array of { trade, company, classification, regularHours, overtimeHours, doubleTimeHours, headcount }
 */
export const POST = withAuthHandler(async (request: NextRequest, context) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const body = await request.json();
  const {
    date,
    project_id,
    weather,
    crew_size,
    work_description,
    progress_percentage,
    materials,
    equipment,
    labor,
  } = body;

  // Validate required fields
  if (!date || !project_id) {
    return errorResponse("BAD_REQUEST", "Date and project_id are required");
  }

  if (!work_description?.trim()) {
    return errorResponse("BAD_REQUEST", "Work description is required");
  }

  // Map weather string to enum
  const weatherEnumMap: Record<string, string> = {
    'sunny': 'SUNNY',
    'partly cloudy': 'SUNNY',
    'cloudy': 'CLOUDY',
    'overcast': 'CLOUDY',
    'light rain': 'RAINY',
    'heavy rain': 'RAINY',
    'drizzle': 'RAINY',
    'snow': 'SNOWY',
    'windy': 'WINDY',
    'foggy': 'CLOUDY',
  };
  const weatherEnum = weatherEnumMap[(weather || 'sunny').toLowerCase()] || 'SUNNY';

  // Verify project exists and belongs to organization
  const project = await prisma.project.findUnique({
    where: { id: project_id },
    select: { id: true, organizationId: true },
  });

  if (!project) {
    return errorResponse("NOT_FOUND", "Project not found");
  }

  if (project.organizationId !== context.organizationId) {
    return errorResponse("FORBIDDEN", "Project does not belong to your organization");
  }

  // Check for existing report on same date
  const existing = await prisma.dailyReport.findUnique({
    where: {
      projectId_reportDate: {
        projectId: project_id,
        reportDate: new Date(date),
      },
    },
  });

  if (existing) {
    return errorResponse("CONFLICT", "Daily report already exists for this date");
  }

  // Create daywork with nested entries
  const daywork = await prisma.dailyReport.create({
    data: {
      reportDate: new Date(date),
      weather: weatherEnum as any,
      workPerformed: work_description.trim(),
      manpowerCount: crew_size ? parseInt(crew_size) : 0,
      projectId: project_id,
      createdById: context.userId,
      materialEntries: {
        create: (materials || []).map((m: any) => ({
          materialName: m.name || 'Unknown',
          materialCode: null,
          quantityReceived: 0,
          quantityUsed: m.quantity || 0,
          unit: m.unit || 'each',
          supplierName: null,
          deliveryNote: null,
          storageLocation: null,
        })),
      },
      equipmentEntries: {
        create: (equipment || []).map((e: any) => ({
          equipmentName: e.name || 'Unknown',
          equipmentNumber: null,
          equipmentType: null,
          hoursUsed: e.hours || 0,
          idleHours: 0,
          operationalStatus: null,
          downReason: null,
          operatorName: null,
        })),
      },
      laborEntries: {
        create: (labor || []).map((l: any) => ({
          trade: l.trade || null,
          company: l.company || null,
          classification: l.classification || null,
          regularHours: l.regularHours || 0,
          overtimeHours: l.overtimeHours || 0,
          doubleTimeHours: l.doubleTimeHours || 0,
          headcount: l.headcount || 1,
          workArea: l.workArea || null,
          workDescription: l.workDescription || null,
        })),
      },
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      materialEntries: true,
      equipmentEntries: true,
      laborEntries: true,
    },
  });

  // Log activity
  await logActivity(
    prisma,
    context,
    "created daily report",
    "DailyReport",
    `Created daily report for ${daywork.reportDate}`,
    daywork.id,
    `Daily Report ${daywork.reportDate}`,
    project_id
  );

  // Create comprehensive audit log
  await createAuditLog(prisma, context, {
    entity: "DailyReport",
    entityId: daywork.id,
    action: "CREATE",
    newValues: {
      reportDate: daywork.reportDate,
      weather: daywork.weather,
      workPerformed: daywork.workPerformed,
      manpowerCount: daywork.manpowerCount,
      projectId: daywork.projectId,
    },
    metadata: {
      projectId: daywork.projectId,
    },
  });

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'dailyreport_created',
    {
      id: daywork.id,
      name: `Daily Report ${daywork.reportDate}`,
      projectId: project_id,
      weather: daywork.weather,
    },
    context.userId
  );

  const formattedDaywork = {
    id: daywork.id,
    date: daywork.reportDate.toISOString().split('T')[0],
    project_id: daywork.projectId,
    project: daywork.project,
    weather: daywork.weather.toString().toLowerCase().replace('_', ' '),
    crew_size: daywork.manpowerCount.toString(),
    work_description: daywork.workPerformed || '',
    materials: daywork.materialEntries.map((m) => ({
      name: m.materialName,
      quantity: m.quantityUsed,
      unit: m.unit,
    })),
    equipment: daywork.equipmentEntries.map((e) => ({
      name: e.equipmentName,
      hours: e.hoursUsed,
    })),
    labor: daywork.laborEntries.map((l) => ({
      trade: l.trade,
      company: l.company,
      classification: l.classification,
      regularHours: l.regularHours,
      overtimeHours: l.overtimeHours,
      doubleTimeHours: l.doubleTimeHours,
      headcount: l.headcount,
      workArea: l.workArea,
      workDescription: l.workDescription,
    })),
    createdAt: daywork.createdAt,
    updatedAt: daywork.updatedAt,
  };

  return NextResponse.json(bigintSafe({ daywork: formattedDaywork }));
});
