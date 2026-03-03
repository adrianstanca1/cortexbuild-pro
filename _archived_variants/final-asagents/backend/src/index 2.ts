import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { getDatabase } from './database/connection';
import { runMigrations } from './database/migrate';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import invoiceRoutes from './routes/invoices';
import healthRoutes from './routes/health';

// Environment configuration
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4002,http://localhost:4003';

// Create Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time features
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    data: {
      message: 'Connected to ASAgents WebSocket server',
      timestamp: new Date().toISOString()
    }
  }));
  
  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 WebSocket message received:', message);
      
      // Echo message back for now (can be extended for real-time features)
      ws.send(JSON.stringify({
        type: 'echo',
        data: message,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Broadcast function for real-time updates
function broadcast(message: any) {
  const data = JSON.stringify({
    ...message,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging for debugging
app.use((req, res, next) => {
  if (NODE_ENV === 'development') {
    console.log(`📝 ${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      headers: {
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        'content-type': req.headers['content-type']
      }
    });
  }
  next();
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invoices', invoiceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'ASAgents Backend API',
      version: '1.0.0',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        projects: '/api/projects',
        invoices: '/api/invoices'
      },
      websocket: '/ws'
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'ASAgents Backend API',
      version: '1.0.0',
      environment: NODE_ENV,
      endpoints: [
        'GET /api/health - Health check',
        'POST /api/auth/login - User login',
        'GET /api/auth/me - Get current user',
        'GET /api/projects - List projects',
        'POST /api/projects - Create project',
        'GET /api/invoices - List invoices',
        'POST /api/invoices - Create invoice'
      ],
      websocket: 'ws://localhost:' + PORT + '/ws'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting ASAgents Backend Server...');
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`🌐 CORS Origin: ${CORS_ORIGIN}`);
    
    // Initialize database
    console.log('🗄️ Initializing database...');
    const db = getDatabase();
    
    // Run migrations
    console.log('🔄 Running database migrations...');
    await runMigrations();
    
    // Test database connection
    const dbHealth = await db.healthCheck();
    if (dbHealth.status === 'connected') {
      console.log('✅ Database connected successfully');
    } else {
      throw new Error('Database connection failed');
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
      console.log('✨ ASAgents Backend is ready!');
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('🔌 HTTP server closed');
  });
  
  // Close WebSocket server
  wss.close(() => {
    console.log('🔌 WebSocket server closed');
  });
  
  // Close database connection
  try {
    const db = getDatabase();
    await db.close();
    console.log('🗄️ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('🔌 HTTP server closed');
  });
  
  wss.close(() => {
    console.log('🔌 WebSocket server closed');
  });
  
  try {
    const db = getDatabase();
    await db.close();
    console.log('🗄️ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export { app, server, wss, broadcast };
