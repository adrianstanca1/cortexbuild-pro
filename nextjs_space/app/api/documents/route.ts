export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { logAndBroadcast } from "@/lib/query-builders";

export const GET = withAuth(async (request: NextRequest, context) => {
  const documents = await prisma.document.findMany({
    where: { project: { organizationId: context.organizationId } },
    include: {
      project: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return successResponse({ documents });
});

export const POST = withAuth(async (request: NextRequest, context) => {
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
      uploadedById: context.userId
    },
    include: {
      project: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true } }
    }
  });

  await logAndBroadcast(context, "uploaded document", "Document", document, projectId);

  return successResponse({ document });
});
