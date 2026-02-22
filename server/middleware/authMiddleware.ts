import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { normalizeRole, UserRole } from '../types/rbac.js';

const applyUserContext = (req: any, res: any, user: any) => {
    req.user = user;
    req.userId = user.id;

    const headerTenantId =
        (Array.isArray(req.headers['x-company-id']) ? req.headers['x-company-id'][0] : req.headers['x-company-id']) ||
        (Array.isArray(req.headers['x-tenant-id']) ? req.headers['x-tenant-id'][0] : req.headers['x-tenant-id']);
    const jwtTenantId = user.user_metadata?.companyId || user.user_metadata?.company_id || user.companyId;

    // Use originalUrl or path, but normalize to ensure segments are found
    const fullPath = req.originalUrl || req.path || '';
    const isPlatformRoute =
        fullPath.includes('/companies') ||
        fullPath.includes('/platform') ||
        fullPath.includes('/system-settings') ||
        fullPath.includes('/auth');

    const rawRole =
        user.user_metadata?.role || user.user_metadata?.user_role || user.app_metadata?.role || user.role || 'user';
    const normalizedRole = normalizeRole(rawRole);
    const isSuperAdmin = normalizedRole === UserRole.SUPERADMIN;
    const resolvedTenantId = isSuperAdmin && headerTenantId ? headerTenantId : jwtTenantId || headerTenantId;
    req.tenantId = resolvedTenantId;

    if (!req.tenantId && !isPlatformRoute && !isSuperAdmin) {
        logger.warn(`[Auth] No tenant context for user ${user.id} on path ${fullPath}`);
        return res.status(403).json({ error: 'Tenant context required' });
    }

    const currentIpAddress = req.ip || req.header('x-forwarded-for') || req.socket.remoteAddress;

    // Normalize role to match UserRole enum (super_admin, SuperAdmin -> SUPERADMIN)
    req.context = {
        userId: req.userId,
        tenantId: req.tenantId,
        role: normalizedRole,
        isSuperadmin: isSuperAdmin,
        ipAddress: currentIpAddress,
        sessionIp: currentIpAddress // Store initial IP for session tracking
    };

    return null;
};

export const authenticateToken = async (req: any, res: any, next: any) => {
    logger.info(`[AuthMiddleware] Processing request: ${req.method} ${req.originalUrl}`);

    // Helper to normalize path for matching public paths
    const normalizePath = (url: string) => {
        const pathOnly = url.split('?')[0];
        // Aggressively strip multiple /api or /v1 prefixes and trailing slashes
        // Example: /api/api/v1/health/ -> /health
        const strippedPath = pathOnly.replace(/^(\/api|\/v\d+)+/, '').replace(/\/$/, '');
        // Ensure it always starts with /api for consistency with the publicPaths list
        return '/api' + (strippedPath.startsWith('/') ? strippedPath : '/' + strippedPath);
    };

    const normalizedUrl = normalizePath(req.originalUrl || '');

    // List of public paths that don't require authentication (Normalized)
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/users/forgot-password',
        '/api/users/reset-password-confirm',
        '/api/invitations/accept',
        '/api/invitations/verify',
        '/api/health',
        '/api/v1/health',
        '/api/live',
        '/live'
    ];

    if (
        publicPaths.some((path) => normalizedUrl.startsWith(path)) ||
        normalizedUrl.includes('/api/client-portal/shared/')
    ) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Handle string "null" or "undefined" from frontend
    if (!token || token === 'null' || token === 'undefined' || token === 'null-token') token = undefined;

    // PRODUCTION SECURITY: No development backdoors allowed
    if (token === 'dev-token-placeholder') {
        logger.error('[Auth] Development token used - blocking for security');
        return res.status(401).json({
            error: 'Invalid authentication token',
            details: 'This authentication method is not supported.'
        });
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Check for Impersonation Token
    if (token.startsWith('imp_v1:')) {
        try {
            const secret = process.env.FILE_SIGNING_SECRET || process.env.JWT_SECRET || 'dev_secret';

            const parts = token.split(':');
            // Format: imp_v1:{userId}:{timestamp}:{signature}
            // token looks like: imp_v1:userId:timestamp:signature
            // But split might handle colons, userId shouldn't have colons (uuid)

            if (parts.length !== 4) throw new Error('Invalid token format');

            const [prefix, userId, timestamp, signature] = parts;
            const payload = `${prefix}:${userId}:${timestamp}`;

            // Verify HMAC
            const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

            if (signature !== expectedSignature) {
                return res.status(403).json({ error: 'Invalid impersonation token signature' });
            }

            // Check Database Session (Structured Impersonation)
            const { getDb } = await import('../database.js');
            const { impersonationService } = await import('../services/impersonationService.js');
            const db = getDb();

            const session = await impersonationService.getActiveSessionByToken(db, token);

            if (!session) {
                return res.status(401).json({ error: 'Impersonation session strictly required or expired' });
            }

            // Hydrate User Context
            req.userId = userId;
            req.user = {
                id: userId,
                email: 'impersonated@session',
                app_metadata: { provider: 'impersonation', adminId: session.adminId }
            };

            // Allow header override for tenant context in impersonation
            req.tenantId = req.headers['x-company-id'] || session.companyId;

            req.context = {
                userId: req.userId,
                tenantId: req.tenantId,
                role: 'impersonated',
                isSuperadmin: false,
                impersonatorId: session.adminId
            };

            return next();
        } catch (e) {
            logger.error('Impersonation Auth Failed:', e);
            return res.status(403).json({ error: 'Invalid impersonation token' });
        }
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_dev';
        const payload = jwt.verify(token, jwtSecret) as any;
        const user = {
            id: payload.userId || payload.sub,
            email: payload.email,
            user_metadata: {
                role: payload.role,
                companyId: payload.companyId,
                full_name: payload.name
            },
            app_metadata: payload.app_metadata || {},
            role: payload.role,
            companyId: payload.companyId
        };

        logger.info(`[Auth] JWT verified for user: ${user.email}, role: ${payload.role}`);
        const errorResponse = applyUserContext(req, res, user);
        if (errorResponse) return;
        return next();
    } catch (err: any) {
        logger.warn(`[Auth] JWT verification failed: ${err.message}`);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
