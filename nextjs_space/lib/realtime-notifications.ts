// lib/realtime-notifications.ts
import { prisma } from './db';
import { NotificationType } from '@prisma/client';

interface NotificationPayload {
  userId?: string;
  projectId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
}

export class RealTimeNotifications {
  /**
   * Send a real-time notification to a specific user
   */
  static async sendToUser(payload: NotificationPayload) {
    const { userId, title, message, type = 'INFO', data = {} } = payload;
    
    if (!userId) {
      throw new Error('User ID is required to send notification to user');
    }

    // Save notification to database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data as any,
        read: false,
      }
    });

    // Emit real-time notification via WebSocket
    // This would be handled by the WebSocket service
    // For now, we'll simulate the emit
    console.log(`Sending notification to user ${userId}:`, notification);
    
    // In a real implementation, you would emit to the specific user:
    // websocketService.broadcastToUser(userId, {
    //   type: 'NEW_NOTIFICATION',
    //   payload: notification
    // });
    
    return notification;
  }

  /**
   * Send a real-time notification to all users in a project
   */
  static async sendToProject(payload: NotificationPayload) {
    const { projectId, title, message, type = 'INFO', data = {} } = payload;
    
    if (!projectId) {
      throw new Error('Project ID is required to send notification to project');
    }

    // Get all users in the project
    const projectUsers = await prisma.projectTeamMember.findMany({
      where: { projectId },
      include: {
        teamMember: {
          include: {
            user: true
          }
        }
      }
    });

    const userIds = projectUsers.map(ptm => ptm.teamMember.user.id);

    // Create notifications for all users in the project
    const notifications = await prisma.$transaction(
      userIds.map(userId => 
        prisma.notification.create({
          data: {
            userId,
            projectId,
            title,
            message,
            type,
            data: data as any,
            read: false,
          }
        })
      )
    );

    // Emit real-time notification to project via WebSocket
    console.log(`Sending notification to project ${projectId} for ${userIds.length} users:`, { title, message });
    
    // In a real implementation, you would emit to the project room:
    // websocketService.broadcastToProject(projectId, {
    //   type: 'NEW_PROJECT_NOTIFICATION',
    //   payload: { notifications, title, message }
    // });
    
    return notifications;
  }

  /**
   * Send a real-time notification to all online users
   */
  static async sendToAll(payload: NotificationPayload) {
    const { title, message, type = 'INFO', data = {} } = payload;

    // Get all active users (those who have logged in recently)
    const activeUsers = await prisma.user.findMany({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const userIds = activeUsers.map(user => user.id);

    // Create notifications for all active users
    const notifications = await prisma.$transaction(
      userIds.map(userId => 
        prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            data: data as any,
            read: false,
          }
        })
      )
    );

    // Emit real-time notification to all users via WebSocket
    console.log(`Sending notification to all ${userIds.length} active users:`, { title, message });
    
    // In a real implementation, you would emit to all connected users:
    // websocketService.broadcastToAll({
    //   type: 'GLOBAL_NOTIFICATION',
    //   payload: { notifications, title, message }
    // });
    
    return notifications;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Get user's unread notifications
   */
  static async getUserUnreadNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: {
        userId,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get project notifications
   */
  static async getProjectNotifications(projectId: string) {
    return await prisma.notification.findMany({
      where: {
        projectId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}