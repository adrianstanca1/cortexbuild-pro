// =====================================================
// API CONNECTIONS HEALTH CHECK ENDPOINT
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkServiceHealth, checkAllServicesHealth, getServiceUptimeStats, checkModuleDependencies } from "@/lib/service-health";

export const dynamic = "force-dynamic";

// GET - Check health of all services or specific service
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can access health checks
    if ((session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const moduleId = searchParams.get("moduleId");
    const includeUptime = searchParams.get("includeUptime") === "true";
    const uptimeDays = parseInt(searchParams.get("uptimeDays") || "30");

    // Check specific module dependencies
    if (moduleId) {
      const dependencies = await checkModuleDependencies(moduleId);
      return NextResponse.json(dependencies);
    }

    // Check specific service
    if (serviceId) {
      const health = await checkServiceHealth(serviceId);
      
      if (includeUptime) {
        const uptime = await getServiceUptimeStats(serviceId, uptimeDays);
        return NextResponse.json({ ...health, uptime });
      }
      
      return NextResponse.json(health);
    }

    // Check all services
    const systemHealth = await checkAllServicesHealth();

    if (includeUptime) {
      // Add uptime stats for each service
      const servicesWithUptime = await Promise.all(
        systemHealth.services.map(async (service) => {
          const uptime = await getServiceUptimeStats(service.serviceId, uptimeDays);
          return { ...service, uptime };
        })
      );
      return NextResponse.json({ ...systemHealth, services: servicesWithUptime });
    }

    return NextResponse.json(systemHealth);
  } catch {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Failed to check service health" },
      { status: 500 }
    );
  }
}

// POST - Run health check and update status for specific service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, runAll } = body;

    if (runAll) {
      const systemHealth = await checkAllServicesHealth();
      return NextResponse.json(systemHealth);
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId is required" },
        { status: 400 }
      );
    }

    const health = await checkServiceHealth(serviceId);
    return NextResponse.json(health);
  } catch {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Failed to run health check" },
      { status: 500 }
    );
  }
}
