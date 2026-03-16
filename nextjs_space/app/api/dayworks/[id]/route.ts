import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  withAuthHandler,
  broadcastEntityEvent,
  logActivity,
  errorResponse,
} from "@/lib/api-utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

/**
 * GET /api/dayworks/[id] - Get single daywork by ID
 */
export const GET = withAuthHandler(async (request: NextRequest, context, params) => {
  const { id } = params as { id: string };

  const daywork = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      materialEntries: true,
      equipmentEntries: true,
      laborEntries: true,
      photos: true,
    },
  });

  if (!daywork) {
    return errorResponse("NOT_FOUND", "Daily report not found");
  }

  // Verify access - user must belong to same organization as project
  if (context.organizationId) {
    const project = await prisma.project.findUnique({
      where: { id: daywork.projectId },
      select: { organizationId: true },
    });
    if (project?.organizationId !== context.organizationId) {
      return errorResponse("FORBIDDEN", "Access denied");
    }
  }

  const formattedDaywork = {
    id: daywork.id,
    date: daywork.reportDate.toISOString().split('T')[0],
    project_id: daywork.projectId,
    project: daywork.project,
    weather: daywork.weather?.toString().toLowerCase().replace('_', ' ') || 'SUNNY',
    crew_size: daywork.manpowerCount?.toString() || '',
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

/**
 * PUT /api/dayworks/[id] - Update daywork
 * Body: Same as POST
 */
export const PUT = withAuthHandler(async (request: NextRequest, context, params) => {
  const { id } = params as { id: string };

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
    materials,
    equipment,
    labor,
  } = body;

  // Fetch existing daywork to verify ownership
  const existing = await prisma.dailyReport.findUnique({
    where: { id },
    include: { project: { select: { organizationId: true } } },
  });

  if (!existing) {
    return errorResponse("NOT_FOUND", "Daily report not found");
  }

  if (existing.project.organizationId !== context.organizationId) {
    return errorResponse("FORBIDDEN", "Access denied");
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

  // Update daywork
  const daywork = await prisma.dailyReport.update({
    where: { id },
    data: {
      reportDate: date ? new Date(date) : undefined,
      weather: weather ? (weatherEnum as any) : undefined,
      workPerformed: work_description?.trim() || existing.workPerformed,
      manpowerCount: crew_size ? parseInt(crew_size) : existing.manpowerCount,
    },
    include: {
      project: { select: { id: true, name: true } },
      materialEntries: true,
      equipmentEntries: true,
      laborEntries: true,
    },
  });

  // Update nested entries if provided
  if (Array.isArray(materials)) {
    // Delete existing and recreate
    await prisma.dailyReportMaterial.deleteMany({ where: { dailyReportId: id } });
    await prisma.dailyReport.update({
      where: { id },
      data: {
        materialEntries: {
          create: materials.map((m: any) => ({
            materialName: m.name || 'Unknown',
            quantityUsed: m.quantity || 0,
            unit: m.unit || 'each',
          })),
        },
      },
    });
  }

  if (Array.isArray(equipment)) {
    await prisma.dailyReportEquipment.deleteMany({ where: { dailyReportId: id } });
    await prisma.dailyReport.update({
      where: { id },
      data: {
        equipmentEntries: {
          create: equipment.map((e: any) => ({
            equipmentName: e.name || 'Unknown',
            hoursUsed: e.hours || 0,
          })),
        },
      },
    });
  }

  if (Array.isArray(labor)) {
    await prisma.dailyReportLabor.deleteMany({ where: { dailyReportId: id } });
    await prisma.dailyReport.update({
      where: { id },
      data: {
        laborEntries: {
          create: labor.map((l: any) => ({
            trade: l.trade || null,
            company: l.company || null,
            classification: l.classification || null,
            regularHours: l.regularHours || 0,
            overtimeHours: l.overtimeHours || 0,
            doubleTimeHours: l.doubleTimeHours || 0,
            headcount: l.headcount || 1,
            workDescription: l.workDescription || null,
          })),
        },
      },
    });
  }

  // Fetch updated daywork with all relations
  const updatedDaywork = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      materialEntries: true,
      equipmentEntries: true,
      laborEntries: true,
    },
  });

  // Log activity
  await logActivity(
    prisma,
    context,
    "updated daily report",
    "DailyReport",
    `Updated daily report ${id}`,
    id,
    `Daily Report ${updatedDaywork?.reportDate}`,
    updatedDaywork?.projectId
  );

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'dailyreport_updated',
    {
      id,
      name: `Daily Report ${updatedDaywork?.reportDate}`,
      projectId: updatedDaywork?.projectId,
    },
    context.userId
  );

  const formattedDaywork = {
    id: updatedDaywork!.id,
    date: updatedDaywork!.reportDate.toISOString().split('T')[0],
    project_id: updatedDaywork!.projectId,
    project: updatedDaywork!.project,
    weather: updatedDaywork!.weather.toString().toLowerCase().replace('_', ' '),
    crew_size: updatedDaywork!.manpowerCount.toString(),
    work_description: updatedDaywork!.workPerformed || '',
    materials: updatedDaywork!.materialEntries.map((m) => ({
      name: m.materialName,
      quantity: m.quantityUsed,
      unit: m.unit,
    })),
    equipment: updatedDaywork!.equipmentEntries.map((e) => ({
      name: e.equipmentName,
      hours: e.hoursUsed,
    })),
    labor: updatedDaywork!.laborEntries.map((l) => ({
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
    updatedAt: updatedDaywork!.updatedAt,
  };

  return NextResponse.json(bigintSafe({ daywork: formattedDaywork }));
});

/**
 * DELETE /api/dayworks/[id] - Delete daywork
 */
export const DELETE = withAuthHandler(async (request: NextRequest, context, params) => {
  const { id } = params as { id: string };

  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const existing = await prisma.dailyReport.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true, organizationId: true } } },
  });

  if (!existing) {
    return errorResponse("NOT_FOUND", "Daily report not found");
  }

  if (existing.project.organizationId !== context.organizationId) {
    return errorResponse("FORBIDDEN", "Access denied");
  }

  const projectName = existing.project.name;
  const reportDate = existing.reportDate;

  await prisma.dailyReport.delete({ where: { id } });

  // Log activity
  await logActivity(
    prisma,
    context,
    "deleted daily report",
    "DailyReport",
    `Deleted daily report for ${reportDate}`,
    id,
    `Daily Report ${reportDate}`,
    existing.projectId
  );

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'dailyreport_deleted',
    {
      id,
      name: `Daily Report ${reportDate}`,
      projectId: existing.projectId,
    },
    context.userId,
    { deleted: true }
  );

  return NextResponse.json({ message: "Daily report deleted" });
});
