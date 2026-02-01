export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// Helper to safely serialize data with BigInt values
function serializeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === "bigint" ? Number(value) : value
  ));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } }
      ];
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            lastLogin: true
          },
          take: 100  // Limit users per organization
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            budget: true
          },
          take: 100  // Limit projects per organization
        },
        _count: {
          select: {
            users: true,
            projects: true,
            teamMembers: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100  // Limit total organizations
    });

    // Get all project IDs for batch queries
    const allProjectIds = organizations.flatMap(org => org.projects.map(p => p.id));
    
    // Batch fetch stats for all organizations in parallel - eliminates N+1 pattern
    const [tasksByProject, documentsByProject, rfisByProject, budgetsByOrg] = await Promise.all([
      allProjectIds.length > 0
        ? prisma.task.groupBy({
            by: ['projectId'],
            where: { projectId: { in: allProjectIds } },
            _count: true
          })
        : Promise.resolve([]),
      allProjectIds.length > 0
        ? prisma.document.groupBy({
            by: ['projectId'],
            where: { projectId: { in: allProjectIds } },
            _count: true
          })
        : Promise.resolve([]),
      allProjectIds.length > 0
        ? prisma.rFI.groupBy({
            by: ['projectId'],
            where: { projectId: { in: allProjectIds } },
            _count: true
          })
        : Promise.resolve([]),
      prisma.project.groupBy({
        by: ['organizationId'],
        where: { organizationId: { in: organizations.map(o => o.id) } },
        _sum: { budget: true }
      })
    ]);

    // Create lookup maps for O(1) access
    const tasksMap = new Map(tasksByProject.map(t => [t.projectId, t._count]));
    const documentsMap = new Map(documentsByProject.map(d => [d.projectId, d._count]));
    const rfisMap = new Map(rfisByProject.map(r => [r.projectId, r._count]));
    const budgetsMap = new Map(budgetsByOrg.map(b => [b.organizationId, b._sum.budget || 0]));

    // Calculate stats for each organization using lookup maps
    const orgsWithStats = organizations.map(org => {
      const projectIds = org.projects.map(p => p.id);
      
      // Sum all counts in a single pass for better performance
      const counts = projectIds.reduce((acc, pid) => {
        acc.taskCount += tasksMap.get(pid) || 0;
        acc.documentCount += documentsMap.get(pid) || 0;
        acc.rfiCount += rfisMap.get(pid) || 0;
        return acc;
      }, { taskCount: 0, documentCount: 0, rfiCount: 0 });
      
      const totalBudget = budgetsMap.get(org.id) || 0;

      return {
        ...org,
        // Convert _count values explicitly
        _count: {
          users: Number(org._count.users),
          projects: Number(org._count.projects),
          teamMembers: Number(org._count.teamMembers)
        },
        stats: {
          taskCount: Number(counts.taskCount),
          documentCount: Number(counts.documentCount),
          rfiCount: Number(counts.rfiCount),
          totalBudget: Number(totalBudget)
        }
      };
    });

    // Use custom serializer to handle any remaining BigInt values
    return NextResponse.json(serializeData({ organizations: orgsWithStats }));
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, logoUrl } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    // Check slug uniqueness
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      return NextResponse.json({ error: "Organization with this slug already exists" }, { status: 409 });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        logoUrl: logoUrl || null
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "created organization",
        entityType: "Organization",
        entityId: organization.id,
        entityName: organization.name,
        userId: session.user.id,
        details: `Created organization ${organization.name}`
      }
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
