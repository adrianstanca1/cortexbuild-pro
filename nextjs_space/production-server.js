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

    io.on('connection', (socket) => {
        console.log('Socket coupled in production:', socket.id);

        socket.on('ping', () => socket.emit('pong'));

        socket.on('disconnect', () => {
            console.log('Socket decoupled:', socket.id);
        });
    });

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Production environment live on http://localhost:${port}`);
    });
});