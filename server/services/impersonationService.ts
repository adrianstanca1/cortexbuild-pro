import { IDatabase, getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { auditService } from './auditService.js';

export interface ImpersonationSession {
    id: string;
    adminId: string;
    targetUserId: string;
    companyId: string;
    reason: string | null;
    token: string;
    status: 'active' | 'completed' | 'expired' | 'revoked';
    createdAt: string;
    expiresAt: string;
    completedAt?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export class ImpersonationService {
    /**
     * Create a new tracking record for an impersonation session
     */
    async createSession(db: IDatabase, data: {
        adminId: string;
        targetUserId: string;
        companyId: string;
        token: string;
        reason?: string;
        expiresAt: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<ImpersonationSession> {
        const id = uuidv4();
        const now = new Date().toISOString();

        const session: ImpersonationSession = {
            id,
            adminId: data.adminId,
            targetUserId: data.targetUserId,
            companyId: data.companyId,
            reason: data.reason || 'Support Session',
            token: data.token,
            status: 'active',
            createdAt: now,
            expiresAt: data.expiresAt,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null
        };

        await db.run(
            `INSERT INTO impersonation_sessions (
                id, adminId, targetUserId, companyId, reason, 
                token, status, createdAt, expiresAt, ipAddress, userAgent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                session.id,
                session.adminId,
                session.targetUserId,
                session.companyId,
                session.reason,
                session.token,
                session.status,
                session.createdAt,
                session.expiresAt,
                session.ipAddress,
                session.userAgent
            ]
        );

        // Audit the start of impersonation
        await auditService.log(db, {
            userId: data.adminId,
            companyId: data.companyId,
            action: 'START_IMPERSONATION',
            resource: 'user',
            resourceId: data.targetUserId,
            metadata: {
                reason: session.reason,
                sessionId: id,
                expiresAt: data.expiresAt
            }
        });

        logger.info(`Impersonation session created: ${id} (Admin: ${data.adminId}, Target: ${data.targetUserId})`);

        return session;
    }

    /**
     * Get an active session by its token
     */
    async getActiveSessionByToken(db: IDatabase, token: string): Promise<ImpersonationSession | null> {
        const session = await db.get(
            `SELECT * FROM impersonation_sessions WHERE token = ? AND status = 'active'`,
            [token]
        );

        if (!session) return null;

        // Check for manual expiry
        if (new Date(session.expiresAt) < new Date()) {
            await this.markExpired(db, session.id);
            return null;
        }

        return session as ImpersonationSession;
    }

    /**
     * End a session (clean exit)
     */
    async completeSession(db: IDatabase, token: string, adminId?: string): Promise<void> {
        const now = new Date().toISOString();
        const session = await db.get(`SELECT id, adminId, targetUserId, companyId FROM impersonation_sessions WHERE token = ?`, [token]);

        if (!session) return;

        await db.run(
            `UPDATE impersonation_sessions SET status = 'completed', completedAt = ? WHERE id = ?`,
            [now, session.id]
        );

        // Audit the end of impersonation
        await auditService.log(db, {
            userId: adminId || session.adminId,
            companyId: session.companyId,
            action: 'STOP_IMPERSONATION',
            resource: 'user',
            resourceId: session.targetUserId,
            metadata: { sessionId: session.id }
        });

        logger.info(`Impersonation session completed: ${session.id}`);
    }

    /**
     * Mark a session as expired
     */
    async markExpired(db: IDatabase, id: string): Promise<void> {
        await db.run(
            `UPDATE impersonation_sessions SET status = 'expired' WHERE id = ?`,
            [id]
        );
        logger.debug(`Impersonation session marked as expired: ${id}`);
    }

    /**
     * Revoke a specific session (force logout)
     */
    async revokeSession(db: IDatabase, id: string, revokerId: string): Promise<void> {
        await db.run(
            `UPDATE impersonation_sessions SET status = 'revoked' WHERE id = ?`,
            [id]
        );

        logger.warn(`Impersonation session REVOKED: ${id} by ${revokerId}`);
    }
}

export const impersonationService = new ImpersonationService();
