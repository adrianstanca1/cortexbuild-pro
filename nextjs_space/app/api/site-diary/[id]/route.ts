import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const diary = await prisma.siteDiary.findUnique({
      where: { id: id },
      include: {
        project: { select: { id: true, name: true } },
        entries: { orderBy: { time: "asc" } },
        photos: true,
      },
    });

    if (!diary) {
      return NextResponse.json(
        { error: "Site diary not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(diary);
  } catch (error) {
    console.error("Error fetching site diary:", error);
    return NextResponse.json(
      { error: "Failed to fetch site diary" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      weatherMorning,
      weatherAfternoon,
      tempMorning,
      tempAfternoon,
      workAreas,
      workProgress,
      labourCount,
      subcontractors,
      equipmentOnSite,
      delays,
      healthSafety,
      qualityIssues,
      clientInstructions,
      generalNotes,
      newEntry, // For adding entries
    } = body;

    const existingDiary = await prisma.siteDiary.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!existingDiary) {
      return NextResponse.json(
        { error: "Site diary not found" },
        { status: 404 },
      );
    }

    // Add new entry if provided
    if (newEntry) {
      await prisma.siteDiaryEntry.create({
        data: {
          siteDiaryId: id,
          type: newEntry.type || "GENERAL",
          description: newEntry.description,
          time: newEntry.time ? new Date(newEntry.time) : null,
          personName: newEntry.personName,
          company: newEntry.company,
        },
      });
    }

    const diary = await prisma.siteDiary.update({
      where: { id: id },
      data: {
        ...(weatherMorning !== undefined && { weatherMorning }),
        ...(weatherAfternoon !== undefined && { weatherAfternoon }),
        ...(tempMorning !== undefined && {
          tempMorning: tempMorning ? parseFloat(tempMorning) : null,
        }),
        ...(tempAfternoon !== undefined && {
          tempAfternoon: tempAfternoon ? parseFloat(tempAfternoon) : null,
        }),
        ...(workAreas !== undefined && { workAreas }),
        ...(workProgress !== undefined && { workProgress }),
        ...(labourCount !== undefined && {
          labourCount: parseInt(labourCount) || 0,
        }),
        ...(subcontractors !== undefined && { subcontractors }),
        ...(equipmentOnSite !== undefined && { equipmentOnSite }),
        ...(delays !== undefined && { delays }),
        ...(healthSafety !== undefined && { healthSafety }),
        ...(qualityIssues !== undefined && { qualityIssues }),
        ...(clientInstructions !== undefined && { clientInstructions }),
        ...(generalNotes !== undefined && { generalNotes }),
      },
      include: {
        project: { select: { id: true, name: true } },
        entries: { orderBy: { time: "asc" } },
        photos: true,
      },
    });

    if (existingDiary.project.organizationId) {
      broadcastToOrganization(existingDiary.project.organizationId, {
        type: "site_diary_updated",
        data: { id: diary.id, date: diary.date },
      });
    }

    return NextResponse.json(diary);
  } catch (error) {
    console.error("Error updating site diary:", error);
    return NextResponse.json(
      { error: "Failed to update site diary" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const diary = await prisma.siteDiary.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!diary) {
      return NextResponse.json(
        { error: "Site diary not found" },
        { status: 404 },
      );
    }

    await prisma.siteDiary.delete({ where: { id: id } });

    if (diary.project.organizationId) {
      broadcastToOrganization(diary.project.organizationId, {
        type: "site_diary_deleted",
        data: { id: diary.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site diary:", error);
    return NextResponse.json(
      { error: "Failed to delete site diary" },
      { status: 500 },
    );
  }
}
