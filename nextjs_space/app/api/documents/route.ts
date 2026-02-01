export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import { 
  getApiContext, 
  buildOrgFilter, 
  handleApiError,
  successResponse,
  errorResponse
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { context, error } = await getApiContext();
    if (error) return error;

    const documents = await prisma.document.findMany({
      where: buildOrgFilter(context!.organizationId, false),
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return successResponse({ documents });
  } catch (error) {
    return handleApiError(error, "fetch documents");
  }
}

export async function POST(request: Request) {
  try {
    const { context, error } = await getApiContext();
    if (error) return error;

    const body = await request.json();
    const { name, cloudStoragePath, isPublic, fileSize, mimeType, projectId, documentType } = body;

    if (!name || !cloudStoragePath || !projectId) {
      return errorResponse("BAD_REQUEST", "Missing required fields");
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
        uploadedById: context!.userId
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
        userId: context!.userId,
        projectId
      }
    });

    // Broadcast real-time event to organization
    broadcastToOrganization(context!.organizationId, {
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
        userId: context!.userId
      }
    });

    return successResponse({ document }, "Document uploaded successfully");
  } catch (error) {
    return handleApiError(error, "save document");
  }
}
  }
}
