import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Fetch API connection audit logs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const connectionId = searchParams.get("connectionId");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where: any = {};
    if (connectionId) where.connectionId = connectionId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.apiConnectionLog.findMany({
        where,
        include: {
          connection: {
            select: { id: true, name: true, serviceName: true }
          },
          performedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.apiConnectionLog.count({ where })
    ]);

    return NextResponse.json(JSON.parse(JSON.stringify({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })));
  } catch (error) {
    console.error("Error fetching API connection logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
