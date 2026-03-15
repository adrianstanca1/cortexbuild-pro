import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import * as crypto from 'crypto';
import { getDb } from '../database.js';

/**
 * Storage Validation Middleware
 * Ensures file access is scoped to the requesting user's tenant
 * Validates HMAC signatures on signed URLs
 * Prevents cross-tenant file access vulnerabilities
 */

/**
 * Verify signed upload URLs with tenant validation
 */
export const verifySignedUpload = async (req: any, res: Response, next: NextFunction) => {
    const signingSecret = process.env.FILE_SIGNING_SECRET;

    // If no signing secret configured, skip verification (dev mode only)
    if (!signingSecret) {
        if (process.env.NODE_ENV === 'production') {
            logger.error('[StorageValidation] FILE_SIGNING_SECRET not configured in production!');
            return res.status(500).json({ error: 'Storage configuration error' });
        }
        logger.warn('[StorageValidation] Skipping signature verification (dev mode)');
        return next();
    }

    const { expires, sig } = req.query;

    if (!expires || !sig) {
        return res.status(403).json({ error: 'Signed URL required' });
    }

    // Check expiration
    const expiresAt = Number(expires);
    if (!expiresAt || Date.now() > expiresAt) {
        return res.status(403).json({ error: 'Signed URL expired' });
    }

    // Extract tenant ID from path (assuming structure: /uploads/tenants/{tenantId}/...)
    const relativePath = req.path.replace(/^\/+/, '');
    const parts = relativePath.split('/');
    const tenantIdFromPath = parts.length >= 2 && parts[0] === 'tenants' ? parts[1] : null;

    if (!tenantIdFromPath) {
        logger.warn('[StorageValidation] Unable to extract tenant ID from path', { path: req.path });
        return res.status(403).json({ error: 'Invalid file path' });
    }

    // Verify HMAC signature
    const payload = `${tenantIdFromPath}:${relativePath}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', signingSecret).update(payload).digest('hex');

    if (expectedSig !== sig) {
        logger.warn('[StorageValidation] Invalid HMAC signature', {
            path: req.path,
            tenantId: tenantIdFromPath
        });
        return res.status(403).json({ error: 'Invalid signature' });
    }

    // Attach tenant ID for downstream validation
    req.fileTenantId = tenantIdFromPath;
    next();
};

/**
 * Validate tenant ownership of uploaded files
 * Must be used after authentication middleware
 */
export const validateTenantFileAccess = async (req: any, res: Response, next: NextFunction) => {
    try {
        const requestingTenantId = req.tenantId || req.context?.tenantId;
        const fileTenantId = req.fileTenantId;

        // SuperAdmin can access any tenant's files
        const isSuperAdmin = req.context?.role === 'SUPERADMIN' || req.context?.isSuperadmin;
        if (isSuperAdmin) {
            logger.info('[StorageValidation] SuperAdmin file access granted', {
                fileTenantId,
                requestingTenantId,
                path: req.path
            });
            return next();
        }

        // Standard users must match tenant
        if (!requestingTenantId) {
            logger.warn('[StorageValidation] No tenant context for file access', {
                userId: req.userId,
                path: req.path
            });
            return res.status(403).json({ error: 'Tenant context required' });
        }

        if (fileTenantId && fileTenantId !== requestingTenantId) {
            logger.warn('[StorageValidation] Cross-tenant file access attempt blocked', {
                requestingTenantId,
                fileTenantId,
                userId: req.userId,
                path: req.path
            });
            return res.status(403).json({ error: 'Access denied' });
        }

        next();
    } catch (error) {
        logger.error('[StorageValidation] File access validation error:', error);
        next(new AppError('Failed to validate file access', 500));
    }
};

/**
 * Validate document ownership before serving
 * Queries database to ensure document belongs to requesting tenant
 */
export const validateDocumentOwnership = async (req: any, res: Response, next: NextFunction) => {
    try {
        const documentId = req.params.id || req.params.documentId;
        const requestingTenantId = req.tenantId || req.context?.tenantId;

        if (!documentId) {
            return next(); // No document ID to validate
        }

        if (!requestingTenantId) {
            return res.status(403).json({ error: 'Tenant context required' });
        }

        const db = getDb();
        const document = await db.get(
            'SELECT id, companyId FROM documents WHERE id = ?',
            [documentId]
        );

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // SuperAdmin can access any document
        const isSuperAdmin = req.context?.role === 'SUPERADMIN' || req.context?.isSuperadmin;
        if (isSuperAdmin) {
            logger.info('[StorageValidation] SuperAdmin document access granted', {
                documentId,
                documentTenantId: document.companyId,
                requestingTenantId
            });
            return next();
        }

        // Validate tenant ownership
        if (document.companyId !== requestingTenantId) {
            logger.warn('[StorageValidation] Cross-tenant document access attempt blocked', {
                documentId,
                documentTenantId: document.companyId,
                requestingTenantId,
                userId: req.userId
            });
            return res.status(403).json({ error: 'Access denied' });
        }

        next();
    } catch (error) {
        logger.error('[StorageValidation] Document ownership validation error:', error);
        next(new AppError('Failed to validate document ownership', 500));
    }
};

/**
 * Generate signed URL helper
 */
export const generateSignedUrl = (tenantId: string, relativePath: string, expiresInMinutes: number = 60): string => {
    const signingSecret = process.env.FILE_SIGNING_SECRET;
    if (!signingSecret) {
        throw new Error('FILE_SIGNING_SECRET not configured');
    }

    const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000);
    const payload = `${tenantId}:${relativePath}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', signingSecret).update(payload).digest('hex');

    return `/uploads/${relativePath}?expires=${expiresAt}&sig=${signature}`;
};
