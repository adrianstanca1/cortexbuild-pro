import dotenv from 'dotenv';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
// Load environment variables, but DO NOT override NODE_ENV if it's already set (e.g., by vitest)
const existingNodeEnv = process.env.NODE_ENV;
dotenv.config({ override: true });
if (existingNodeEnv === 'test' || existingNodeEnv === 'testing') {
    process.env.NODE_ENV = existingNodeEnv;
}
const isProduction = process.env.NODE_ENV === 'production';
logger.info(`Server initialized in ${process.env.NODE_ENV || 'development'} mode`);
if (!isProduction) {
    logger.info('External DB Host:', process.env.DB_HOST || 'Unset');
}
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';

// Internal
import { logger } from './utils/logger.js';
import { AppError } from './utils/AppError.js';
import { initializeDatabase, getDb, ensureDbInitialized } from './database.js';
import { seedDatabase } from './seed.js';
import { setupWebSocketServer, getConnectionStats } from './socket.js';
import { realtimeService } from './services/realtimeService.js';
import { UserRole } from './types.js';

// Middleware
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimit.js';
import { requireRole, requirePermission } from './middleware/rbacMiddleware.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import { contextMiddleware } from './middleware/contextMiddleware.js';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware.js';
import { rateLimit } from './middleware/rateLimitMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';
import { responseCacheMiddleware, connectionHealthMiddleware } from './middleware/performanceMiddleware.js';
import { metricsMiddleware, getMetrics as getRequestMetrics } from './middleware/metricsMiddleware.js';

// Services
import { TenantService } from './services/tenantService.js';
import * as activityService from './services/activityService.js';
import { auditService } from './services/auditService.js';
import * as systemSettingsController from './controllers/systemSettingsController.js';

// Controllers
import * as companyController from './controllers/companyController.js';
import * as platformController from './controllers/platformController.js';
import * as userManagementController from './controllers/userManagementController.js';
import * as dailyLogController from './controllers/dailyLogController.js';
import * as marketplaceController from './controllers/marketplaceController.js';
import * as rfiController from './controllers/rfiController.js';
import * as safetyController from './controllers/safetyController.js';
import * as liveMapController from './controllers/liveMapController.js';
import * as accountingController from './controllers/accountingController.js';
// import * as taskController from './controllers/taskController.js'; // Removed
import * as commentController from './controllers/commentController.js';
import * as rbacController from './controllers/rbacController.js';
import * as automationController from './controllers/automationController.js';
import * as predictiveController from './controllers/predictiveController.js';
import * as ocrController from './controllers/ocrController.js';
import * as analyticsController from './controllers/analyticsController.js';
import * as integrationController from './controllers/integrationController.js';
import * as tenantTeamController from './controllers/tenantTeamController.js';
import * as superadminCompanyController from './controllers/superadminCompanyController.js';
import { getVendors, createVendor, updateVendor } from './controllers/vendorController.js';
import { getCostCodes, createCostCode, updateCostCode } from './controllers/costCodeController.js';
import * as invoiceController from './controllers/invoiceController.js';
import * as mlController from './controllers/mlController.js';
import * as searchController from './controllers/searchController.js';
import * as authController from './controllers/authController.js';

// Middleware
import { tenantRoutingMiddleware } from './middleware/tenantMiddleware.js';

// Routes
import tenantRoutes from './routes/tenantRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import clientPortalRoutes from './routes/clientPortalRoutes.js';
import setupRoutes from './routes/setupRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import aiRoutes from './routes/ai.js';
import provisioningRoutes from './routes/provisioningRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import impersonationRoutes from './routes/impersonationRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import platformAutomationRoutes from './routes/platformAutomationRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import databaseRoutes from './routes/databaseRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import apiManagementRoutes from './routes/apiManagementRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import accessRoutes from './routes/accessRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import dataManagementRoutes from './routes/dataManagementRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import planRoutes from './routes/planRoutes.js';
import constructionRoutes from './routes/constructionRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import hazardRoutes from './routes/hazardRoutes.js';
import schedulingRoutes from './routes/schedulingRoutes.js';
import { sessionIpLockMiddleware, dynamicCspMiddleware, auditLoggingMiddleware } from './middleware/securityMiddleware.js';

// GraphQL
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';

// Initialize Sentry (profiling disabled for CloudLinux 8 compatibility)
if (process.env.NODE_ENV !== 'test') {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            // nodeProfilingIntegration() disabled due to GLIBCXX_3.4.29 requirement
        ],
        // Tracing
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
    });
}

const app = express();

// Standardize URL formatting and handle proxy-induced prefix doubling
app.use((req, res, next) => {
    const originalUrl = req.url;

    // Debug log for every request in production
    if (process.env.NODE_ENV === 'production') {
        logger.info(`[Incoming Request] ${req.method} ${originalUrl} (URL: ${req.url})`);
    }

    // Aggressive normalization: Strip all combinations of /api, /v1, /auth that are repeated
    // Also normalize Socket.io paths early
    if (req.url.startsWith('/api/live')) {
        req.url = req.url.replace('/api/live', '/live');
    }

    // Use a regex to identify doubling/tripling of known prefixes
    // This handles /api/api/v1, /v1/api/v1, /api/auth/api, etc.
    const prefixRegex = /^(\/(api|v\d+))+(?=\/|$)/i;
    const match = req.url.match(prefixRegex);

    if (match) {
        const fullPrefix = match[0];
        let remainingPath = req.url.substring(fullPrefix.length);
        if (!remainingPath.startsWith('/')) remainingPath = '/' + remainingPath;

        // Reconstruct the most likely intended path
        if (fullPrefix.toLowerCase().includes('/v1')) {
            req.url = '/api/v1' + (remainingPath === '/' ? '' : remainingPath);
        } else if (fullPrefix.toLowerCase().includes('/auth')) {
            req.url = '/api/auth' + (remainingPath === '/' ? '' : remainingPath);
        } else {
            req.url = '/api' + (remainingPath === '/' ? '' : remainingPath);
        }
    } else {
        // Handle cases where the prefix is completely missing but it's an API route
        const apiPaths = [
            '/platform', '/companies/all', '/api-management', '/support',
            '/security', '/auth', '/health', '/metrics', '/db', '/database',
            '/provisioning', '/audit', '/compliance', '/impersonation',
            '/modules', '/dashboard', '/automations', '/platform-automation',
            '/tenants', '/projects', '/tasks', '/users', '/notifications',
            '/analytics', '/financials', '/storage', '/access', '/permissions'
        ];

        const isApiRequest = apiPaths.some(p => req.url.startsWith(p));
        if (isApiRequest && !req.url.startsWith('/api/')) {
            const original = req.url;
            req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
            logger.info(`[URL Normalizer] Prepended /api: ${original} -> ${req.url}`);
        }
    }

    // Final safety: ensure no double slashes or trailing slashes for route matching (except root)
    req.url = req.url.replace(/\/+/g, '/');
    if (req.url.length > 1 && req.url.endsWith('/')) {
        req.url = req.url.slice(0, -1);
    }

    if (originalUrl !== req.url) {
        logger.info(`[URL Normalizer] ${originalUrl} -> ${req.url}`);
    }

    // Explicitly handle health and metrics checks here after normalization
    // to ensure they aren't bypassed or mis-matched later
    const healthPaths = ['/health', '/api/health', '/api/v1/health', '/v1/health'];
    const metricsPaths = ['/metrics', '/api/metrics', '/api/v1/metrics', '/v1/metrics'];

    if (healthPaths.includes(req.url)) {
        return getHealth(req, res);
    }
    if (metricsPaths.includes(req.url)) {
        return getMetrics(req, res);
    }

    next();
});

// API Root / System Status - Priority handler to ensure clean subdomain output
app.get(['/', '/api'], (req, res, next) => {
    const host = req.headers.host || '';
    const isApiSubdomain = host.startsWith('api.');
    const isExplicitApiRoot = req.path === '/api' || req.path === '/api/';

    if (isApiSubdomain || isExplicitApiRoot) {
        return res.json({
            status: 'operational',
            service: 'CortexBuild Pro API',
            version: '2.0.0',
            environment: process.env.NODE_ENV || 'production',
            timestamp: new Date().toISOString(),
            diagnostics: {
                database: 'connected',
                storage: 'ready'
            }
        });
    }
    next();
});

// --- Monitoring Utilities ---
let lastEventLoopDelay = 0;
let eventLoopMonitorTimer: NodeJS.Timeout | null = null;
const monitorEventLoop = () => {
    if (process.env.NODE_ENV === 'test') return;
    const start = Date.now();
    eventLoopMonitorTimer = setTimeout(() => {
        const delay = Date.now() - start - 1000;
        lastEventLoopDelay = Math.max(0, delay);
        monitorEventLoop();
    }, 1000);
};
monitorEventLoop();

// --- Health & Metrics Implementation (Priority) ---
async function getHealth(req: any, res: any) {
    try {
        const db = getDb();
        const start = Date.now();
        await db.get('SELECT 1 as connected');
        const dbLatency = Date.now() - start;

        const tenantCount = await db.get('SELECT COUNT(*) as count FROM companies');
        const wsStats = getConnectionStats();

        res.setHeader('x-api-version', '2.0.0');
        res.json({
            status: 'online',
            service: 'CortexBuild Pro API',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            database: {
                status: 'connected',
                type: db.getType ? db.getType() : 'unknown',
                latencyMs: dbLatency,
                pool: db.getPoolStats ? db.getPoolStats() : {}
            },
            websocket: {
                activeConnections: wsStats.activeConnections,
                totalConnections: wsStats.totalConnections,
                messagesReceived: wsStats.messagesReceived,
                messagesSent: wsStats.messagesSent,
                errors: wsStats.errors
            },
            system: {
                memory: {
                    free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
                    total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
                    usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) + '%'
                },
                load: os.loadavg(),
                eventLoopDelayMs: lastEventLoopDelay,
                heapStats: process.memoryUsage()
            },
            metrics: {
                tenants: tenantCount?.count || 0
            },
            version: '2.0.0'
        });
    } catch (error: any) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

async function getMetrics(req: any, res: any) {
    try {
        const wsStats = getConnectionStats();
        const db = getDb();
        const requestMetrics = getRequestMetrics(); //Get request metrics from middleware

        const metrics = {
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            process: {
                pid: process.pid,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            websocket: wsStats,
            system: {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                memory: {
                    free: os.freemem(),
                    total: os.totalmem(),
                    used: os.totalmem() - os.freemem()
                },
                loadAverage: os.loadavg(),
                eventLoopDelayMs: lastEventLoopDelay
            },
            database: db.getPoolStats ? db.getPoolStats() : {},
            requests: requestMetrics // Include request metrics
        };

        res.json(metrics);
    } catch (error: any) {
        logger.error('Metrics retrieval failed:', error);
        res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
};

const healthPaths = ['/health', '/api/health', '/api/v1/health', '/v1/health'];
const metricsPaths = ['/metrics', '/api/metrics', '/api/v1/metrics', '/v1/metrics'];

app.get(healthPaths, getHealth);
app.get(metricsPaths, getMetrics);

// Unified Socket.io Handler mapping
app.all(['/live*', '/api/live*'], (req, res) => {
    if ((global as any).io) {
        (global as any).io.engine.handleRequest(req, res);
    } else {
        res.status(503).send('Socket.io not initialized');
    }
});

// Enable proxy trust for Hostinger Load Balancer
app.set('trust proxy', 1);

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const devPort = isDevelopment && process.env.DEV_SERVER_PORT ? Number(process.env.DEV_SERVER_PORT) : undefined;
const port = Number(process.env.PORT || devPort || 3001); // Matches Hostinger proxy configuration (dev can override via DEV_SERVER_PORT)

// Security middleware
const API_HOST = (process.env.VITE_API_URL || 'https://api.cortexbuildpro.com').replace(/\/api\/?$/, '');
const WS_HOST = process.env.VITE_WS_URL || 'wss://api.cortexbuildpro.com/live';

// Security Headers with Enhanced CSP
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com'], // 'unsafe-eval' needed for some dev tools/charts
                imgSrc: [
                    "'self'",
                    'data:',
                    'blob:',
                    'https:',
                    'https://cortexbuildpro.com',
                    'https://api.cortexbuildpro.com',
                    '*.tile.openstreetmap.org',
                    'https://unpkg.com'
                ],
                connectSrc: [
                    "'self'",
                    'ws:',
                    'wss:',
                    'https:', // Allow external APIs
                    API_HOST,
                    WS_HOST,
                    'https://api.cortexbuildpro.com',
                    'https://cortexbuildpro.com',
                    'https://fonts.googleapis.com',
                    'https://fonts.gstatic.com',
                    'https://generativelanguage.googleapis.com',
                    'https://*.ingest.sentry.io'
                ],
                fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"], // or allow if embedding is needed
                baseUri: ["'self'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: []
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin'
        }
    })
);

// CORS Configuration with Environment Separation
const productionOrigins = [
    'https://cortexbuildpro.com',
    'https://www.cortexbuildpro.com',
    'https://api.cortexbuildpro.com' // Allow self-calls
];
const developmentOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://localhost:3001'
];

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : isProduction
        ? productionOrigins
        : [...productionOrigins, ...developmentOrigins];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            const isAllowed = allowedOrigins.includes(origin) ||
                origin.endsWith('.cortexbuildpro.com') ||
                origin === 'https://cortexbuildpro.com';

            if (isAllowed) {
                logger.info(`CORS: Allowed origin: ${origin}`);
                callback(null, true);
            } else {
                logger.warn(`CORS: Rejected origin: ${origin} (Allowed: ${allowedOrigins.join(', ')})`);
                callback(new Error(`Not allowed by CORS: ${origin}`));
            }
        },
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-tenant-id',
            'x-request-id',
            'x-api-version',
            'x-company-id'
        ]
    })
);

// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-tenant-id',
        'x-request-id',
        'x-api-version',
        'x-company-id'
    ]
}));

// Request ID Tracking & API Version
app.use((req, res, next) => {
    // Normalize Socket.io paths from proxy
    if (req.url.startsWith('/api/live')) {
        req.url = req.url.replace('/api/live', '/live');
    }
    const requestId = req.header('x-request-id') || uuidv4();
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-api-version', '2.0.0');
    next();
});

// Compression & Logging with Smart Filtering
app.use(
    compression({
        level: 6, // Balance between speed and compression ratio
        threshold: 1024, // Only compress responses > 1KB
        filter: (req, res) => {
            // Don't compress WebSocket upgrade requests or streaming responses
            if (req.headers['upgrade']) return false;
            // Use compression defaults for other requests
            return compression.filter(req, res);
        }
    })
);
morgan.token('id', (req: any) => req.id);
app.use(
    morgan(':id :method :url :status :res[content-length] - :response-time ms', {
        skip: (req, res) => req.url === '/api/health' // Skip health checks to keep logs clean
    })
);

// Performance Monitoring
app.use(connectionHealthMiddleware);

// Response Caching Headers
app.use(responseCacheMiddleware);

app.use(express.json({ limit: '50mb' }));
app.use(metricsMiddleware); // Track request metrics
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Passport for OAuth
import passport from 'passport';
app.use(passport.initialize());

// --- Monitoring Utilities ---
// Health & Metrics moved to top

// Middleware to ensure DB is initialized before handling requests
app.use(async (req, res, next) => {
    try {
        await ensureDbInitialized();
        next();
    } catch (err) {
        next(err);
    }
});

// Serve local uploads with optional HMAC signature verification
const verifySignedUpload = (req: any, res: any, next: any) => {
    const signingSecret = process.env.FILE_SIGNING_SECRET;
    if (!signingSecret) return next();

    const { expires, sig } = req.query;
    if (!expires || !sig) {
        return res.status(403).json({ error: 'Signed URL required' });
    }

    const expiresAt = Number(expires);
    if (!expiresAt || Date.now() > expiresAt) {
        return res.status(403).json({ error: 'Signed URL expired' });
    }

    const relativePath = req.path.replace(/^\/+/, '');
    const parts = relativePath.split('/');
    const tenantId = parts.length >= 2 && parts[0] === 'tenants' ? parts[1] : 'unknown';
    const payload = `${tenantId}:${relativePath}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', signingSecret).update(payload).digest('hex');

    if (expectedSig !== sig) {
        return res.status(403).json({ error: 'Invalid signature' });
    }

    return next();
};

app.use('/uploads', verifySignedUpload, express.static(resolve('uploads')));

// Serve frontend static files - Unified deployment (frontend + backend together)
if (process.env.NODE_ENV === 'production') {
    const frontendDist = resolve(__dirname, '../../dist');
    logger.info(`Serving frontend static files from: ${frontendDist}`);
    app.use(express.static(frontendDist));
}
// }

// Helper for audit logging
const logAction = async (
    req: any,
    action: string,
    resource: string,
    resourceId: string,
    changes: any = null,
    status: string = 'success'
) => {
    // Forward to centralized audit service
    await auditService.logRequest(req, action, resource, resourceId, changes);
};

const v1Router = express.Router();

// Apply Administrative & Security Middleware Globally to v1 (and audit logging if enabled)
v1Router.use(auditLoggingMiddleware as any);
v1Router.use(authenticateToken as any);
v1Router.use(maintenanceMiddleware as any);

// --- Public Routes (Auth optionally skipped inside middleware) ---
const publicRouter = express.Router();
publicRouter.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), authRoutes);
publicRouter.use('/auth', oauthRoutes); // OAuth routes (Google OAuth)
publicRouter.use('/email', emailRoutes); // Email verification routes
publicRouter.use('/invitations', invitationRoutes);
publicRouter.use('/client-portal', clientPortalRoutes);
publicRouter.use('/setup', setupRoutes);

v1Router.use(publicRouter);

// --- Profile & RBAC Routes (Auth Required, but not Tenant-Scoped) ---
const profileRouter = express.Router();
profileRouter.use(sessionIpLockMiddleware as any);
profileRouter.use(dynamicCspMiddleware as any);

profileRouter.get('/user/me', async (req: any, res: any, next: any) => {
    try {
        const userId = req.userId;
        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        // Fetch memberships from DB
        const memberships = await db.all(
            `
            SELECT m.*, c.name as companyName 
            FROM memberships m 
            JOIN companies c ON m.companyId = c.id 
            WHERE m.userId = ?
        `,
            [userId]
        );

        // RESILIENCE: If context reports SuperAdmin, prioritize that
        const isMetadataSuperAdmin = req.context?.role === 'SUPERADMIN' || req.context?.isSuperadmin;

        // Find primary membership or create virtual one for SuperAdmin
        let primaryMembership = memberships.find((m) => m.role === 'SUPERADMIN') || memberships[0];
        let finalRole = primaryMembership?.role || 'OPERATIVE';
        let finalCompanyId = primaryMembership?.companyId || 'c1';

        if (isMetadataSuperAdmin) {
            finalRole = 'SUPERADMIN';
            // Use 'platform-admin' or 'c1' as default company for system-level superadmins
            finalCompanyId = primaryMembership?.companyId || 'platform-admin';
        }

        if (!user && !isMetadataSuperAdmin) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: userId,
            name: user?.name || req.user?.user_metadata?.full_name || 'Super Admin',
            email: user?.email || req.user?.email,
            phone: user?.phone || '',
            role: finalRole,
            companyId: finalCompanyId,
            permissions: ['*'],
            memberships:
                memberships.length > 0
                    ? memberships.map((m) => ({
                        companyId: m.companyId,
                        companyName: m.companyName,
                        role: m.role
                    }))
                    : isMetadataSuperAdmin
                        ? [
                            {
                                companyId: 'platform-admin',
                                companyName: 'Platform Administration',
                                role: 'SUPERADMIN'
                            }
                        ]
                        : []
        });
    } catch (error) {
        next(error);
    }
});

profileRouter.get('/roles', rbacController.getRoles);
profileRouter.post('/roles', rbacController.createRole);
profileRouter.put('/roles/:id/permissions', rbacController.updateRolePermissions);
profileRouter.get('/user/permissions', authController.getCurrentUserPermissions);
profileRouter.get('/user-roles/:userId/:companyId', authController.getUserRoles);

// Mount authRoutes is already handled in publicRouter
// profileRouter.use(authRoutes);

v1Router.use(profileRouter);

// --- Protected Routes ---
const protectedRouter = express.Router();
protectedRouter.use(sessionIpLockMiddleware as any);
protectedRouter.use(dynamicCspMiddleware as any);
protectedRouter.use(contextMiddleware as any);
protectedRouter.use(tenantRoutingMiddleware as any);

// --- Construction Management Routes (Phase 4) ---
// Daily Logs (support both formats)
protectedRouter.get('/daily_logs', dailyLogController.getDailyLogs);
protectedRouter.get('/daily-logs', dailyLogController.getDailyLogs);
protectedRouter.post('/daily_logs', dailyLogController.createDailyLog);
protectedRouter.post('/daily-logs', dailyLogController.createDailyLog);
protectedRouter.put('/daily_logs/:id', dailyLogController.updateDailyLog);
protectedRouter.put('/daily-logs/:id', dailyLogController.updateDailyLog);
protectedRouter.delete('/daily_logs/:id', dailyLogController.deleteDailyLog);
protectedRouter.delete('/daily-logs/:id', dailyLogController.deleteDailyLog);

// RFIs
protectedRouter.get('/rfis', rfiController.getRFIs);
protectedRouter.post('/rfis', rfiController.createRFI);
protectedRouter.put('/rfis/:id', rfiController.updateRFI);
protectedRouter.delete('/rfis/:id', rfiController.deleteRFI);

// Safety Incidents (support both formats)
protectedRouter.get('/safety_incidents', requirePermission('safety', 'read'), safetyController.getSafetyIncidents);
protectedRouter.get('/safety', requirePermission('safety', 'read'), safetyController.getSafetyIncidents);
protectedRouter.post('/safety_incidents', requirePermission('safety', 'create'), safetyController.createSafetyIncident);
protectedRouter.post('/safety', requirePermission('safety', 'create'), safetyController.createSafetyIncident);
protectedRouter.put(
    '/safety_incidents/:id',
    requirePermission('safety', 'update'),
    safetyController.updateSafetyIncident
);
protectedRouter.put(
    '/safety/:id',
    requirePermission('safety', 'update'),
    safetyController.updateSafetyIncident
);
protectedRouter.delete(
    '/safety_incidents/:id',
    requirePermission('safety', 'delete'),
    safetyController.deleteSafetyIncident
);
protectedRouter.delete(
    '/safety/:id',
    requirePermission('safety', 'delete'),
    safetyController.deleteSafetyIncident
);

protectedRouter.get('/safety_hazards', safetyController.getSafetyHazards);
protectedRouter.post('/safety_hazards', requirePermission('safety', 'create'), safetyController.createSafetyHazard);
protectedRouter.put('/safety_hazards/:id', requirePermission('safety', 'update'), safetyController.updateSafetyHazard);

// --- Live Map & Location Tracking ---
protectedRouter.post('/location/update', liveMapController.updateLocation);
protectedRouter.get('/location/users', liveMapController.getUserLocations);
protectedRouter.get('/location/history/:userId', liveMapController.getLocationHistory);
protectedRouter.get('/location/alerts', liveMapController.getLocationAlerts);
protectedRouter.post('/location/alerts', liveMapController.createLocationAlert);
protectedRouter.get('/site-maps', liveMapController.getSiteMaps);
protectedRouter.post('/site-maps', liveMapController.createSiteMap);
protectedRouter.delete('/site-maps/:id', liveMapController.deleteSiteMap);
protectedRouter.post('/site-maps/analyze-drawing', liveMapController.analyzeDrawing);
protectedRouter.get('/site-maps/:mapId/zones', liveMapController.getMapZones);
protectedRouter.post('/site-maps/:mapId/zones', liveMapController.createMapZone);
protectedRouter.delete('/site-maps/:mapId/zones/:zoneId', liveMapController.deleteMapZone);

// --- Accounting & Finance Module ---
// General Ledger
protectedRouter.get('/accounting/gl-accounts', accountingController.getGLAccounts);
protectedRouter.post('/accounting/gl-accounts', accountingController.createGLAccount);
protectedRouter.put('/accounting/gl-accounts/:id', accountingController.updateGLAccount);
// Journal Entries
protectedRouter.get('/accounting/journal-entries', accountingController.getJournalEntries);
protectedRouter.post('/accounting/journal-entries', accountingController.createJournalEntry);
protectedRouter.get('/accounting/journal-entries/:id/lines', accountingController.getJournalEntryLines);
// Bank Accounts & Open Banking
protectedRouter.get('/accounting/bank-accounts', accountingController.getBankAccounts);
protectedRouter.post('/accounting/bank-accounts', accountingController.createBankAccount);
protectedRouter.post('/accounting/bank-accounts/:id/import', accountingController.importBankTransactions);
protectedRouter.get('/accounting/bank-transactions', accountingController.getBankTransactions);
protectedRouter.put('/accounting/bank-transactions/:id/reconcile', accountingController.reconcileBankTransaction);
// Payroll
protectedRouter.get('/accounting/payroll-runs', accountingController.getPayrollRuns);
protectedRouter.post('/accounting/payroll-runs', accountingController.createPayrollRun);
protectedRouter.get('/accounting/payroll-runs/:id/items', accountingController.getPayrollItems);
protectedRouter.post('/accounting/payroll-runs/:id/items', accountingController.addPayrollItem);
protectedRouter.put('/accounting/payroll-runs/:id/approve', accountingController.approvePayrollRun);
// Tax Compliance & HMRC
protectedRouter.get('/accounting/tax-returns', accountingController.getTaxReturns);
protectedRouter.post('/accounting/tax-returns/vat/calculate', accountingController.calculateVATReturn);
protectedRouter.put('/accounting/tax-returns/:id/submit', accountingController.submitTaxReturn);
// Integrations (Xero, QuickBooks)
protectedRouter.get('/accounting/integrations', accountingController.getIntegrations);
protectedRouter.post('/accounting/integrations', accountingController.createIntegration);
protectedRouter.delete('/accounting/integrations/:id', accountingController.deleteIntegration);
// Invoice Chasers
protectedRouter.get('/accounting/invoice-chasers', accountingController.getInvoiceChasers);
protectedRouter.post('/accounting/invoice-chasers/generate', accountingController.generateInvoiceChasers);
// Job Costing & Profitability
protectedRouter.get('/accounting/job-costing', accountingController.getJobCosting);
protectedRouter.get('/accounting/job-costing/:projectId/breakdown', accountingController.getJobCostingBreakdown);
// Bill-to-PO Matching
protectedRouter.post('/accounting/bill-po-match', accountingController.matchBillToPO);
protectedRouter.get('/accounting/po-billing-summary', accountingController.getPOBillingSummary);
// Receivables Aging
protectedRouter.get('/accounting/receivables-aging', accountingController.getReceivablesAging);
// Financial Alerts
protectedRouter.get('/accounting/financial-alerts', accountingController.getFinancialAlerts);
// Default GL Accounts
protectedRouter.post('/accounting/gl-accounts/seed-defaults', accountingController.seedDefaultGLAccounts);
// AI Auto-Categorization
protectedRouter.post('/accounting/bank-transactions/auto-categorize', accountingController.autoCategorizeTransactions);
// Budget Sync
protectedRouter.post('/accounting/sync-project-budgets', accountingController.syncProjectBudgets);

protectedRouter.get('/comments', commentController.getComments);
protectedRouter.post('/comments', apiLimiter as any, commentController.createComment);
protectedRouter.put('/comments/:id', commentController.updateComment);
protectedRouter.delete('/comments/:id', commentController.deleteComment);

protectedRouter.get('/activity', activityService.getActivityFeed);
protectedRouter.get('/activity/:entityType/:entityId', activityService.getEntityActivity);

protectedRouter.get('/search', searchController.searchAll);

// Notifications endpoint
// Notifications endpoint handled by notificationRoutes

protectedRouter.get('/integrations/:type', integrationController.getStatus);
protectedRouter.post('/integrations/connect', integrationController.connect);
protectedRouter.post('/integrations/sync', integrationController.sync);

protectedRouter.get('/predictive/:projectId', predictiveController.analyzeProjectDelays);

protectedRouter.get('/ml-models', mlController.getModels);
protectedRouter.post('/ml-models/:id/train', mlController.trainModel);
protectedRouter.get('/ml-predictions', mlController.getPredictions);
protectedRouter.post('/ml-predictions', mlController.createPrediction);

protectedRouter.post('/ocr/extract', ocrController.extractData);

protectedRouter.get('/vendors', getVendors);
protectedRouter.post('/vendors', requirePermission('settings', 'update'), createVendor);
protectedRouter.put('/vendors/:id', requirePermission('settings', 'update'), updateVendor);

// System Settings
protectedRouter.get('/system-settings', requirePermission('settings', 'read'), systemSettingsController.getSettings);
protectedRouter.put(
    '/system-settings',
    requirePermission('settings', 'update'),
    systemSettingsController.updateSetting
);

// --- Cost Codes (Legacy removed, use /financials/cost-codes) ---
// --- Invoices (Legacy removed, use /financials/invoices) ---

// --- Consolidated Route Mounting ---
protectedRouter.use('/analytics', analyticsRoutes);
protectedRouter.use('/tenants', tenantRoutes);
protectedRouter.use('/companies', companyRoutes);
protectedRouter.use('/projects', projectRoutes);
protectedRouter.use('/tasks', taskRoutes);
protectedRouter.use('/platform', platformRoutes);
protectedRouter.use('/support', supportRoutes);
protectedRouter.use('/notifications', notificationRoutes);
protectedRouter.use('/users', userManagementRoutes);
protectedRouter.use('/push', pushRoutes);
protectedRouter.use('/ai', aiRoutes);
protectedRouter.use('/provisioning', provisioningRoutes);
protectedRouter.use('/webhooks', webhookRoutes);
protectedRouter.use('/audit', auditRoutes);
protectedRouter.use('/compliance', complianceRoutes);
protectedRouter.use('/impersonation', impersonationRoutes);
protectedRouter.use('/modules', moduleRoutes);
protectedRouter.use('/dashboard', dashboardRoutes);
protectedRouter.use('/automations', automationRoutes);
protectedRouter.use('/platform-automation', platformAutomationRoutes);
protectedRouter.use('/database', databaseRoutes);
protectedRouter.use('/export', exportRoutes);
protectedRouter.use('/security', securityRoutes);
protectedRouter.use('/api-management', apiManagementRoutes);
protectedRouter.use('/storage', storageRoutes);
protectedRouter.use('/access', accessRoutes);
protectedRouter.use('/permissions', permissionRoutes);
protectedRouter.use('/data-management', dataManagementRoutes);
protectedRouter.use('/financials', financialRoutes);
protectedRouter.use('/plans', planRoutes);
protectedRouter.use('/construction', constructionRoutes);
protectedRouter.use('/status', statusRoutes);
protectedRouter.use('/hazards', hazardRoutes);
protectedRouter.use('/scheduling', schedulingRoutes);

// Add system routes to protected router before mounting
protectedRouter.use('/system', systemRoutes);

v1Router.use(protectedRouter);

// Mount the unified router
app.use(['/api/v1', '/api', '/v1'], v1Router);

// Signed document URL for secure access to local uploads
app.get(
    '/api/documents/:id/signed-url',
    authenticateToken,
    requirePermission('documents', 'read'),
    async (req: any, res: any) => {
        try {
            const { id } = req.params;
            const tenantId = req.context?.tenantId || req.tenantId;
            if (!tenantId) {
                return res.status(401).json({ error: 'Tenant context required' });
            }

            const db = getDb();
            const doc = await db.get('SELECT id, companyId, url, name FROM documents WHERE id = ? AND companyId = ?', [
                id,
                tenantId
            ]);
            if (!doc) {
                return res.status(404).json({ error: 'Document not found' });
            }

            const signingSecret = process.env.FILE_SIGNING_SECRET;
            if (!signingSecret || !doc.url || !doc.url.startsWith('/uploads/')) {
                return res.json({ url: doc.url });
            }

            const relativePath = doc.url.replace(/^\/uploads\//, '');
            const expiresAt = Date.now() + 3600 * 1000; // 1 hour default
            const payload = `${tenantId}:${relativePath}:${expiresAt}`;
            const signature = crypto.createHmac('sha256', signingSecret).update(payload).digest('hex');
            const signedUrl = `${doc.url}?expires=${expiresAt}&sig=${signature}`;

            return res.json({ url: signedUrl, expiresAt });
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
        }
    }
);

// --- Client Portal Routes ---
// --- Legacy Routes Removed - Use /api/v1/... ---

// --- Generic CRUD Helper ---
// Tenant-scoped tables that require companyId filtering
const TENANT_SCOPED_TABLES = [
    'team',
    'clients',
    'inventory',
    'equipment',
    'timesheets',
    'channels',
    'rfis',
    'punch_items',
    'daily_logs',
    'dayworks',
    'safety_incidents',
    'documents',
    'transactions',
    'purchase_orders',
    'invoices',
    'expense_claims',
    'audit_logs'
];

const createCrudRoutes = (tableName: string, jsonFields: string[] = [], permissionResource?: string) => {
    // Whitelist check for table names to prevent arbitrary table access
    const allowedTables = [
        'projects',
        'tasks',
        'team',
        'documents',
        'clients',
        'inventory',
        'punch_items',
        'dayworks',
        'equipment',
        'timesheets',
        'channels',
        'team_messages',
        'transactions',
        'purchase_orders',
        'defects',
        'project_risks',
        'expense_claims',
        'audit_logs'
    ];
    if (!allowedTables.includes(tableName) && tableName !== 'companies') {
        logger.error(`Attempted to create CRUD routes for unauthorized table: ${tableName}`);
        return;
    }

    // Helper to get middleware array (Authenticate + Context + Optional Permission)
    const getMiddleware = (action: 'read' | 'create' | 'update' | 'delete') => {
        const middlewares: any[] = [authenticateToken, contextMiddleware];
        if (permissionResource) {
            middlewares.push(requirePermission(permissionResource, action));
        }
        return middlewares;
    };

    v1Router.get(`/${tableName}`, ...getMiddleware('read'), async (req: any, res: any) => {
        try {
            const db = getDb();
            let sql = `SELECT * FROM ${tableName}`;
            const params: any[] = [];

            if (req.tenantId && TENANT_SCOPED_TABLES.includes(tableName)) {
                sql += ` WHERE companyId = ?`;
                params.push(req.tenantId);
            } else if (!req.tenantId && TENANT_SCOPED_TABLES.includes(tableName) && tableName !== 'companies') {
                logger.warn(`Accessing tenant table ${tableName} without companyId header!`);
                // In strict mode, we might return [] or error, but keeping legacy behavior for now
            }

            const items = await db.all(sql, params);
            const parsed = items.map((item: any) => {
                const newItem = { ...item };
                jsonFields.forEach((field) => {
                    if (newItem[field]) {
                        try {
                            newItem[field] = JSON.parse(newItem[field]);
                        } catch (e) {
                            logger.error(`Failed to parse JSON field ${field} in ${tableName}`, { error: e });
                        }
                    }
                });
                if (tableName === 'audit_logs') {
                    if (newItem.companyId && !newItem.tenantId) {
                        newItem.tenantId = newItem.companyId;
                    }
                    if (newItem.createdAt && !newItem.timestamp) {
                        newItem.timestamp = newItem.createdAt;
                    }
                    if (typeof newItem.changes === 'string') {
                        try {
                            newItem.changes = JSON.parse(newItem.changes);
                        } catch (e) {
                            logger.error(`Failed to parse changes field in ${tableName}`, { error: e });
                        }
                    }
                    if (typeof newItem.metadata === 'string') {
                        try {
                            newItem.metadata = JSON.parse(newItem.metadata);
                        } catch (e) {
                            logger.error(`Failed to parse metadata field in ${tableName}`, { error: e });
                        }
                    }
                }
                return newItem;
            });
            res.json(parsed);
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    v1Router.post(`/${tableName}`, ...getMiddleware('create'), async (req: any, res: any) => {
        try {
            const db = getDb();
            const item = req.body;
            const id = item.id || uuidv4();

            const keys = Object.keys(item).filter((k) => k !== 'id');
            const values = keys.map((k) => {
                if (jsonFields.includes(k)) return JSON.stringify(item[k]);
                return item[k];
            });

            if (req.tenantId && TENANT_SCOPED_TABLES.includes(tableName)) {
                if (!item.companyId) {
                    keys.push('companyId');
                    values.push(req.tenantId);
                }
            }

            const placeholders = values.map(() => '?').join(',');
            const columns = keys.join(',');

            await db.run(`INSERT INTO ${tableName} (id, ${columns}) VALUES (?, ${placeholders})`, [id, ...values]);

            await logAction(req, 'CREATE', tableName, id, item);

            // Broadcast real-time update
            if (req.tenantId) {
                realtimeService.notifyEntityChanged(req.tenantId, tableName, id, 'create', { ...item, id });
            }

            res.json({ ...item, id });
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    v1Router.put(`/${tableName}/:id`, ...getMiddleware('update'), async (req: any, res: any) => {
        try {
            const db = getDb();
            const { id } = req.params;
            const updates = req.body;

            const keys = Object.keys(updates).filter((k) => k !== 'id');
            const values = keys.map((k) => {
                if (jsonFields.includes(k)) return JSON.stringify(updates[k]);
                return updates[k];
            });

            const setClause = keys.map((k) => `${k} = ?`).join(',');
            let sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
            const params = [...values, id];

            if (req.tenantId && TENANT_SCOPED_TABLES.includes(tableName)) {
                sql += ` AND companyId = ?`;
                params.push(req.tenantId);
            }

            const result = await db.run(sql, params);
            if (result.changes === 0) {
                return res.status(403).json({ error: 'Unauthorized or resource not found' });
            }

            await logAction(req, 'UPDATE', tableName, id, updates);

            // Broadcast real-time update
            if (req.tenantId) {
                realtimeService.notifyEntityChanged(req.tenantId, tableName, id, 'update', updates);
            }

            res.json({ ...updates, id });
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    v1Router.delete(`/${tableName}/:id`, ...getMiddleware('delete'), async (req: any, res: any) => {
        try {
            const db = getDb();
            const { id } = req.params;

            let sql = `DELETE FROM ${tableName} WHERE id = ?`;
            const params = [id];

            if (req.tenantId && TENANT_SCOPED_TABLES.includes(tableName)) {
                sql += ` AND companyId = ?`;
                params.push(req.tenantId);
            }

            const result = await db.run(sql, params);
            if (result.changes === 0) {
                return res.status(403).json({ error: 'Unauthorized or resource not found' });
            }

            await logAction(req, 'DELETE', tableName, id);

            // Broadcast real-time update
            if (req.tenantId) {
                realtimeService.notifyEntityChanged(req.tenantId, tableName, id, 'delete');
            }

            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });
};

// [Routes moved up]

// --- Generic Resources ---

app.get('/api/roles/:id/permissions', rbacController.getRolePermissions);

// --- Generic Resources ---
// [REMOVED] createCrudRoutes for projects and tasks as they have dedicated controllers

// Register Routes for other entities (Secured with granular RBAC)
createCrudRoutes('team', ['skills', 'certifications'], 'team');
createCrudRoutes('documents', ['linkedTaskIds'], 'documents');
createCrudRoutes('clients', [], 'clients');
createCrudRoutes('inventory', [], 'inventory');
createCrudRoutes('punch_items', [], 'punch_items');
createCrudRoutes('dayworks', ['labor', 'materials', 'attachments'], 'dayworks');
createCrudRoutes('equipment', [], 'equipment');
createCrudRoutes('timesheets', [], 'timesheets');
createCrudRoutes('channels', [], 'channels');
createCrudRoutes('team_messages', [], 'team_messages');
createCrudRoutes('transactions', [], 'financials');
createCrudRoutes('purchase_orders', ['items', 'approvers'], 'procurement');
createCrudRoutes('defects', ['box_2d'], 'quality');
createCrudRoutes('project_risks', ['factors', 'recommendations'], 'risk');
createCrudRoutes('audit_logs', [], 'audit');
createCrudRoutes('expense_claims', ['receipts', 'items'], 'financials');

// Initialize and Start

logger.info('Creating HTTP Server...');
const httpServer = createServer(app);

// Setup WebSockets
try {
    logger.info('Setting up WebSockets...');
    setupWebSocketServer(httpServer, app);
    logger.info('WebSockets Setup Complete.');
} catch (e) {
    logger.error('WebSocket Setup Failed:', e);
}

// Setup GraphQL
const startApolloServer = async () => {
    try {
        const server = new ApolloServer({
            typeDefs,
            resolvers,
            context: ({ req }: any) => {
                // Use the context already populated by our middlewares
                return req.context || {};
            },
            introspection: process.env.NODE_ENV !== 'production',
            persistedQueries: false // Security: Disable unbounded persisted queries
        });
        await server.start();
        server.applyMiddleware({ app: app as any, path: '/api/graphql' });
        logger.info(`GraphQL server ready at /api/graphql`);
    } catch (error) {
        logger.error('Failed to start Apollo GraphQL server:', error);
        throw error;
    }
};

// Initialize GraphQL Server
(async () => {
    if (process.env.NODE_ENV !== 'test') {
        await startApolloServer();
    }
})();

// Start server immediately to satisfy Cloud Run health checks
const startServer = async () => {
    logger.info(`startServer() called. Port: ${port}`);

    // 1. Start Listening IMMEDIATELY to satisfy Cloud Run health checks
    if (process.env.NODE_ENV !== 'test') {
        try {
            // Listen strictly on 127.0.0.1 for Hostinger Proxy
            const server = httpServer.listen(port, () => {
                logger.info(`Backend server running at http://127.0.0.1:${port}`);
                logger.info(`WebSocket server ready at ws://127.0.0.1:${port}/live`);
            });

            // --- Graceful Shutdown Logic ---
            const gracefulShutdown = async (signal: string) => {
                logger.info(`${signal} received. Starting graceful shutdown...`);

                // 1. Stop accepting new connections
                server.close(() => {
                    logger.info('HTTP server closed.');
                });

                // 2. Close WebSocket server
                const { closeWebSocketServer } = await import('./socket.js');
                closeWebSocketServer();

                // 3. Clear intervals or other timers
                // (Intervals in socket.ts are cleared on wss 'close' event)

                // 4. Close database connections
                try {
                    const db = getDb();
                    await db.close();
                    logger.info('Database connections closed.');
                } catch (err) {
                    logger.error('Error closing database connections:', err);
                }

                // 5. Final exit
                logger.info('Graceful shutdown completed.');
                process.exit(0);
            };

            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));

            // Force exit if graceful shutdown takes too long (e.g., 20s)
            process.on('unhandledRejection', (reason, promise) => {
                logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            });

            process.on('uncaughtException', (error) => {
                logger.error('Uncaught Exception:', error);
                // In production, we might want to exit and let a process manager restart
                if (process.env.NODE_ENV === 'production') {
                    process.exit(1);
                }
            });
            logger.info('httpServer.listen called.');
        } catch (e) {
            logger.error('CRITICAL: httpServer.listen failed:', e);
            if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'testing') {
                process.exit(1);
            }
        }
    }

    // 2. Initialize DB in background
    try {
        logger.info('Starting DB initialization in background...');
        await ensureDbInitialized();
        const db = getDb();
        await db.get('SELECT 1');
        logger.info('DB Initialized. Seeding...');
        await seedDatabase();
        logger.info('DB Ready.');
    } catch (err) {
        logger.error('CRITICAL: DB Initialization failed:', err);
    }

    logger.info(`Reached end of startServer. Env VERCEL: ${process.env.VERCEL}`);
};

// --- Graceful Shutdown ---
const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    if (eventLoopMonitorTimer) {
        clearTimeout(eventLoopMonitorTimer);
    }

    httpServer.close(async () => {
        logger.info('HTTP server closed.');

        try {
            // Close Database connections
            await initializeDatabase(); // ensure it exists
            const db = getDb();
            await db.close();
            logger.info('Database connection closed.');

            logger.info('Graceful shutdown complete. Exiting.');
            if (process.env.NODE_ENV !== 'test') {
                process.exit(0);
            }
        } catch (err) {
            logger.error('Error during shutdown:', err);
            if (process.env.NODE_ENV !== 'test') {
                process.exit(1);
            }
        }
    });

    // Force shutdown after 10s
    if (process.env.NODE_ENV !== 'test') {
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    }
};

export const closeAll = async () => {
    if (eventLoopMonitorTimer) {
        clearTimeout(eventLoopMonitorTimer);
    }

    const { closeWebSocketServer } = await import('./socket.js');
    closeWebSocketServer();

    return new Promise<void>((resolve) => {
        httpServer.close(async () => {
            try {
                const db = getDb();
                await db.close();
                logger.info('Database connection closed in closeAll.');
            } catch (e) {
                // Ignore error if DB already closed
            }
            logger.info('HTTP server closed in closeAll.');
            resolve();
        });
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info(`Reached end of index.ts. Env VERCEL: ${process.env.VERCEL}`);

// Startup environment validation: fail fast if critical env vars are missing
(() => {
    const required = ['JWT_SECRET', 'FILE_SIGNING_SECRET'];
    const recommended = ['SENDGRID_API_KEY', 'GEMINI_API_KEY', 'STORAGE_ROOT'];
    
    const missing = required.filter((k) => !process.env[k]);
    const missingRecommended = recommended.filter((k) => !process.env[k]);
    
    if (missing.length > 0) {
        const errorMsg = `CRITICAL: Missing required environment variables: ${missing.join(', ')}. Server cannot start safely.`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    if (missingRecommended.length > 0) {
        logger.warn(
            `WARNING: Missing recommended environment variables: ${missingRecommended.join(', ')}. Some features may not work properly.`
        );
    }
})();

// Handle Uncaught Exceptions & Rejections
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'testing') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'testing') {
        process.exit(1);
    }
});

const serverPromise = process.env.NODE_ENV === 'test' ? Promise.resolve() : startServer();

// For testing purposes, we might want to wait for this promise
export { serverPromise };

// API 404 Handler - Catch all unknown API routes and return JSON
app.all(['/api/*', '/v1/*', '/api-management/*', '/platform/*', '/support/*', '/security/*', '/auth/*', '/tenants/*'], (req, res, next) => {
    const errorMsg = `API Route not found: ${req.method} ${req.originalUrl}`;

    // Log detailed diagnostics for API 404s
    logger.warn(`[API 404] ${req.method} ${req.originalUrl}`, {
        url: req.url,
        originalUrl: req.originalUrl,
        method: req.method,
        headers: {
            'x-tenant-id': req.headers['x-tenant-id'],
            'x-company-id': req.headers['x-company-id'],
            'authorization': req.headers['authorization'] ? 'Present (Hidden)' : 'Missing',
            'content-type': req.headers['content-type'],
            'x-request-id': req.headers['x-request-id']
        },
        query: req.query,
        ip: req.ip
    });

    next(new AppError(errorMsg, 404));
});


// Handle SPA routing for frontend in production - must be AFTER API routes
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        // When running in server/dist/index.js:
        // __dirname = .../server/dist
        // ../../   = .../ (root)
        // Root holds dist/index.html
        const frontendRoot = resolve(__dirname, '../../dist');
        res.sendFile(resolve(frontendRoot, 'index.html'));
    });
}

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;
