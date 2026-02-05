import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.project = { organizationId: session.user.organizationId };
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const diaries = await prisma.siteDiary.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        entries: { orderBy: { time: "asc" } },
        photos: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(diaries);
  } catch {
    console.error("Error fetching site diaries:", error);
    return NextResponse.json({ error: "Failed to fetch site diaries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId, date, weatherMorning, weatherAfternoon, tempMorning, tempAfternoon,
      workAreas, workProgress, labourCount, subcontractors, equipmentOnSite,
      delays, healthSafety, qualityIssues, clientInstructions, generalNotes
    } = body;

    if (!projectId || !date) {
      return NextResponse.json({ error: "Project ID and date are required" }, { status: 400 });
    }

    const diary = await prisma.siteDiary.create({
      data: {
        projectId,
        date: new Date(date),
        createdById: session.user.id,
        weatherMorning,
        weatherAfternoon,
        tempMorning: tempMorning ? parseFloat(tempMorning) : null,
        tempAfternoon: tempAfternoon ? parseFloat(tempAfternoon) : null,
        workAreas,
        workProgress,
        labourCount: labourCount ? parseInt(labourCount) : 0,
        subcontractors,
        equipmentOnSite,
        delays,
        healthSafety,
        qualityIssues,
        clientInstructions,
        generalNotes,
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        entries: true,
        photos: true,
      },
    });

    if (diary.project.organizationId) {
      broadcastToOrganization(diary.project.organizationId, {
        type: "site_diary_created",
        data: { id: diary.id, date: diary.date, projectName: diary.project.name },
      });
    }

    return NextResponse.json(diary, { status: 201 });
  } catch {
    console.error("Error creating site diary:", error);
    return NextResponse.json({ error: "Failed to create site diary" }, { status: 500 });
  }
}
