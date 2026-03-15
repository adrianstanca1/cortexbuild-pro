import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  source:
    | "daily_report"
    | "safety_incident"
    | "punch_list"
    | "inspection"
    | "document";
  sourceId: string;
  sourceTitle: string;
  createdAt: Date;
  mimeType?: string;
  fileSize?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = id;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source"); // Filter by source type
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: orgId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const photos: GalleryPhoto[] = [];

    // Fetch daily report photos
    if (!source || source === "daily_report") {
      const dailyReportPhotos = await prisma.dailyReportPhoto.findMany({
        where: {
          dailyReport: {
            projectId,
          },
        },
        include: {
          dailyReport: {
            select: {
              id: true,
              reportDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Batch fetch all URLs in parallel
      const urls = await Promise.all(
        dailyReportPhotos.map((photo) =>
          getFileUrl(photo.cloudStoragePath, false),
        ),
      );

      dailyReportPhotos.forEach((photo, index) => {
        photos.push({
          id: photo.id,
          url: urls[index],
          caption: photo.caption,
          source: "daily_report",
          sourceId: photo.dailyReport.id,
          sourceTitle: `Daily Report - ${new Date(photo.dailyReport.reportDate).toLocaleDateString("en-GB")}`,
          createdAt: photo.createdAt,
        });
      });
    }

    // Fetch safety incident photos
    if (!source || source === "safety_incident") {
      // First get all safety incidents for this project
      const safetyIncidents = await prisma.safetyIncident.findMany({
        where: { projectId },
        select: {
          id: true,
          description: true,
          incidentDate: true,
          photos: true,
        },
      });

      // Flatten all photos and batch fetch URLs
      const allIncidentPhotos = safetyIncidents.flatMap((incident) =>
        incident.photos.map((photo) => ({ photo, incident })),
      );

      const urls = await Promise.all(
        allIncidentPhotos.map(({ photo }) =>
          getFileUrl(photo.cloudStoragePath, false),
        ),
      );

      allIncidentPhotos.forEach(({ photo, incident }, index) => {
        const shortDesc =
          incident.description.length > 30
            ? incident.description.substring(0, 30) + "..."
            : incident.description;
        photos.push({
          id: photo.id,
          url: urls[index],
          caption: photo.caption,
          source: "safety_incident",
          sourceId: incident.id,
          sourceTitle: `Safety: ${shortDesc}`,
          createdAt: photo.createdAt,
          mimeType: photo.mimeType || undefined,
          fileSize: photo.fileSize || undefined,
        });
      });
    }

    // Fetch punch list photos
    if (!source || source === "punch_list") {
      const punchListPhotos = await prisma.punchListPhoto.findMany({
        where: {
          punchList: {
            projectId,
          },
        },
        include: {
          punchList: {
            select: {
              id: true,
              title: true,
              number: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Batch fetch all URLs in parallel
      const urls = await Promise.all(
        punchListPhotos.map((photo) =>
          getFileUrl(photo.cloudStoragePath, false),
        ),
      );

      punchListPhotos.forEach((photo, index) => {
        photos.push({
          id: photo.id,
          url: urls[index],
          caption: photo.caption,
          source: "punch_list",
          sourceId: photo.punchList.id,
          sourceTitle: `Punch #${photo.punchList.number}: ${photo.punchList.title}`,
          createdAt: photo.createdAt,
        });
      });
    }

    // Fetch inspection photos
    if (!source || source === "inspection") {
      const inspectionPhotos = await prisma.inspectionPhoto.findMany({
        where: {
          inspection: {
            projectId,
          },
        },
        include: {
          inspection: {
            select: {
              id: true,
              title: true,
              number: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Batch fetch all URLs in parallel
      const urls = await Promise.all(
        inspectionPhotos.map((photo) =>
          getFileUrl(photo.cloudStoragePath, false),
        ),
      );

      inspectionPhotos.forEach((photo, index) => {
        photos.push({
          id: photo.id,
          url: urls[index],
          caption: photo.caption,
          source: "inspection",
          sourceId: photo.inspection.id,
          sourceTitle: `Inspection #${photo.inspection.number}: ${photo.inspection.title}`,
          createdAt: photo.createdAt,
        });
      });
    }

    // Fetch document photos (PHOTOS type documents)
    if (!source || source === "document") {
      const documentPhotos = await prisma.document.findMany({
        where: {
          projectId,
          documentType: "PHOTOS",
          OR: [
            { mimeType: { startsWith: "image/" } },
            { name: { endsWith: ".jpg" } },
            { name: { endsWith: ".jpeg" } },
            { name: { endsWith: ".png" } },
            { name: { endsWith: ".gif" } },
            { name: { endsWith: ".webp" } },
          ],
        },
        include: {
          uploadedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Batch fetch all URLs in parallel
      const urls = await Promise.all(
        documentPhotos.map((doc) =>
          getFileUrl(doc.cloudStoragePath, doc.isPublic),
        ),
      );

      documentPhotos.forEach((doc, index) => {
        photos.push({
          id: doc.id,
          url: urls[index],
          caption: null,
          source: "document",
          sourceId: doc.id,
          sourceTitle: doc.name,
          createdAt: doc.createdAt,
          mimeType: doc.mimeType || undefined,
          fileSize: doc.fileSize || undefined,
        });
      });
    }

    // Sort all photos by date (newest first)
    photos.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Apply pagination
    const paginatedPhotos = photos.slice(offset, offset + limit);

    // Get counts by source using single pass reduce
    const counts = photos.reduce(
      (acc, p) => {
        if (p.source === "daily_report") acc.daily_report++;
        else if (p.source === "safety_incident") acc.safety_incident++;
        else if (p.source === "punch_list") acc.punch_list++;
        else if (p.source === "inspection") acc.inspection++;
        else if (p.source === "document") acc.document++;
        return acc;
      },
      {
        total: photos.length,
        daily_report: 0,
        safety_incident: 0,
        punch_list: 0,
        inspection: 0,
        document: 0,
      },
    );

    return NextResponse.json({
      photos: paginatedPhotos,
      counts,
      pagination: {
        total: photos.length,
        limit,
        offset,
        hasMore: offset + limit < photos.length,
      },
    });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery photos" },
      { status: 500 },
    );
  }
}
