import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Fetch health check history and uptime stats
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
      createdAt: { gte: startDate }
    };
    if (connectionId) {
      where.connectionId = connectionId;
    }

    // Fetch health checks
    const healthChecks = await prisma.apiHealthCheck.findMany({
      where,
      include: {
        connection: {
          select: { id: true, name: true, serviceName: true, status: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 500 // Limit for performance
    });

    // Calculate uptime by service
    const serviceStats: Record<string, any> = {};
    for (const check of healthChecks) {
      const svc = check.connection.serviceName;
      if (!serviceStats[svc]) {
        serviceStats[svc] = {
          serviceName: svc,
          name: check.connection.name,
          connectionId: check.connectionId,
          status: check.connection.status,
          totalChecks: 0,
          healthyChecks: 0,
          totalResponseTime: 0,
          minResponseTime: Infinity,
          maxResponseTime: 0,
          recentChecks: []
        };
      }
      const stat = serviceStats[svc];
      stat.totalChecks++;
      if (check.isHealthy) stat.healthyChecks++;
      stat.totalResponseTime += check.responseTime;
      stat.minResponseTime = Math.min(stat.minResponseTime, check.responseTime);
      stat.maxResponseTime = Math.max(stat.maxResponseTime, check.responseTime);
      
      // Keep last 24 checks for chart
      if (stat.recentChecks.length < 24) {
        stat.recentChecks.push({
          timestamp: check.createdAt,
          isHealthy: check.isHealthy,
          responseTime: check.responseTime,
          errorMessage: check.errorMessage
        });
      }
    }

    // Format stats
    const uptimeStats = Object.values(serviceStats).map((stat: any) => ({
      ...stat,
      uptimePercentage: stat.totalChecks > 0 
        ? Math.round((stat.healthyChecks / stat.totalChecks) * 100 * 100) / 100 
        : 100,
      avgResponseTime: stat.totalChecks > 0 
        ? Math.round(stat.totalResponseTime / stat.totalChecks) 
        : 0,
      minResponseTime: stat.minResponseTime === Infinity ? 0 : stat.minResponseTime,
      recentChecks: stat.recentChecks.reverse() // Chronological order
    }));

    // Calculate overall uptime
    const totalChecks = healthChecks.length;
    const healthyChecks = healthChecks.filter(c => c.isHealthy).length;
    const overallUptime = totalChecks > 0 
      ? Math.round((healthyChecks / totalChecks) * 100 * 100) / 100 
      : 100;

    // Get incident timeline (recent failures)
    const incidents = healthChecks
      .filter(c => !c.isHealthy)
      .slice(0, 20)
      .map(c => ({
        timestamp: c.createdAt,
        service: c.connection.name,
        serviceName: c.connection.serviceName,
        errorMessage: c.errorMessage,
        responseTime: c.responseTime
      }));

    return NextResponse.json({
      period,
      summary: {
        totalChecks,
        healthyChecks,
        failedChecks: totalChecks - healthyChecks,
        overallUptime
      },
      uptimeStats,
      incidents
    });
  } catch {
    console.error("Error fetching health history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Record a health check result (called after testing connections)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      connectionId,
      isHealthy,
      responseTime,
      statusCode,
      errorMessage,
      checkType = "manual",
      endpoint
    } = body;

    if (!connectionId || isHealthy === undefined || responseTime === undefined) {
      return NextResponse.json(
        { error: "connectionId, isHealthy, and responseTime are required" },
        { status: 400 }
      );
    }

    const healthCheck = await prisma.apiHealthCheck.create({
      data: {
        connectionId,
        isHealthy,
        responseTime,
        statusCode,
        errorMessage,
        checkType,
        endpoint
      }
    });

    return NextResponse.json({ success: true, healthCheck });
  } catch {
    console.error("Error recording health check:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
