import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getServerSession } from 'next-auth';
import { decode } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Extended socket with custom properties
interface CustomSocket extends Socket {
  userId?: string;
  organizationId?: string;
  projectId?: string;
}

// Store active connections by organization and project
const organizationConnections = new Map<string, Set<CustomSocket>>();
const projectConnections = new Map<string, Set<CustomSocket>>();
const userConnections = new Map<string, Set<CustomSocket>>();

export class SocketIOService {
  private static instance: SocketIOService;
  private io: SocketIOServer | null = null;
  private server: HTTPServer | null = null;

  private constructor() { }

  public static getInstance(): SocketIOService {
    if (!SocketIOService.instance) {
      SocketIOService.instance = new SocketIOService();
    }
    return SocketIOService.instance;
  }

  public initialize(server: HTTPServer) {
    this.server = server;

    this.io = new SocketIOServer(server, {
      path: '/api/socketio',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.io.on('connection', (socket: CustomSocket) => {
      console.log('Socket.IO client connected:', socket.id);

      // Handle authentication
      socket.on('authenticate', async (data: { token: string; userId: string }) => {
        try {
          // Verify token first
          if (!data.token) {
            socket.emit('authentication-error', { message: 'Token required' });
            socket.disconnect();
            return;
          }

          const decoded = await decode({
            token: data.token,
            secret: process.env.NEXTAUTH_SECRET || ''
          });

          if (!decoded || !decoded.sub) {
            socket.emit('authentication-error', { message: 'Invalid token' });
            socket.disconnect();
            return;
          }

          // Enforce that the token owner matches the claimed user ID
          if (decoded.sub !== data.userId && decoded.id !== data.userId) {
            console.warn(`Socket auth mismatch: Token owner ${decoded.sub} tried to claim ${data.userId}`);
            socket.emit('authentication-error', { message: 'Identity mismatch' });
            socket.disconnect();
            return;
          }

          // Verify user exists
          const user = await prisma.user.findUnique({
            where: { id: data.userId },
            include: { organization: true }
          });

          if (!user) {
            socket.emit('authentication-error', { message: 'User not found' });
            socket.disconnect();
            return;
          }

          socket.userId = user.id;
          socket.organizationId = user.organizationId || undefined;

          // Add to organization connections
          if (socket.organizationId) {
            if (!organizationConnections.has(socket.organizationId)) {
              organizationConnections.set(socket.organizationId, new Set());
            }
            organizationConnections.get(socket.organizationId)!.add(socket);
          }

          // Add to user connections
          if (!userConnections.has(socket.userId)) {
            userConnections.set(socket.userId, new Set());
          }
          userConnections.get(socket.userId)!.add(socket);

          socket.emit('authenticated', {
            userId: socket.userId,
            organizationId: socket.organizationId,
            message: 'Successfully authenticated'
          });

          console.log(`User ${socket.userId} authenticated on socket ${socket.id}`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication-error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Handle joining a project
      socket.on('join-project', async (data: { projectId: string; userId: string }) => {
        try {
          const { projectId, userId } = data;

          // Verify user has access to project
          const projectMember = await prisma.projectTeamMember.findFirst({
            where: {
              projectId,
              teamMember: {
                userId
              }
            }
          });

          if (!projectMember) {
            socket.emit('error', { message: 'Access denied to project' });
            return;
          }

          socket.projectId = projectId;
          socket.join(`project-${projectId}`);

          // Add to project connections
          if (!projectConnections.has(projectId)) {
            projectConnections.set(projectId, new Set());
          }
          projectConnections.get(projectId)!.add(socket);

          socket.emit('project-joined', { projectId });

          // Notify others in the project
          socket.to(`project-${projectId}`).emit('user-joined-project', {
            userId,
            projectId,
            timestamp: new Date().toISOString()
          });

          console.log(`User ${userId} joined project ${projectId}`);
        } catch (error) {
          console.error('Error joining project:', error);
          socket.emit('error', { message: 'Failed to join project' });
        }
      });

      // Handle leaving a project
      socket.on('leave-project', (data: { projectId: string }) => {
        const { projectId } = data;

        socket.leave(`project-${projectId}`);

        // Remove from project connections
        const projectSet = projectConnections.get(projectId);
        if (projectSet) {
          projectSet.delete(socket);
          if (projectSet.size === 0) {
            projectConnections.delete(projectId);
          }
        }

        socket.emit('project-left', { projectId });

        // Notify others in the project
        socket.to(`project-${projectId}`).emit('user-left-project', {
          userId: socket.userId,
          projectId,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${socket.userId} left project ${projectId}`);
      });

      // Handle task updates
      socket.on('task-update', (data: { projectId: string; task: any }) => {
        const { projectId, task } = data;
        socket.to(`project-${projectId}`).emit('task-updated', {
          task,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle project messages
      socket.on('project-message', (data: { projectId: string; message: string; senderName: string }) => {
        const { projectId, message, senderName } = data;
        socket.to(`project-${projectId}`).emit('new-message', {
          message,
          senderName,
          senderId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle user status updates
      socket.on('user-status-update', (data: { projectId: string; status: string }) => {
        const { projectId, status } = data;
        socket.to(`project-${projectId}`).emit('user-status-changed', {
          userId: socket.userId,
          status,
          timestamp: new Date().toISOString()
        });
      });

      // Handle notifications
      socket.on('notification', (data: { projectId: string; notification: any }) => {
        const { projectId, notification } = data;
        socket.to(`project-${projectId}`).emit('notification-received', {
          notification,
          timestamp: new Date().toISOString()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Socket.IO client disconnected:', socket.id);

        // Clean up connections
        if (socket.organizationId) {
          const orgSet = organizationConnections.get(socket.organizationId);
          if (orgSet) {
            orgSet.delete(socket);
            if (orgSet.size === 0) {
              organizationConnections.delete(socket.organizationId);
            }
          }
        }

        if (socket.userId) {
          const userSet = userConnections.get(socket.userId);
          if (userSet) {
            userSet.delete(socket);
            if (userSet.size === 0) {
              userConnections.delete(socket.userId);
            }
          }
        }

        if (socket.projectId) {
          const projectSet = projectConnections.get(socket.projectId);
          if (projectSet) {
            projectSet.delete(socket);
            if (projectSet.size === 0) {
              projectConnections.delete(socket.projectId);
            }
          }
        }
      });
    });

    console.log('Socket.IO server initialized');
  }

  // Broadcast methods
  public broadcastToOrganization(organizationId: string, event: string, data: any) {
    if (this.io) {
      const sockets = organizationConnections.get(organizationId);
      if (sockets) {
        sockets.forEach(socket => {
          socket.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
          });
        });
      }
    }
  }

  public broadcastToProject(projectId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`project-${projectId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    if (this.io) {
      const sockets = userConnections.get(userId);
      if (sockets) {
        sockets.forEach(socket => {
          socket.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
          });
        });
      }
    }
  }

  public broadcastToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get connection counts
  public getActiveConnectionsCount(): number {
    return this.io?.sockets.sockets.size || 0;
  }

  public getOrganizationConnectionsCount(organizationId: string): number {
    return organizationConnections.get(organizationId)?.size || 0;
  }

  public getProjectConnectionsCount(projectId: string): number {
    return projectConnections.get(projectId)?.size || 0;
  }

  public getUserConnectionsCount(userId: string): number {
    return userConnections.get(userId)?.size || 0;
  }
}

// Singleton instance
export const socketIOService = SocketIOService.getInstance();
