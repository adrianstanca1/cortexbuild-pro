import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            budget: true
          }
        },
        _count: {
          select: {
            users: true,
            projects: true,
            teamMembers: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Calculate additional stats for each organization
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const projectIds = org.projects.map(p => p.id);
        
        // Handle empty projectIds array
        const [taskCount, documentCount, rfiCount, totalBudget] = await Promise.all([
          projectIds.length > 0 
            ? prisma.task.count({ where: { projectId: { in: projectIds } } })
            : Promise.resolve(0),
          projectIds.length > 0 
            ? prisma.document.count({ where: { projectId: { in: projectIds } } })
            : Promise.resolve(0),
          projectIds.length > 0 
            ? prisma.rFI.count({ where: { projectId: { in: projectIds } } })
            : Promise.resolve(0),
          prisma.project.aggregate({
            where: { organizationId: org.id },
            _sum: { budget: true }
          })
        ]);

        return {
          ...org,
          // Convert _count values explicitly
          _count: {
            users: Number(org._count.users),
            projects: Number(org._count.projects),
            teamMembers: Number(org._count.teamMembers)
          },
          stats: {
            taskCount: Number(taskCount),
            documentCount: Number(documentCount),
            rfiCount: Number(rfiCount),
            totalBudget: Number(totalBudget._sum.budget || 0)
          }
        };
      })
    );

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
