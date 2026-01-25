export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth, successResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { logAndBroadcast } from "@/lib/query-builders";

export const GET = withAuth(async (request: NextRequest, context) => {
  const projects = await prisma.project.findMany({
    where: { organizationId: context.organizationId },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { tasks: true, documents: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return successResponse({ projects });
});

export const POST = withAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  const { name, description, location, clientName, clientEmail, budget, startDate, endDate, status } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      clientName: clientName?.trim() || null,
      clientEmail: clientEmail?.trim() || null,
      budget: budget ? parseFloat(budget) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || "PLANNING",
      organizationId: context.organizationId,
      managerId: context.userId || null
    },
    include: {
      manager: { select: { id: true, name: true } }
    }
  });

  // Log activity and broadcast change
  await logAndBroadcast(context, "created project", "Project", project, project.id);

  return successResponse({ project });
});
