// =====================================================
// SERVICE ENTITLEMENTS API ENDPOINT
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getPlatformEntitlements,
  getServiceModuleEntitlement,
  isServiceModuleEnabled,
  isEmailAvailable,
} from "@/lib/service-entitlements";
import { ServiceEnvironment } from "@/lib/service-registry";

export const dynamic = "force-dynamic";

// GET - Get platform entitlements or specific module entitlement
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");
    const environment = (searchParams.get("environment") ||
      "PRODUCTION") as ServiceEnvironment;
    const checkEmail = searchParams.get("checkEmail") === "true";

    // Check email availability
    if (checkEmail) {
      const emailStatus = await isEmailAvailable(environment);
      return NextResponse.json(emailStatus);
    }

    // Check specific module
    if (moduleId) {
      const entitlement = await getServiceModuleEntitlement(
        moduleId,
        environment,
      );
      return NextResponse.json(entitlement);
    }

    // Get full platform entitlements
    const entitlements = await getPlatformEntitlements(environment);
    return NextResponse.json(entitlements);
  } catch (error) {
    console.error("Entitlements error:", error);
    return NextResponse.json(
      { error: "Failed to check entitlements" },
      { status: 500 },
    );
  }
}

// POST - Check if module is enabled (for API/middleware use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, environment = "PRODUCTION" } = body;

    if (!moduleId) {
      return NextResponse.json(
        { error: "moduleId is required" },
        { status: 400 },
      );
    }

    const enabled = await isServiceModuleEnabled(
      moduleId,
      environment as ServiceEnvironment,
    );
    const entitlement = await getServiceModuleEntitlement(
      moduleId,
      environment as ServiceEnvironment,
    );

    return NextResponse.json({
      moduleId,
      enabled,
      entitlement,
    });
  } catch (error) {
    console.error("Entitlements check error:", error);
    return NextResponse.json(
      { error: "Failed to check module entitlement" },
      { status: 500 },
    );
  }
}
