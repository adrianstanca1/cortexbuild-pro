import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToAll } from "@/lib/realtime-clients";

/**
 * System announcements API
 * Allows super admins to create platform-wide announcements
 */

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active announcements
    const announcements = await prisma.activityLog.findMany({
      where: {
        action: "system_announcement",
        entityType: "SYSTEM",
        createdAt: {
          // Only show announcements from the last 30 days
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Parse announcement details
    const parsedAnnouncements = announcements.map(log => {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      return {
        id: log.id,
        title: details.title || "System Announcement",
        message: details.message || "",
        severity: details.severity || "info",
        dismissible: details.dismissible !== false,
        expiresAt: details.expiresAt || null,
        createdAt: log.createdAt,
        createdBy: log.user
      };
    });

    return NextResponse.json({ announcements: parsedAnnouncements });
  } catch {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, severity = "info", dismissible = true, expiresAt } = body;

    if (!title || !message) {
      return NextResponse.json({ 
        error: "Title and message are required" 
      }, { status: 400 });
    }

    // Validate title and message length
    if (title.length > 200) {
      return NextResponse.json({ 
        error: "Title must be 200 characters or less" 
      }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ 
        error: "Message must be 2000 characters or less" 
      }, { status: 400 });
    }

    // Validate severity
    const validSeverities = ["info", "warning", "error", "success"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ 
        error: "Invalid severity. Must be: info, warning, error, or success" 
      }, { status: 400 });
    }

    // Validate expiresAt is in the future if provided
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return NextResponse.json({ 
        error: "Expiration date must be in the future" 
      }, { status: 400 });
    }

    const announcementDetails = {
      title,
      message,
      severity,
      dismissible,
      expiresAt: expiresAt || null,
      createdBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      }
    };

    // Create announcement in activity log
    const announcement = await prisma.activityLog.create({
      data: {
        action: "system_announcement",
        entityType: "SYSTEM",
        details: JSON.stringify(announcementDetails),
        userId: session.user.id
      }
    });

    // Broadcast to all connected clients
    broadcastToAll({
      type: "system_announcement",
      data: {
        id: announcement.id,
        title,
        message,
        severity,
        dismissible,
        createdAt: announcement.createdAt.toISOString()
      }
    });

    return NextResponse.json({ 
      success: true,
      announcement: {
        id: announcement.id,
        ...announcementDetails,
        createdAt: announcement.createdAt
      }
    });
  } catch {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const announcementId = searchParams.get("id");

    if (!announcementId) {
      return NextResponse.json({ error: "Missing announcement ID" }, { status: 400 });
    }

    // Check if announcement exists
    const announcement = await prisma.activityLog.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Delete the announcement
    await prisma.activityLog.delete({
      where: { id: announcementId }
    });

    // Broadcast announcement dismissal
    broadcastToAll({
      type: "announcement_dismissed",
      data: { announcementId }
    });

    return NextResponse.json({ success: true });
  } catch {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
