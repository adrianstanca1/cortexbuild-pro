export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params?.id ?? "" },
      include: {
        project: { select: { organizationId: true } }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify user belongs to same organization
    const userOrgId = (session.user as any)?.organizationId;
    if (userOrgId && document.project?.organizationId !== userOrgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = await getFileUrl(document.cloudStoragePath, document.isPublic);

    return NextResponse.json({ 
      url,
      name: document.name,
      mimeType: document.mimeType
    });
  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json({ error: "Failed to get download URL" }, { status: 500 });
  }
}
