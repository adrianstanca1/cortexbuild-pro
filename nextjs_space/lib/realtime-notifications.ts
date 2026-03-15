// lib/realtime-notifications.ts
import { prisma } from "./db";
import { broadcastEvent } from "./realtime-clients";
import { NotificationType } from "./types";

interface NotificationPayload {
  userId?: string;
  projectId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
}

export class RealTimeNotifications {
  static async sendToUser(payload: NotificationPayload) {
    const {
      userId,
      projectId,
      title,
      message,
      type = "INFO",
      data = {},
    } = payload;

    if (!userId) throw new Error("User ID is required");

    const notification = await prisma.notification.create({
      data: {
        userId,
        projectId,
        title,
        message,
        type,
        data: data as any,
        read: false,
      },
    });

    // Dispatch via SSE to the specific user
    broadcastEvent([userId], { type: "notification", payload: notification });

    return notification;
  }

  static async sendToProject(payload: NotificationPayload) {
    const { projectId, title, message, type = "INFO", data = {} } = payload;

    if (!projectId) throw new Error("Project ID is required");

    const projectUsers = await prisma.projectTeamMember.findMany({
      where: { projectId },
      include: { teamMember: { include: { user: { select: { id: true } } } } },
    });

    const userIds = projectUsers.map((ptm) => ptm.teamMember.user.id);

    if (userIds.length === 0) return [];

    const notifications = await prisma.$transaction(
      userIds.map((uid) =>
        prisma.notification.create({
          data: {
            userId: uid,
            projectId,
            title,
            message,
            type,
            data: data as any,
            read: false,
          },
        }),
      ),
    );

    userIds.forEach((uid, i) => {
      broadcastEvent([uid], {
        type: "notification",
        payload: notifications[i],
      });
    });

    return notifications;
  }

  static async sendToAll(payload: NotificationPayload) {
    const { title, message, type = "INFO", data = {} } = payload;

    const activeUsers = await prisma.user.findMany({
      where: { lastLogin: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { id: true },
    });

    const userIds = activeUsers.map((u) => u.id);

    if (userIds.length === 0) return [];

    const notifications = await prisma.$transaction(
      userIds.map((uid) =>
        prisma.notification.create({
          data: {
            userId: uid,
            title,
            message,
            type,
            data: data as any,
            read: false,
          },
        }),
      ),
    );

    userIds.forEach((uid, i) => {
      broadcastEvent([uid], {
        type: "notification",
        payload: notifications[i],
      });
    });

    return notifications;
  }

  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  static async getUserUnreadNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getProjectNotifications(projectId: string) {
    return await prisma.notification.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }
}
