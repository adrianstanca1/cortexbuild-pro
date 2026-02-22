export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getStorageInfo } from "@/lib/storage-adapter";

/**
 * Get storage configuration information
 * Requires authentication and SUPER_ADMIN role
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can view storage configuration
    if ((session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const storageInfo = getStorageInfo();
    
    return NextResponse.json({
      storage: storageInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Storage info error:", error);
    return NextResponse.json(
      { error: "Failed to get storage info" },
      { status: 500 }
    );
  }
}
