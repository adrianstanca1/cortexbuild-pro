import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const orgId = user.organizationId;

    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role !== "all") {
      where.user = { ...where.user, role };
    }

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              lastLogin: true,
              createdAt: true,
            },
          },
          projectAssignments: {
            include: {
              project: {
                select: { id: true, name: true, status: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { invitedAt: "desc" },
      }),
      prisma.teamMember.count({ where }),
    ]);

    return NextResponse.json({
      members: members.map((m) => ({
        ...m,
        projectCount: m.projectAssignments.length,
        projects: m.projectAssignments.map((pa) => pa.project),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!["COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, jobTitle, department } = body;

    // Check if team member already exists
    const existing = await prisma.teamMember.findFirst({
      where: { userId, organizationId: user.organizationId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Team member already exists" },
        { status: 409 },
      );
    }

    const member = await prisma.teamMember.create({
      data: {
        userId,
        organizationId: user.organizationId,
        jobTitle,
        department,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
