import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Fetch rate limit configurations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const connectionId = searchParams.get("connectionId");

    const where: any = {};
    if (connectionId) {
      where.connectionId = connectionId;
    }

    const rateLimits = await prisma.apiRateLimitConfig.findMany({
      where,
      include: {
        connection: {
          select: { id: true, name: true, serviceName: true, status: true }
        }
      }
    });

    // Calculate usage percentages
    const formattedLimits = rateLimits.map(rl => {
      const minuteUsagePct = Math.round((rl.currentMinuteUsage / rl.requestsPerMinute) * 100);
      const hourUsagePct = Math.round((rl.currentHourUsage / rl.requestsPerHour) * 100);
      const dayUsagePct = Math.round((rl.currentDayUsage / rl.requestsPerDay) * 100);
      
      return {
        ...rl,
        minuteUsagePct,
        hourUsagePct,
        dayUsagePct,
        isNearLimit: minuteUsagePct >= rl.alertThreshold || 
                     hourUsagePct >= rl.alertThreshold || 
                     dayUsagePct >= rl.alertThreshold
      };
    });

    return NextResponse.json(JSON.parse(JSON.stringify({ rateLimits: formattedLimits })));
  } catch (error) {
    console.error("Error fetching rate limits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create or update rate limit config
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      connectionId,
      requestsPerMinute = 60,
      requestsPerHour = 1000,
      requestsPerDay = 10000,
      burstLimit = 10,
      throttleOnLimit = true,
      alertOnThreshold = true,
      alertThreshold = 80,
      isEnabled = true
    } = body;

    if (!connectionId) {
      return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
    }

    // Verify connection exists
    const connection = await prisma.apiConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const rateLimitConfig = await prisma.apiRateLimitConfig.upsert({
      where: { connectionId },
      create: {
        connectionId,
        requestsPerMinute,
        requestsPerHour,
        requestsPerDay,
        burstLimit,
        throttleOnLimit,
        alertOnThreshold,
        alertThreshold,
        isEnabled
      },
      update: {
        requestsPerMinute,
        requestsPerHour,
        requestsPerDay,
        burstLimit,
        throttleOnLimit,
        alertOnThreshold,
        alertThreshold,
        isEnabled
      },
      include: {
        connection: {
          select: { id: true, name: true, serviceName: true }
        }
      }
    });

    // Log the change
    await prisma.apiConnectionLog.create({
      data: {
        connectionId,
        action: "rate_limit_updated",
        details: {
          requestsPerMinute,
          requestsPerHour,
          requestsPerDay,
          burstLimit,
          isEnabled
        },
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    return NextResponse.json(JSON.parse(JSON.stringify({ rateLimitConfig })));
  } catch (error) {
    console.error("Error updating rate limit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove rate limit config (revert to defaults)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
    }

    await prisma.apiRateLimitConfig.delete({
      where: { connectionId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Rate limit config not found" }, { status: 404 });
    }
    console.error("Error deleting rate limit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
