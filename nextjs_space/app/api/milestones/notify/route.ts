import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format, differenceInDays, isPast, addDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { milestoneId, recipientEmail } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: "Milestone ID required" }, { status: 400 });
    }

    // Fetch milestone details
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: {
        project: { select: { id: true, name: true, manager: { select: { name: true, email: true } } } },
        createdBy: { select: { name: true } }
      }
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const targetDate = new Date(milestone.targetDate);
    const daysUntil = differenceInDays(targetDate, new Date());
    const isOverdue = isPast(targetDate) && milestone.status !== "COMPLETED";

    // Create email HTML
    const statusColor = isOverdue ? "#dc2626" : daysUntil <= 3 ? "#f59e0b" : "#2563eb";
    const statusText = isOverdue ? "OVERDUE" : daysUntil <= 0 ? "Due Today" : `Due in ${daysUntil} days`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Milestone Reminder</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">CortexBuild Pro</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <span style="background: ${statusColor}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${statusText}
            </span>
            ${milestone.isCritical ? '<span style="background: #dc2626; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 8px;">CRITICAL</span>' : ''}
          </div>

          <h2 style="color: #1e3a5f; margin: 0 0 10px; font-size: 22px;">${milestone.name}</h2>
          
          ${milestone.description ? `<p style="color: #64748b; margin: 0 0 20px;">${milestone.description}</p>` : ''}

          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Project</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${milestone.project.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Target Date</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${format(targetDate, "MMMM d, yyyy")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Progress</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${milestone.percentComplete}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Status</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${milestone.status.replace("_", " ")}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              ${isOverdue ? 'This milestone is overdue. Please review and update the status.' : 'Please ensure this milestone stays on track.'}
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p>This is an automated reminder from CortexBuild Pro</p>
        </div>
      </div>
    `;

    // Send email notification
    const appUrl = process.env.NEXTAUTH_URL || "";
    const appName = "CortexBuild Pro";
    const email = recipientEmail || milestone.project.manager?.email || session.user.email;

    const response = await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_MILESTONE_DEADLINEREMINDER,
        subject: `${isOverdue ? "[OVERDUE]" : "[Reminder]"} Milestone: ${milestone.name}`,
        body: htmlBody,
        is_html: true,
        recipient_email: email,
        sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : undefined,
        sender_alias: appName
      })
    });

    const result = await response.json();

    if (!result.success) {
      if (result.notification_disabled) {
        return NextResponse.json({ success: true, message: "Notification disabled by user" });
      }
      throw new Error(result.message || "Failed to send notification");
    }

    // Log the notification
    await prisma.activityLog.create({
      data: {
        action: "milestone_notification_sent",
        entityType: "Milestone",
        entityId: milestone.id,
        entityName: milestone.name,
        details: `Reminder sent to ${email}`,
        userId: session.user.id,
        projectId: milestone.projectId
      }
    });

    return NextResponse.json({ success: true, message: "Notification sent" });
  } catch (error) {
    console.error("Error sending milestone notification:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

// GET endpoint to check upcoming/overdue milestones
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const upcomingThreshold = addDays(now, 7);

    const milestones = await prisma.milestone.findMany({
      where: {
        project: { organizationId: session.user.organizationId ?? "" },
        status: { notIn: ["COMPLETED"] },
        targetDate: { lte: upcomingThreshold }
      },
      include: {
        project: { select: { id: true, name: true } }
      },
      orderBy: { targetDate: "asc" }
    });

    const categorized = {
      overdue: milestones.filter(m => isPast(new Date(m.targetDate))),
      dueToday: milestones.filter(m => {
        const d = new Date(m.targetDate);
        return d.toDateString() === now.toDateString();
      }),
      upcoming: milestones.filter(m => {
        const d = new Date(m.targetDate);
        return d > now && d <= upcomingThreshold;
      })
    };

    return NextResponse.json(categorized);
  } catch (error) {
    console.error("Error fetching milestone status:", error);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}
