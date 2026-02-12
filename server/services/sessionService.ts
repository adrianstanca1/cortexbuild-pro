import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export interface UserSession {
    id: string;
    userId: string;
    ipAddress: string;
    userAgent?: string;
    createdAt: string;
    lastAccessAt: string;
    isActive: boolean;
}

export class SessionService {
    /**
     * Create or update user session with IP tracking
     */
    static async createOrUpdateSession(userId: string, ipAddress: string, userAgent?: string): Promise<void> {
        const db = getDb();
        const now = new Date().toISOString();

        try {
            // Check if active session exists for this user
            const existingSession = await db.get(
                'SELECT * FROM user_sessions WHERE userId = ? AND isActive = 1 ORDER BY lastAccessAt DESC LIMIT 1',
                [userId]
            );

            if (existingSession) {
                // Update existing session if IP hasn't changed
                if (existingSession.ipAddress === ipAddress) {
                    await db.run('UPDATE user_sessions SET lastAccessAt = ?, userAgent = ? WHERE id = ?', [
                        now,
                        userAgent,
                        existingSession.id
                    ]);
                } else {
                    // IP changed - invalidate old session and create new one
                    await db.run('UPDATE user_sessions SET isActive = 0 WHERE userId = ?', [userId]);
                    await this.createNewSession(userId, ipAddress, userAgent, now);
                }
            } else {
                // Create new session
                await this.createNewSession(userId, ipAddress, userAgent, now);
            }
        } catch (error) {
            logger.error('Session management error:', error);
            // Fail silently to not block authentication
        }
    }

    /**
     * Create a new session record
     */
    private static async createNewSession(
        userId: string,
        ipAddress: string,
        userAgent: string | undefined,
        now: string
    ): Promise<void> {
        const db = getDb();
        const sessionId = randomUUID();

        await db.run(
            `INSERT INTO user_sessions (id, userId, ipAddress, userAgent, createdAt, lastAccessAt, isActive)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [sessionId, userId, ipAddress, userAgent, now, now]
        );
    }

    /**
     * Get user's active session
     */
    static async getActiveSession(userId: string): Promise<UserSession | null> {
        const db = getDb();

        try {
            const session = await db.get(
                'SELECT * FROM user_sessions WHERE userId = ? AND isActive = 1 ORDER BY lastAccessAt DESC LIMIT 1',
                [userId]
            );

            return session || null;
        } catch (error) {
            logger.error('Error getting active session:', error);
            return null;
        }
    }

    /**
     * Validate session IP
     */
    static async validateSessionIp(userId: string, currentIp: string): Promise<boolean> {
        const session = await this.getActiveSession(userId);

        if (!session) {
            return true; // No session to validate
        }

        return session.ipAddress === currentIp;
    }

    /**
     * Invalidate all sessions for a user
     */
    static async invalidateAllSessions(userId: string): Promise<void> {
        const db = getDb();

        try {
            await db.run('UPDATE user_sessions SET isActive = 0 WHERE userId = ?', [userId]);
            logger.info(`All sessions invalidated for user ${userId}`);
        } catch (error) {
            logger.error('Error invalidating sessions:', error);
        }
    }

    /**
     * Cleanup old sessions
     */
    static async cleanupOldSessions(): Promise<void> {
        const db = getDb();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days old

        try {
            await db.run('DELETE FROM user_sessions WHERE lastAccessAt < ? OR isActive = 0', [
                cutoffDate.toISOString()
            ]);
            logger.info('Old sessions cleaned up');
        } catch (error) {
            logger.error('Error cleaning up old sessions:', error);
        }
    }
}
