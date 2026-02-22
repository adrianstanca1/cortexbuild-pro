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
    const status = searchParams.get("status");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.project = { organizationId: session.user.organizationId };
    }
    
    if (status) where.status = status;

    const claims = await prisma.progressClaim.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: "asc" } },
        documents: true,
      },
      orderBy: { number: "desc" },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching progress claims:", error);
    return NextResponse.json({ error: "Failed to fetch progress claims" }, { status: 500 });
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
      projectId, claimPeriodFrom, claimPeriodTo, thisClaim,
      retentionHeld, notes, lineItems
    } = body;

    if (!projectId || !claimPeriodFrom || !claimPeriodTo) {
      return NextResponse.json({ error: "Project ID and claim period are required" }, { status: 400 });
    }

    // Get next claim number
    const lastClaim = await prisma.progressClaim.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastClaim?.number || 0) + 1;

    // Calculate totals
    const previousClaimed = lastClaim?.totalClaimed || 0;
    const totalClaimed = previousClaimed + (thisClaim || 0);
    const netPayable = (thisClaim || 0) - (retentionHeld || 0);

    const claim = await prisma.progressClaim.create({
      data: {
        number: nextNumber,
        projectId,
        claimPeriodFrom: new Date(claimPeriodFrom),
        claimPeriodTo: new Date(claimPeriodTo),
        previousClaimed,
        thisClaim: thisClaim || 0,
        totalClaimed,
        retentionHeld: retentionHeld || 0,
        netPayable,
        notes,
        lineItems: lineItems ? {
          create: lineItems.map((item: any, index: number) => ({
            description: item.description,
            contractValue: item.contractValue || 0,
            previousClaimed: item.previousClaimed || 0,
            percentComplete: item.percentComplete || 0,
            thisClaim: item.thisClaim || 0,
            totalClaimed: (item.previousClaimed || 0) + (item.thisClaim || 0),
            sortOrder: index,
          })),
        } : undefined,
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        lineItems: { orderBy: { sortOrder: "asc" } },
        documents: true,
      },
    });

    if (claim.project.organizationId) {
      broadcastToOrganization(claim.project.organizationId, {
        type: "progress_claim_created",
        data: { id: claim.id, number: claim.number, thisClaim: claim.thisClaim, projectName: claim.project.name },
      });
    }

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Error creating progress claim:", error);
    return NextResponse.json({ error: "Failed to create progress claim" }, { status: 500 });
  }
}
