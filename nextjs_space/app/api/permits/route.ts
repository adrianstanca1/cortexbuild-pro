export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth-helpers";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.project = { organizationId: session.user.organizationId };
    }
    
    if (status) where.status = status;
    if (type) where.type = type;

    const permits = await prisma.permit.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(permits);
  } catch (error) {
    console.error("Error fetching permits:", error);
    return NextResponse.json({ error: "Failed to fetch permits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { projectId, type, title, description, issuingAuthority, applicationDate, fee, conditions, notes } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: "Project ID and title are required" }, { status: 400 });
    }

    // Get next permit number for this project
    const lastPermit = await prisma.permit.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastPermit?.number || 0) + 1;

    const permit = await prisma.permit.create({
      data: {
        number: nextNumber,
        projectId,
        type: type || "BUILDING",
        title,
        description,
        issuingAuthority,
        applicationDate: applicationDate ? new Date(applicationDate) : null,
        fee: fee ? parseFloat(fee) : null,
        conditions,
        notes,
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
      },
    });

    // Broadcast real-time event
    if (permit.project.organizationId) {
      broadcastToOrganization(permit.project.organizationId, {
        type: "permit_created",
        data: { id: permit.id, number: permit.number, title: permit.title, projectName: permit.project.name },
      });
    }

    return NextResponse.json(permit, { status: 201 });
  } catch (error) {
    console.error("Error creating permit:", error);
    return NextResponse.json({ error: "Failed to create permit" }, { status: 500 });
  }
}
