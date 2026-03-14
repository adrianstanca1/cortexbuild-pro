import { Server as SocketIOServer, Socket } from 'socket.io';
import { IncomingMessage, Server as HttpServer } from 'http';
import { Express } from 'express';
import { logger } from './utils/logger.js';
import jwt from 'jsonwebtoken';
import { getDb } from './database.js';
import { realtimeService } from './services/realtimeService.js';
import { messageQueue, heartbeatMonitor } from './services/websocketQueue.js';
import { collaborationService } from './services/collaboration/collaborationService.js';
import { UserRole } from './types.js';

// Connection statistics
interface ConnectionStats {
    totalConnections: number;
    activeConnections: number;
    messagesReceived: number;
    messagesSent: number;
    errors: number;
    reconnections: number;
    lastError?: { timestamp: Date; message: string };
}

const connectionStats: ConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesReceived: 0,
    messagesSent: 0,
    errors: 0,
    reconnections: 0
};

export const getConnectionStats = () => ({ ...connectionStats });

export const setupWebSocketServer = (server: HttpServer | any, app: Express | any) => {
    logger.info('[Socket.io] Initializing server...');
    const io = new SocketIOServer(server, {
        path: '/live',
        cors: {
            origin: (origin, callback) => {
                logger.debug(`[Socket.io] CORS request from: ${origin}`);
                callback(null, true);
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['polling', 'websocket'],
        allowEIO3: true
    });

    // Initialize collaboration service
    collaborationService.init(io);

    // Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token as string;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            let userId: string | undefined;
            let companyId: string | undefined;
            let role: string | undefined;
            let userName: string | undefined;

            // 1. IMPERSONATION TOKEN
            if (token.startsWith('imp_v1:')) {
                const secret = process.env.IMPERSONATION_SECRET || process.env.JWT_SECRET || 'dev_secret';
                const parts = token.split(':');
                if (parts.length === 4) {
                    const [prefix, targetId, timestamp, signature] = parts;
                    const payload = `${prefix}:${targetId}:${timestamp}`;
                    const expectedSignature = (await import('crypto')).createHmac('sha256', secret).update(payload).digest('hex');

                    if (signature === expectedSignature) {
                        const db = getDb();
                        const session = await db.get(
                            `SELECT * FROM impersonation_sessions WHERE token = ? AND status = 'active'`,
                            [token]
                        );

                        if (session && new Date(session.expiresAt) > new Date()) {
                            userId = targetId;
                            companyId = session.companyId;
                            const user = await db.get('SELECT role, name FROM users WHERE id = ?', [userId]);
                            role = user?.role || 'impersonated';
                            userName = user?.name || 'Unknown';
                        }
                    }
                }
            }

            // 2. STANDARD JWT
            if (!userId) {
                const secret = process.env.JWT_SECRET;
                if (!secret) return next(new Error('Server configuration error'));

                const decoded: any = jwt.verify(token, secret);
                userId = decoded.sub || decoded.userId;
                companyId = decoded.companyId || decoded.user_metadata?.companyId;
                role = decoded.role || decoded.user_metadata?.role;
                userName = decoded.name || decoded.user_metadata?.name || 'Unknown';
            }

            if (!userId) return next(new Error('Authentication failed'));

            // Attach data to socket
            (socket as any).userId = userId;
            (socket as any).companyId = companyId;
            (socket as any).role = role;
            (socket as any).userName = userName;

            next();
        } catch (err: any) {
            logger.warn(`[Socket.io] Auth failed: ${err.message}`);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const userId = (socket as any).userId;
        const companyId = (socket as any).companyId;
        const role = (socket as any).role;
        const userName = (socket as any).userName;

        logger.info(`[Socket.io] User connected: ${userId} (${socket.id})`);

        connectionStats.totalConnections++;
        connectionStats.activeConnections++;

        const clientState = {
            userId,
            companyId,
            role,
            userName,
            connectedAt: new Date()
        };

        realtimeService.init(io);
        realtimeService.registerClient(socket, clientState);

        // Initialize user presence
        collaborationService.updatePresence(userId, {
            userId,
            userName,
            status: 'online',
            companyId
        });

        // Join company room
        if (companyId) {
            socket.join(`company:${companyId}`);
        }
        socket.join(`user:${userId}`);

        // Initialize message queue and heartbeat
        messageQueue.setSocketIO(io);
        heartbeatMonitor.setSocketIO(io);

        // Flush any queued messages for this user
        if (userId) {
            messageQueue.flushQueue(userId, socket.id).catch(err => {
                logger.error('Failed to flush message queue:', err);
            });
        }

        if (companyId) {
            broadcastCompanyPresence(io, companyId);
        }

        // ====================
        // COLLABORATION EVENTS
        // ====================

        // Presence management
        socket.on('presence:update', (data: { status: 'online' | 'away' | 'busy' }) => {
            collaborationService.updatePresence(userId, {
                status: data.status
            });
        });

        // Cursor tracking
        socket.on('cursor:update', (data: { documentId: string; x: number; y: number }) => {
            collaborationService.updateCursor(userId, {
                x: data.x,
                y: data.y,
                documentId: data.documentId
            });
        });

        // Document collaboration
        socket.on('document:join', (data: { documentId: string }) => {
            const room = `doc:${data.documentId}`;
            socket.join(room);
            collaborationService.joinDocument(userId, data.documentId);
            
            // Send current collaborators
            const collaborators = collaborationService.getDocumentCollaborators(data.documentId);
            socket.emit('document:users', {
                documentId: data.documentId,
                users: collaborators
            });

            // Log activity
            collaborationService.logActivity({
                companyId: companyId || '',
                userId,
                userName,
                action: 'joined_document',
                entityType: 'document',
                entityId: data.documentId
            });
        });

        socket.on('document:leave', (data: { documentId: string }) => {
            const room = `doc:${data.documentId}`;
            socket.leave(room);
            collaborationService.leaveDocument(userId, data.documentId);
        });

        // Real-time document editing
        socket.on('document:edit', async (data: {
            documentId: string;
            operation: 'insert' | 'delete' | 'replace' | 'format';
            position: number;
            content?: string;
            length?: number;
        }) => {
            try {
                const edit = await collaborationService.applyEdit({
                    documentId: data.documentId,
                    userId,
                    userName,
                    operation: data.operation,
                    position: data.position,
                    content: data.content,
                    length: data.length
                });

                // Acknowledge edit
                socket.emit('document:edit_ack', { editId: edit.id, version: edit.version });
            } catch (err) {
                logger.error('[Socket.io] Document edit error:', err);
                socket.emit('document:edit_error', { error: 'Failed to apply edit' });
            }
        });

        // Comments and annotations
        socket.on('comment:create', async (data: {
            entityType: 'document' | 'task' | 'project' | 'whiteboard';
            entityId: string;
            content: string;
            parentId?: string;
            mentions?: string[];
            position?: { x: number; y: number };
        }) => {
            try {
                const comment = await collaborationService.createComment({
                    entityType: data.entityType,
                    entityId: data.entityId,
                    userId,
                    userName,
                    content: data.content,
                    parentId: data.parentId,
                    mentions: data.mentions || [],
                    position: data.position,
                    resolved: false
                });

                socket.emit('comment:created_ack', { commentId: comment.id });
            } catch (err) {
                logger.error('[Socket.io] Comment creation error:', err);
                socket.emit('comment:error', { error: 'Failed to create comment' });
            }
        });

        // Whiteboard collaboration
        socket.on('whiteboard:join', (data: { whiteboardId: string }) => {
            const room = `whiteboard:${data.whiteboardId}`;
            socket.join(room);
            logger.info(`[Socket.io] User ${userId} joined whiteboard: ${data.whiteboardId}`);
        });

        socket.on('whiteboard:leave', (data: { whiteboardId: string }) => {
            const room = `whiteboard:${data.whiteboardId}`;
            socket.leave(room);
        });

        socket.on('whiteboard:element_add', (data: {
            whiteboardId: string;
            element: any;
        }) => {
            const element = collaborationService.addWhiteboardElement(
                data.whiteboardId,
                { ...data.element, createdBy: userId, updatedBy: userId }
            );

            if (element) {
                socket.emit('whiteboard:element_ack', { elementId: element.id });
            }
        });

        socket.on('whiteboard:element_update', (data: {
            whiteboardId: string;
            elementId: string;
            updates: any;
        }) => {
            collaborationService.updateWhiteboardElement(
                data.whiteboardId,
                data.elementId,
                { ...data.updates, updatedBy: userId }
            );
        });

        // Activity feed subscription
        socket.on('activity:subscribe', async () => {
            if (companyId) {
                const activities = await collaborationService.getRecentActivity(companyId, 20);
                socket.emit('activity:history', activities);
            }
            (socket as any).activitySubscribed = true;
        });

        socket.on('activity:unsubscribe', () => {
            (socket as any).activitySubscribed = false;
        });

        // Legacy events
        socket.on('message', (data: any) => {
            connectionStats.messagesReceived++;
            handleSocketMessage(socket, data);
        });

        socket.on('join_project', (data: { projectId: string }) => {
            logger.info(`[Socket.io] User ${userId} joining project: ${data.projectId}`);
            realtimeService.updateClientProject(socket, data.projectId);

            io.to(`project:${data.projectId}`).emit('message', {
                type: 'presence_update',
                userId,
                status: 'online'
            });
        });

        // Live location tracking
        socket.on('location_update', (data: { latitude: number; longitude: number; accuracy?: number; altitude?: number; heading?: number; speed?: number }) => {
            if (userId && companyId && data.latitude != null && data.longitude != null) {
                io.to(`company:${companyId}`).emit('message', {
                    type: 'location_update',
                    entityType: 'user_location',
                    data: {
                        userId,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        accuracy: data.accuracy,
                        altitude: data.altitude,
                        heading: data.heading,
                        speed: data.speed,
                        recordedAt: new Date().toISOString()
                    }
                });
            }
        });

        // Join live map room for a project
        socket.on('join_live_map', (data: { projectId: string }) => {
            if (data.projectId) {
                socket.join(`livemap:${data.projectId}`);
                logger.info(`[Socket.io] User ${userId} joined live map: ${data.projectId}`);
            }
        });

        socket.on('leave_live_map', (data: { projectId: string }) => {
            if (data.projectId) {
                socket.leave(`livemap:${data.projectId}`);
            }
        });

        // Heartbeat handling
        socket.on('heartbeat', () => {
            heartbeatMonitor.recordHeartbeat(socket.id);
            socket.emit('heartbeat_ack');
        });

        socket.on('disconnect', () => {
            logger.info(`[Socket.io] User disconnected: ${userId}`);
            connectionStats.activeConnections--;
            
            // Update presence
            collaborationService.updatePresence(userId, { status: 'offline' });
            collaborationService.removePresence(userId);
            
            realtimeService.unregisterClient(socket);
            heartbeatMonitor.removeClient(socket.id);
            
            if (companyId) {
                broadcastCompanyPresence(io, companyId);
            }
        });

        socket.on('error', (err) => {
            connectionStats.errors++;
            connectionStats.lastError = {
                timestamp: new Date(),
                message: err.message || 'Unknown error'
            };
            logger.error('[Socket.io] Error:', err);
        });

        // Activity Monitor Subscription (legacy)
        socket.on('activity:subscribe_legacy', () => {
            logger.info(`[Socket.io] Activity metrics subscription from: ${userId}`);
            (socket as any).activitySubscribed = true;
            broadcastActivityMetrics(io);
        });

        socket.on('activity:unsubscribe_legacy', () => {
            logger.info(`[Socket.io] Activity metrics unsubscription from: ${userId}`);
            (socket as any).activitySubscribed = false;
        });
    });

    (global as any).io = io;
    (global as any).wsStats = connectionStats;

    // Start heartbeat monitoring
    heartbeatMonitor.start();

    // Broadcast activity metrics every 5 seconds to subscribed clients
    const activityInterval = setInterval(() => {
        broadcastActivityMetrics(io);
    }, 5000);

    (global as any).activityInterval = activityInterval;

    return io;
};

export const closeWebSocketServer = () => {
    const io = (global as any).io;
    const interval = (global as any).activityInterval;

    heartbeatMonitor.stop();

    if (interval) {
        clearInterval(interval);
        delete (global as any).activityInterval;
    }

    if (io) {
        io.close();
        delete (global as any).io;
    }
};

const handleSocketMessage = (socket: Socket, data: any) => {
    const userId = (socket as any).userId;
    const companyId = (socket as any).companyId;

    if (!data || !data.type) return;

    switch (data.type) {
        case 'chat_typing': {
            const projectId = (socket as any).projectId;
            if (projectId) {
                socket.to(`project:${projectId}`).emit('message', {
                    ...data,
                    userId
                });
            }
            break;
        }
        case 'presence_ping':
            // Socket.io handles heartbeats automatically
            break;
    }
};

const broadcastCompanyPresence = (io: SocketIOServer, companyId: string) => {
    const sockets = io.sockets.adapter.rooms.get(`company:${companyId}`);
    const onlineUsers = new Set<string>();

    if (sockets) {
        for (const socketId of sockets) {
            const s = io.sockets.sockets.get(socketId);
            if (s && (s as any).userId) onlineUsers.add((s as any).userId);
        }
    }

    const userList = Array.from(onlineUsers);
    io.to(`company:${companyId}`).emit('message', {
        type: 'company_presence',
        users: userList,
        count: userList.length
    });
};

// Broadcast activity metrics to subscribed clients
const broadcastActivityMetrics = (io: SocketIOServer) => {
    const activeUsers = new Set<string>();
    const companiesOnline = new Set<string>();

    io.sockets.sockets.forEach((socket: any) => {
        if (socket.userId) {
            activeUsers.add(socket.userId);
        }
        if (socket.companyId) {
            companiesOnline.add(socket.companyId);
        }
    });

    const now = Date.now();
    const recentMessages = connectionStats.messagesReceived;
    const totalMessages = connectionStats.messagesReceived + connectionStats.messagesSent;
    const errorRate = totalMessages > 0 ? (connectionStats.errors / totalMessages) * 100 : 0;

    const metrics = {
        activeUsers: activeUsers.size,
        totalSessions: connectionStats.activeConnections,
        apiRequestsPerMinute: recentMessages > 0 ? Math.floor(recentMessages / 60) : 0,
        errorRate: parseFloat(errorRate.toFixed(2)),
        companiesOnline: companiesOnline.size,
    };

    io.sockets.sockets.forEach((socket: any) => {
        if (socket.activitySubscribed && socket.role === UserRole.SUPERADMIN) {
            socket.emit('activity:metrics', metrics);
        }
    });
};

// Legacy support - use global io reference
export const broadcastToCompany = (companyId: string, message: any, excludeUserId?: string) => {
    const globalIo = (global as any).io;
    if (globalIo) {
        globalIo.to(`company:${companyId}`).except(excludeUserId ? `user:${excludeUserId}` : '').emit('message', message);
    }
};

export const broadcastToUser = (userId: string, message: any) => {
    const globalIo = (global as any).io;
    if (globalIo) {
        globalIo.to(`user:${userId}`).emit('message', message);
    }
};

export const broadcastToAll = (message: any) => {
    const globalIo = (global as any).io;
    if (globalIo) {
        globalIo.emit('message', message);
    }
};

export const broadcastToSuperAdmins = (message: any) => {
    const globalIo = (global as any).io;
    if (globalIo) {
        globalIo.to('superadmins').emit('message', message);
    }
};

export const broadcastToProject = (projectId: string, payload: any) => {
    const globalIo = (global as any).io;
    if (!globalIo) {
        logger.warn('Socket.io not initialized, cannot broadcast to project');
        return;
    }
    const room = `project:${projectId}`;
    globalIo.to(room).emit(payload.event, payload.data);
    logger.debug(`Broadcasted ${payload.event} to project room: ${room}`);
};
