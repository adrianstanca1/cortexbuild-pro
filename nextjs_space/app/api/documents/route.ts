import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Validate and sanitize pagination parameters
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const parsedLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(Math.max(parsedLimit, 1), 100);
    const skip = (page - 1) * limit;

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const where = orgId ? { project: { organizationId: orgId } } : {};

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || "";
    const organizationId = (session.user as { organizationId?: string })
      ?.organizationId;
    const body = await request.json();
    const {
      name,
      cloudStoragePath,
      isPublic,
      fileSize,
      mimeType,
      projectId,
      documentType,
    } = body;

    if (!name || !cloudStoragePath || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
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
        uploadedById: userId,
      },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "uploaded document",
        entityType: "Document",
        entityId: document.id,
        entityName: document.name,
        userId,
        projectId,
      },
    });

    // Broadcast real-time event to organization
    if (organizationId) {
      broadcastToOrganization(organizationId, {
        type: "document_uploaded",
        timestamp: new Date().toISOString(),
        payload: {
          document: {
            id: document.id,
            name: document.name,
            documentType: document.documentType,
            projectId: document.projectId,
            projectName: document.project?.name,
            uploadedBy: document.uploadedBy?.name,
          },
          userId,
        },
      });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 },
    );
  }
}
