import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const photos = await prisma.dailyReportPhoto.findMany({
      where: { dailyReportId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching daily report photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { caption, cloud_storage_path } = await request.json();

    if (!cloud_storage_path) {
      return NextResponse.json(
        { error: "cloud_storage_path required" },
        { status: 400 },
      );
    }

    // Verify report exists
    const report = await prisma.dailyReport.findFirst({
      where: {
        id,
        project: { organizationId: session.user.organizationId },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Daily report not found" },
        { status: 404 },
      );
    }

    const photo = await prisma.dailyReportPhoto.create({
      data: {
        caption,
        cloudStoragePath: cloud_storage_path,
        dailyReportId: id,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error creating daily report photo:", error);
    return NextResponse.json(
      { error: "Failed to create photo" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json({ error: "photoId required" }, { status: 400 });
    }

    const photo = await prisma.dailyReportPhoto.findFirst({
      where: {
        id: photoId,
        dailyReport: {
          id,
          project: { organizationId: session.user.organizationId },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    try {
      await deleteFile(photo.cloudStoragePath);
    } catch (e) {
      console.warn("Failed to delete file from S3:", e);
    }

    await prisma.dailyReportPhoto.delete({ where: { id: photoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting daily report photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 },
    );
  }
}
