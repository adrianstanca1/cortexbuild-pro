// lib/realtime-notifications.ts
import { randomUUID } from 'crypto';
import { prisma } from './db';
import { NotificationType } from './types';

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

    // TODO: Save notification to database when Notification model is added
    // const notification = await prisma.notification.create({
    //   data: {
    //     userId,
    //     title,
    //     message,
    //     type,
    //     data: data as any,
    //     read: false,
    //   }
    // });

    const notification = {
      id: randomUUID(),
      userId,
      title,
      message,
      type,
      data,
      read: false,
      createdAt: new Date(),
    };

    // Emit real-time notification via WebSocket
    // This would be handled by the WebSocket service
    if (process.env.NODE_ENV === 'development') {
      console.log(`Notification sent to user ${userId}`);
    }
    
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

    // TODO: Create notifications for all users in the project when Notification model is added
    // const notifications = await prisma.$transaction(
    //   userIds.map(userId => 
    //     prisma.notification.create({
    //       data: {
    //         userId,
    //         projectId,
    //         title,
    //         message,
    //         type,
    //         data: data as any,
    //         read: false,
    //       }
    //     })
    //   )
    // );

    const notifications = userIds.map((userId) => ({
      id: randomUUID(),
      userId,
      projectId,
      title,
      message,
      type,
      data,
      read: false,
      createdAt: new Date(),
    }));

    // Emit real-time notification to project via WebSocket
    if (process.env.NODE_ENV === 'development') {
      console.log(`Notification sent to project ${projectId} for ${userIds.length} users`);
    }
    
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

    // TODO: Create notifications for all active users when Notification model is added
    // const notifications = await prisma.$transaction(
    //   userIds.map(userId => 
    //     prisma.notification.create({
    //       data: {
    //         userId,
    //         title,
    //         message,
    //         type,
    //         data: data as any,
    //         read: false,
    //       }
    //     })
    //   )
    // );

    const notifications = userIds.map((userId) => ({
      id: randomUUID(),
      userId,
      title,
      message,
      type,
      data,
      read: false,
      createdAt: new Date(),
    }));

    // Emit real-time notification to all users via WebSocket
    if (process.env.NODE_ENV === 'development') {
      console.log(`Notification sent to all ${userIds.length} active users`);
    }
    
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
    // TODO: Mark notification as read when Notification model is added
    // return await prisma.notification.update({
    //   where: {
    //     id: notificationId,
    //     userId
    //   },
    //   data: {
    //     read: true,
    //     readAt: new Date()
    //   }
    // });
    return {
      id: notificationId,
      userId,
      read: true,
      readAt: new Date(),
    };
  }

  /**
   * Get user's unread notifications
   */
  static async getUserUnreadNotifications(userId: string) {
    // TODO: Get unread notifications when Notification model is added
    // return await prisma.notification.findMany({
    //   where: {
    //     userId,
    //     read: false
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    // });
    return [];
  }

  /**
   * Get project notifications
   */
  static async getProjectNotifications(projectId: string) {
    // TODO: Get project notifications when Notification model is added
    // return await prisma.notification.findMany({
    //   where: {
    //     projectId
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    // });
    return [];
  }
}