export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { serviceRegistry } from "@/lib/service-registry";
import { createServiceAdapter } from "@/lib/service-adapters";

// POST - Test a specific service connection
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const environment = body.environment || "PRODUCTION";

    // Get the service definition
    const service = serviceRegistry.getService(id);
    if (!service) {
      return NextResponse.json(
        { error: `Service '${id}' not found` },
        { status: 404 },
      );
    }

    // Create adapter and test
    const adapter = createServiceAdapter(id, environment);

    if (!adapter || typeof (adapter as any).testConnection !== "function") {
      return NextResponse.json(
        { error: "Service does not support connection testing" },
        { status: 400 },
      );
    }

    const result = await (adapter as any).testConnection();

    return NextResponse.json({
      success: result.success,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    console.error("Error testing service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
