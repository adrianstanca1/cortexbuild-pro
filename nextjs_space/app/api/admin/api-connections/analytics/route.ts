import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Fetch usage analytics for all API connections
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const connectionId = searchParams.get("connectionId");
    const period = searchParams.get("period") || "24h"; // 24h, 7d, 30d
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const where: any = {
      hourBucket: { gte: startDate }
    };
    if (connectionId) {
      where.connectionId = connectionId;
    }

    // Fetch usage records
    const usageRecords = await prisma.apiUsageRecord.findMany({
      where,
      include: {
        connection: {
          select: { id: true, name: true, serviceName: true, status: true }
        }
      },
      orderBy: { hourBucket: "asc" }
    });

    // Calculate aggregates
    const totalRequests = usageRecords.reduce((sum, r) => sum + r.requestCount, 0);
    const totalSuccess = usageRecords.reduce((sum, r) => sum + r.successCount, 0);
    const totalErrors = usageRecords.reduce((sum, r) => sum + r.errorCount, 0);
    const totalLatency = usageRecords.reduce((sum, r) => sum + r.totalLatencyMs, 0);
    const avgLatency = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;
    const successRate = totalRequests > 0 ? Math.round((totalSuccess / totalRequests) * 100 * 100) / 100 : 100;

    // Group by service for breakdown
    const byService: Record<string, any> = {};
    for (const record of usageRecords) {
      const svc = record.connection.serviceName;
      if (!byService[svc]) {
        byService[svc] = {
          serviceName: svc,
          name: record.connection.name,
          status: record.connection.status,
          requestCount: 0,
          successCount: 0,
          errorCount: 0,
          totalLatencyMs: 0
        };
      }
      byService[svc].requestCount += record.requestCount;
      byService[svc].successCount += record.successCount;
      byService[svc].errorCount += record.errorCount;
      byService[svc].totalLatencyMs += record.totalLatencyMs;
    }

    // Format service breakdown
    const serviceBreakdown = Object.values(byService).map((svc: any) => ({
      ...svc,
      avgLatency: svc.requestCount > 0 ? Math.round(svc.totalLatencyMs / svc.requestCount) : 0,
      successRate: svc.requestCount > 0 ? Math.round((svc.successCount / svc.requestCount) * 100 * 100) / 100 : 100
    }));

    // Generate hourly/daily timeline
    const timeline = usageRecords.map(r => ({
      timestamp: r.hourBucket,
      requests: r.requestCount,
      success: r.successCount,
      errors: r.errorCount,
      avgLatency: r.requestCount > 0 ? Math.round(r.totalLatencyMs / r.requestCount) : 0
    }));

    return NextResponse.json({
      period,
      summary: {
        totalRequests,
        totalSuccess,
        totalErrors,
        avgLatency,
        successRate
      },
      serviceBreakdown,
      timeline
    });
  } catch {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Record a usage event (called internally by service adapters)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      connectionId,
      success,
      latencyMs,
      statusCode,
      method = "GET"
    } = body;

    if (!connectionId) {
      return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
    }

    // Get current hour bucket
    const now = new Date();
    const hourBucket = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0, 0, 0
    );

    // Upsert the usage record for this hour
    const existing = await prisma.apiUsageRecord.findUnique({
      where: {
        connectionId_hourBucket: {
          connectionId,
          hourBucket
        }
      }
    });

    const errorsByCode = existing?.errorsByCode as Record<string, number> || {};
    const requestsByMethod = existing?.requestsByMethod as Record<string, number> || {};

    if (!success && statusCode) {
      errorsByCode[statusCode.toString()] = (errorsByCode[statusCode.toString()] || 0) + 1;
    }
    requestsByMethod[method] = (requestsByMethod[method] || 0) + 1;

    await prisma.apiUsageRecord.upsert({
      where: {
        connectionId_hourBucket: {
          connectionId,
          hourBucket
        }
      },
      create: {
        connectionId,
        hourBucket,
        requestCount: 1,
        successCount: success ? 1 : 0,
        errorCount: success ? 0 : 1,
        totalLatencyMs: latencyMs || 0,
        errorsByCode,
        requestsByMethod
      },
      update: {
        requestCount: { increment: 1 },
        successCount: success ? { increment: 1 } : undefined,
        errorCount: success ? undefined : { increment: 1 },
        totalLatencyMs: { increment: latencyMs || 0 },
        errorsByCode,
        requestsByMethod
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    console.error("Error recording usage:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
