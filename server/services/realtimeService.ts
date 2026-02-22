import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { UserRole } from '../types.js';

export interface RealtimeMessage {
    type: string;
    payload?: any;
    entityType?: string;
    entityId?: string;
    companyId?: string;
    userId?: string;
    projectId?: string;
    timestamp: string;
    [key: string]: any;
}

export class RealtimeService {
    private static instance: RealtimeService;
    private io: SocketIOServer | null = null;
    private clients: Map<string, any> = new Map(); // Map socket ID to state

    private constructor() { }

    public static getInstance(): RealtimeService {
        if (!RealtimeService.instance) {
            RealtimeService.instance = new RealtimeService();
        }
        return RealtimeService.instance;
    }

    public init(io: SocketIOServer) {
        if (this.io) {
            logger.warn('RealtimeService already initialized, skipping.');
            return;
        }
        this.io = io;
        logger.info('RealtimeService initialized with Socket.io');
    }

    /**
     * Track client and join appropriate rooms
     */
    public registerClient(socket: Socket, data: { companyId?: string, projectId?: string, userId?: string, role?: string }) {
        this.clients.set(socket.id, { ...data, socket });

        if (data.companyId) {
            socket.join(`company:${data.companyId}`);
        }
        if (data.projectId) {
            socket.join(`project:${data.projectId}`);
        }
        if (data.userId) {
            socket.join(`user:${data.userId}`);
        }
        if (data.role === 'SUPERADMIN' || data.role === UserRole.SUPERADMIN) {
            socket.join('superadmins');
        }

        logger.debug(`Client ${socket.id} (User: ${data.userId}) registered and joined rooms`);
    }

    public unregisterClient(socket: Socket) {
        this.clients.delete(socket.id);
    }

    public updateClientProject(socket: Socket, newProjectId?: string) {
        const data = this.clients.get(socket.id);
        if (!data) return;

        if (data.projectId) {
            socket.leave(`project:${data.projectId}`);
        }

        data.projectId = newProjectId;
        if (newProjectId) {
            socket.join(`project:${newProjectId}`);
        }
    }

    /**
     * Broadcast to specific company (tenant)
     */
    public broadcastToCompany(companyId: string, message: Partial<RealtimeMessage>, excludeUserId?: string) {
        if (!this.io) return;

        const fullMessage: RealtimeMessage = {
            timestamp: new Date().toISOString(),
            type: 'generic_update',
            ...message
        };

        let target = this.io.to(`company:${companyId}`);

        // Exclude specific user if needed
        // Note: In Socket.io, we'd need to find the specific socket, but for broadcast it's easier to just let the client filter if needed, 
        // or we can use the 'except' if we tracked user rooms. We do: user rooms are 'user:ID'
        if (excludeUserId) {
            target = target.except(`user:${excludeUserId}`);
        }

        target.emit('message', fullMessage);
    }

    /**
     * Broadcast to specific project room
     */
    public broadcastToProject(projectId: string, message: Partial<RealtimeMessage>, excludeUserId?: string) {
        if (!this.io) return;

        const fullMessage: RealtimeMessage = {
            timestamp: new Date().toISOString(),
            type: 'project_update',
            projectId,
            ...message
        };

        let target = this.io.to(`project:${projectId}`);
        if (excludeUserId) {
            target = target.except(`user:${excludeUserId}`);
        }

        target.emit('message', fullMessage);
    }

    /**
     * Broadcast to specific user
     */
    public sendToUser(userId: string, message: Partial<RealtimeMessage>) {
        if (!this.io) return;

        const fullMessage: RealtimeMessage = {
            timestamp: new Date().toISOString(),
            type: 'notification',
            ...message
        };

        this.io.to(`user:${userId}`).emit('message', fullMessage);
    }

    /**
     * Entity level broadcasts
     */
    public notifyEntityChanged(companyId: string, entityType: string, entityId: string, action: 'create' | 'update' | 'delete', data?: any) {
        this.broadcastToCompany(companyId, {
            type: `entity_${action}`,
            entityType,
            entityId,
            payload: data,
            action
        });
    }

    public broadcastToSuperAdmins(message: Partial<RealtimeMessage>) {
        if (!this.io) return;

        const fullMessage: RealtimeMessage = {
            timestamp: new Date().toISOString(),
            type: 'superadmin_update',
            ...message
        };

        this.io.to('superadmins').emit('message', fullMessage);
    }

    public notifySystemAlert(severity: 'info' | 'warning' | 'critical' | 'success', message: string, details?: any) {
        this.broadcastToSuperAdmins({
            type: 'system_alert',
            severity,
            message,
            details
        });
    }

    public broadcastToAll(message: any) {
        if (!this.io) return;
        this.io.emit('message', message);
    }
}

export const realtimeService = RealtimeService.getInstance();
