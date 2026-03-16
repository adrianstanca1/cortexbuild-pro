import { Server as SocketIOServer, Socket } from 'socket.io';
import { IncomingMessage, Server as HttpServer } from 'http';
import { Express } from 'express';
import { logger } from './utils/logger.js';
import jwt from 'jsonwebtoken';
import { getDb } from './database.js';
import { realtimeService } from './services/realtimeService.js';
import { messageQueue, heartbeatMonitor } from './services/websocketQueue.js';
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
                callback(null, true); // Allow all for now to bypass Hostinger proxy quirks
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['polling', 'websocket'], // Backend supports both, frontend will be forced to polling
        allowEIO3: true
    });

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
                            const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
                            role = user?.role || 'impersonated';
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
            }

            if (!userId) return next(new Error('Authentication failed'));

            // Attach data to socket
            (socket as any).userId = userId;
            (socket as any).companyId = companyId;
            (socket as any).role = role;

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

        logger.info(`[Socket.io] User connected: ${userId} (${socket.id})`);

        connectionStats.totalConnections++;
        connectionStats.activeConnections++;

        const clientState = {
            userId,
            companyId,
            role,
            connectedAt: new Date()
        };

        realtimeService.init(io); // Ensure init
        realtimeService.registerClient(socket, clientState);

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

        // Heartbeat handling
        socket.on('heartbeat', () => {
            heartbeatMonitor.recordHeartbeat(socket.id);
            socket.emit('heartbeat_ack');
        });

        socket.on('disconnect', () => {
            logger.info(`[Socket.io] User disconnected: ${userId}`);
            connectionStats.activeConnections--;
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

        // Activity Monitor Subscription
        socket.on('activity:subscribe', () => {
            logger.info(`[Socket.io] Activity metrics subscription from: ${userId}`);
            (socket as any).activitySubscribed = true;

            // Immediately send current metrics
            broadcastActivityMetrics(io);
        });

        socket.on('activity:unsubscribe', () => {
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

    // Stop heartbeat monitoring
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
            // Socket.io handles heartbeats automatically, but kept for compatibility
            break;
    }
};

const broadcastCompanyPresence = (io: SocketIOServer, companyId: string) => {
    // Get unique user IDs in this company room
    // Note: In Socket.io 4.x we can't easily iterate room sockets synchronously for IDs without a custom map,
    // but we can use the rooms to find who is in company:ID

    // For simplicity and matching legacy logic, we can keep a local user tracker if needed,
    // or just broadcast the event and let clients manage their own lists.
    // However, to match the "completely fixed" requirement, let's keep it functional.

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
    // Calculate metrics
    const activeUsers = new Set<string>();
    const companiesOnline = new Set<string>();

    // Iterate through all connected sockets
    io.sockets.sockets.forEach((socket: any) => {
        if (socket.userId) {
            activeUsers.add(socket.userId);
        }
        if (socket.companyId) {
            companiesOnline.add(socket.companyId);
        }
    });

    // API request rate (estimate from recent messages)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMessages = connectionStats.messagesReceived; // Simplified - in production, track timestamps

    // Error rate calculation (errors / total messages * 100)
    const totalMessages = connectionStats.messagesReceived + connectionStats.messagesSent;
    const errorRate = totalMessages > 0 ? (connectionStats.errors / totalMessages) * 100 : 0;

    const metrics = {
        activeUsers: activeUsers.size,
        totalSessions: connectionStats.activeConnections,
        apiRequestsPerMinute: recentMessages > 0 ? Math.floor(recentMessages / 60) : 0, // Simplified
        errorRate: parseFloat(errorRate.toFixed(2)),
        companiesOnline: companiesOnline.size,
    };

    // Emit to all subscribed clients
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
