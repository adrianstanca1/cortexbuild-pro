import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize pagination parameters
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const safeLimit = Number.isNaN(rawLimit) ? 50 : rawLimit;
    const limit = Math.min(Math.max(safeLimit, 1), 100); // Min 1, max 100 per page
    const skip = (page - 1) * limit;

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const where = orgId ? { organizationId: orgId } : {};

    // Execute count and findMany in parallel for better performance
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          manager: { select: { id: true, name: true } },
          _count: { select: { tasks: true, documents: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.project.count({ where })
    ]);

    return NextResponse.json({ 
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

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
        organizationId: orgId,
        managerId: userId || null
      },
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "created project",
        entityType: "Project",
        entityId: project.id,
        entityName: project.name,
        userId,
        projectId: project.id
      }
    });

    // Broadcast real-time event to organization
    broadcastToOrganization(orgId, {
      type: 'project_created',
      timestamp: new Date().toISOString(),
      payload: {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          location: project.location,
          clientName: project.clientName,
          managerName: project.manager?.name
        },
        userId
      }
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
