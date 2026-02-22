import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { SessionService } from '../services/sessionService.js';
import { auditService } from '../services/auditService.js';

/**
 * Session IP Lock Middleware
 */
export const sessionIpLockMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const setting = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['session_ip_lock']);

        if (!setting || setting.value !== 'true') return next();

        const authReq = req as any;
        if (authReq.user && authReq.user.id) {
            const currentIp = req.ip || req.header('x-forwarded-for') || req.socket.remoteAddress;
            const userId = authReq.user.id;

            const isValidSessionIp = await SessionService.validateSessionIp(userId, currentIp);

            if (!isValidSessionIp) {
                logger.warn(`IP MISMATCH for user ${userId}: Current=${currentIp}`);
                await SessionService.invalidateAllSessions(userId);

                return res.status(403).json({
                    error: 'Security Violation',
                    message: 'Session IP mismatch. Please log in again from your original network.',
                    code: 'IP_LOCK_VIOLATION'
                });
            }
        }

        next();
    } catch (error) {
        next();
    }
};

/**
 * Dynamic CSP Middleware
 */
export const dynamicCspMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const setting = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['strict_csp']);

        if (setting && setting.value === 'true') {
            res.setHeader(
                'Content-Security-Policy',
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:;"
            );
        }

        next();
    } catch (error) {
        next();
    }
};

/**
 * Audit Logging Middleware
 */
export const auditLoggingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const setting = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['audit_logging']);

        if (setting && setting.value === 'true') {
            // Log non-GET requests or important actions
            if (req.method !== 'GET') {
                await auditService.logRequest(req, `HTTP_${req.method}`, req.path, 'none', {
                    body: req.body,
                    query: req.query,
                    params: req.params
                });
            }
        }
        next();
    } catch (error) {
        next();
    }
};
