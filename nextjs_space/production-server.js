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
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Coupling with application logic
    try {
        // We use the existing service logic if reachable, or define base handlers
        // In standalone mode, we handle the fundamental socket orchestration here
        io.on('connection', (socket) => {
            console.log(`[REALTIME] Socket coupled: ${socket.id}`);

            socket.on('join-project', (data) => {
                const {
                    projectId,
                    userId
                } = data;
                socket.join(`project-${projectId}`);
                console.log(`[REALTIME] User ${userId} anchored to project ${projectId}`);
                io.to(`project-${projectId}`).emit('user-joined-project', {
                    userId,
                    projectId,
                    timestamp: new Date()
                });
            });

            socket.on('task-update', (data) => {
                const {
                    projectId,
                    task
                } = data;
                socket.to(`project-${projectId}`).emit('task-updated', {
                    task,
                    timestamp: new Date()
                });
            });

            socket.on('project-message', (data) => {
                const {
                    projectId,
                    message,
                    senderName,
                    userId
                } = data;
                io.to(`project-${projectId}`).emit('new-message', {
                    message,
                    senderName,
                    senderId: userId,
                    timestamp: new Date()
                });
            });

            socket.on('ping', () => socket.emit('pong'));

            socket.on('disconnect', () => {
                console.log(`[REALTIME] Socket decoupled: ${socket.id}`);
            });
        });
    } catch (realtimeError) {
        console.error('[CRITICAL] Realtime coupling failed:', realtimeError);
    }

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Production environment live on http://localhost:${port}`);
    });
});