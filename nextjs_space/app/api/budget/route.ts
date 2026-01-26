export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
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
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: { 
      projectId?: string; 
      project?: { organizationId: string | undefined }; 
      category?: string; 
      status?: string 
    } = {};

    if (projectId) {
      where.projectId = projectId;
    } else {
      // Filter by organization's projects
      where.project = {
        organizationId: session.user.organizationId
      };
    }

    if (category && category !== "all") where.category = category;
    if (status && status !== "all") where.status = status;

    const costItems = await prisma.costItem.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        subcontractor: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Calculate budget summary
    const summary = costItems.reduce((acc: { totalEstimated: number; totalCommitted: number; totalActual: number }, item: { estimatedAmount: number; committedAmount: number; actualAmount: number }) => {
      acc.totalEstimated += item.estimatedAmount;
      acc.totalCommitted += item.committedAmount;
      acc.totalActual += item.actualAmount;
      return acc;
    }, { totalEstimated: 0, totalCommitted: 0, totalActual: 0 });

    return NextResponse.json({ costItems, summary });
  } catch (error) {
    console.error("Error fetching cost items:", error);
    return NextResponse.json({ error: "Failed to fetch cost items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, description, category, status, estimatedAmount, actualAmount, committedAmount, vendor, notes, subcontractorId, invoiceNumber, invoiceDate, paidDate } = body;

    if (!projectId || !description) {
      return NextResponse.json({ error: "Project and description are required" }, { status: 400 });
    }

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: session.user.organizationId ?? "" }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const costItem = await prisma.costItem.create({
      data: {
        projectId,
        description,
        category: category || "OTHER",
        status: status || "ESTIMATED",
        estimatedAmount: parseFloat(estimatedAmount) || 0,
        actualAmount: parseFloat(actualAmount) || 0,
        committedAmount: parseFloat(committedAmount) || 0,
        vendor,
        notes,
        subcontractorId: subcontractorId || null,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        paidDate: paidDate ? new Date(paidDate) : null,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        subcontractor: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "cost_item_created",
        entityType: "CostItem",
        entityId: costItem.id,
        entityName: costItem.description,
        details: `Added cost item: ${costItem.description} (${costItem.category})`,
        userId: session.user.id,
        projectId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "cost_item_created",
      data: { costItem, projectId }
    });

    return NextResponse.json(costItem);
  } catch (error) {
    console.error("Error creating cost item:", error);
    return NextResponse.json({ error: "Failed to create cost item" }, { status: 500 });
  }
}
