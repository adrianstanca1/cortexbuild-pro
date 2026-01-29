const {
    createServer
} = require('http');
const {
    parse
} = require('url');
const next = require('next');
const {
    Server
} = require('socket.io');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';
const app = next({
    dev
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.IO
    const io = new Server(httpServer, {
        path: '/api/socketio',
        addTrailingSlash: false,
        cors: {
            origin: process.env.NEXTAUTH_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    const {
        decode
    } = require('next-auth/jwt');
    const {
        PrismaClient
    } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Coupling with application logic
    try {
        io.on('connection', (socket) => {
            console.log(`[REALTIME] Socket connected: ${socket.id}`);

            // Handle authentication
            socket.on('authenticate', async (data) => {
                try {
                    const {
                        token,
                        userId
                    } = data;
                    if (!token) {
                        socket.emit('authentication-error', {
                            message: 'Token required'
                        });
                        socket.disconnect();
                        return;
                    }

                    const decoded = await decode({
                        token,
                        secret: process.env.NEXTAUTH_SECRET || ''
                    });

                    if (!decoded || !decoded.sub) {
                        socket.emit('authentication-error', {
                            message: 'Invalid token'
                        });
                        socket.disconnect();
                        return;
                    }

                    // Enforce identity match
                    if (decoded.sub !== userId && decoded.id !== userId) {
                        console.warn(`[SECURITY] Auth mismatch: Token ${decoded.sub} vs Claim ${userId}`);
                        socket.emit('authentication-error', {
                            message: 'Identity mismatch'
                        });
                        socket.disconnect();
                        return;
                    }

                    socket.userId = userId;
                    socket.emit('authenticated', {
                        message: 'Authenticated'
                    });
                    console.log(`[REALTIME] User ${userId} authenticated on ${socket.id}`);
                } catch (e) {
                    console.error('Auth error:', e);
                    socket.disconnect();
                }
            });

            socket.on('join-project', async (data) => {
                const {
                    projectId
                } = data;
                const userId = socket.userId;

                if (!userId) {
                    socket.emit('error', {
                        message: 'Not authenticated'
                    });
                    return;
                }

                // Check project membership via Prisma
                try {
                    const member = await prisma.projectTeamMember.findFirst({
                        where: {
                            projectId,
                            teamMember: {
                                userId
                            }
                        }
                    });

                    if (!member) {
                        socket.emit('error', {
                            message: 'Access denied'
                        });
                        return;
                    }

                    socket.projectId = projectId;
                    socket.join(`project-${projectId}`);
                    console.log(`[REALTIME] User ${userId} joined project ${projectId}`);
                    io.to(`project-${projectId}`).emit('user-joined-project', {
                        userId,
                        projectId,
                        timestamp: new Date()
                    });
                } catch (e) {
                    console.error('Join error:', e);
                    socket.emit('error', {
                        message: 'Join failed'
                    });
                }
            });

            // Secure broadcast handlers
            const secureEmit = (event, data, targetRoom) => {
                if (!socket.userId || (socket.projectId && socket.projectId !== targetRoom.replace('project-', ''))) {
                    socket.emit('error', {
                        message: 'Unauthorized broadcast'
                    });
                    return;
                }
                socket.to(targetRoom).emit(event, {
                    ...data,
                    userId: socket.userId,
                    timestamp: new Date()
                });
            };

            socket.on('task-update', (data) => {
                secureEmit('task-updated', {
                    task: data.task
                }, `project-${data.projectId}`);
            });

            socket.on('project-message', (data) => {
                secureEmit('new-message', {
                    message: data.message,
                    senderName: data.senderName,
                    senderId: socket.userId
                }, `project-${data.projectId}`);
            });

            socket.on('user-status-update', (data) => {
                secureEmit('user-status-changed', {
                    status: data.status
                }, `project-${data.projectId}`);
            });

            socket.on('notification', (data) => {
                secureEmit('notification-received', {
                    notification: data.notification
                }, `project-${data.projectId}`);
            });

            socket.on('disconnect', () => {
                console.log(`[REALTIME] Socket disconnected: ${socket.id}`);
            });
        });
        console.log('[REALTIME] Secure Socket.IO initialized directly');
    } catch (realtimeError) {
        console.error('[CRITICAL] Realtime init failed:', realtimeError);
    }

    httpServer.listen(port, hostname, (err) => {
        if (err) throw err;
        console.log(`> Production environment live on http://${hostname}:${port}`);
        console.log(`> Server ready to accept connections from nginx reverse proxy`);
    });
}).catch((err) => {
    console.error('[FATAL] Failed to prepare Next.js application:', err);
    process.exit(1);
});