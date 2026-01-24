export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const documents = await prisma.document.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const organizationId = (session.user as { organizationId?: string })?.organizationId;
    const body = await request.json();
    const { name, cloudStoragePath, isPublic, fileSize, mimeType, projectId, documentType } = body;

    if (!name || !cloudStoragePath || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        name,
        cloudStoragePath,
        isPublic: isPublic ?? false,
        fileSize: fileSize ?? null,
        mimeType: mimeType ?? null,
        projectId,
        documentType: documentType || "OTHER",
        uploadedById: userId
      },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "uploaded document",
        entityType: "Document",
        entityId: document.id,
        entityName: document.name,
        userId,
        projectId
      }
    });

    // Broadcast real-time event to organization
    if (organizationId) {
      broadcastToOrganization(organizationId, {
        type: 'document_uploaded',
        timestamp: new Date().toISOString(),
        payload: {
          document: {
            id: document.id,
            name: document.name,
            documentType: document.documentType,
            projectId: document.projectId,
            projectName: document.project?.name,
            uploadedBy: document.uploadedBy?.name
          },
          userId
        }
      });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }
}
