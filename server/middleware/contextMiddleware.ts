import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { TenantService } from '../services/tenantService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { getDb } from '../database.js';
import { createTenantSafeDb } from '../utils/tenantSafeDb.js';
import { permissionService } from '../services/permissionService.js';

/**
 * contextMiddleware
 * Populates req.context with full TenantContext (tenantId, userId, role, permissions)
 * AND attaches req.tenantDb (tenant-safe database wrapper)
 * This becomes the single source of truth for all downstream logic
 */
export const contextMiddleware = async (req: any, res: Response, next: NextFunction) => {
    // List of public paths that don't require context/auth
    const publicPaths = [
        '/api/auth/login',
        '/api/v1/auth/login',
        '/v1/auth/login',
        '/api/auth/register',
        '/api/v1/auth/register',
        '/v1/auth/register',
        '/api/users/forgot-password',
        '/api/v1/users/forgot-password',
        '/api/users/reset-password-confirm',
        '/api/v1/users/reset-password-confirm',
        '/api/invitations/accept',
        '/api/v1/invitations/accept',
        '/api/invitations/verify',
        '/api/v1/invitations/verify',
        '/api/health',
        '/api/v1/health',
        '/v1/health',
        '/api/live',
        '/live'
    ];

    if (
        publicPaths.some((path) => req.originalUrl?.startsWith(path)) ||
        req.originalUrl?.includes('/api/client-portal/shared/')
    ) {
        return next();
    }

    logger.info(`[ContextMiddleware] Processing request for user: ${req.userId}`);

    try {
        let tenantId = req.tenantId;
        const userId = req.userId;
        const rawRole =
            req.user?.user_metadata?.role ||
            req.user?.user_metadata?.user_role ||
            req.user?.app_metadata?.role ||
            req.user?.role;
        const normalizedRole = rawRole ? rawRole.toString().trim().toUpperCase().replace(/_/, '') : '';
        const isSuperAdmin = normalizedRole === 'SUPERADMIN';

        if (!tenantId && isSuperAdmin) {
            // SUPERADMIN should use their company context from JWT, not a fake 'platform-admin'
            tenantId = req.user?.payload?.companyId || req.companyId || 'c1';
            req.tenantId = tenantId;
        }

        if ((!tenantId && !isSuperAdmin) || !userId || userId === 'anonymous' || userId === 'demo-user') {
            // STRICT MODE: Only allow implicit demo context in development
            // Check environment (default to development if missing/undefined in local)
            const isDev =
                process.env.NODE_ENV === 'development' ||
                !process.env.NODE_ENV ||
                process.env.ENABLE_DEMO_AUTH === 'true';

            if (isDev) {
                req.context = {
                    tenantId: tenantId || 'c1',
                    userId: userId || 'demo-user',
                    role: isSuperAdmin ? 'SUPERADMIN' : 'OPERATIVE',
                    permissions: ['*'],
                    isSuperadmin: isSuperAdmin
                };

                // Attach tenant-safe database even in dev mode
                const db = getDb();
                req.tenantDb = createTenantSafeDb(db, req.context.tenantId, req.context.userId);

                return next();
            }

            // In production, incomplete context is a 403
            return res.status(403).json({ error: 'Valid security context required' });
        }

        // Attach tenant-safe database wrapper to request
        const db = getDb();
        req.tenantDb = createTenantSafeDb(db, tenantId, userId);

        // Get user permissions from RBAC system
        let permissions: string[] = [];
        try {
            // Import normalizeRole from rbac types to properly validate the role
            const { normalizeRole } = await import('../types/rbac.js');
            const validatedRole = normalizeRole(normalizedRole);
            
            // Get role-based permissions
            const rolePermissions = await permissionService.getRolePermissions(validatedRole);
            
            // Get optional user-specific permissions
            const userPermissions = await permissionService.getUserPermissions(userId, tenantId);
            
            // Combine both sets of permissions
            permissions = [...new Set([...rolePermissions, ...userPermissions])];
        } catch (error) {
            logger.warn(`[ContextMiddleware] Failed to fetch permissions for user ${userId}: ${error}`);
            // Fallback to role-based permissions only
            permissions = isSuperAdmin ? ['*'] : [];
        }

        // Attach context for compatibility
        req.context = {
            tenantId,
            userId,
            role: normalizedRole,
            permissions,
            isSuperadmin: isSuperAdmin
        };

        logger.debug(`[ContextMiddleware] Tenant-safe DB attached for tenant: ${tenantId}`);

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error('Failed to populate tenant context:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
