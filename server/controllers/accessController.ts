import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';

export const getAccessLogs = async (req: any, res: Response, next: NextFunction) => {
    try {
        const context = req.context || {};
        const companyId = (req.query.companyId as string) || context.tenantId || context.companyId;

        if (!companyId) {
            throw new AppError('Company ID is required', 400);
        }

        if (context.tenantId && companyId !== context.tenantId && !context.isSuperadmin) {
            throw new AppError('Access denied', 403);
        }

        const limit = Math.min(200, parseInt(req.query.limit as string, 10) || 100);
        const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

        const db = getDb();
        const rows = await db.all(
            `SELECT * FROM access_logs WHERE companyId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
            [companyId, limit, offset]
        );

        const logs = rows.map((row: any) => ({
            id: row.id,
            user: row.userName || row.userId || row.user || 'Unknown',
            event: row.event,
            ip: row.ipAddress || row.ip || '',
            status: row.status || 'success',
            time: row.createdAt || row.time
        }));

        res.json(logs);
    } catch (error) {
        next(error);
    }
};

export const createAccessLog = async (req: any, res: Response, next: NextFunction) => {
    try {
        const context = req.context || {};
        const companyId = context.tenantId || req.body?.companyId;

        if (!companyId) {
            throw new AppError('Company ID is required', 400);
        }

        if (context.tenantId && companyId !== context.tenantId && !context.isSuperadmin) {
            throw new AppError('Access denied', 403);
        }

        const { id, user, event, ip, status, time } = req.body || {};
        if (!event) {
            throw new AppError('Event is required', 400);
        }

        const db = getDb();
        const now = new Date().toISOString();
        const logId = id ? String(id) : crypto.randomUUID();
        const userName = user || req.user?.user_metadata?.full_name || req.userName || req.userId || 'Unknown';

        await db.run(
            `INSERT INTO access_logs (id, companyId, userId, userName, event, ipAddress, status, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                logId,
                companyId,
                req.userId || null,
                userName,
                event,
                ip || req.ip,
                status || 'success',
                time || now
            ]
        );

        res.status(201).json({ success: true, id: logId });
    } catch (error) {
        next(error);
    }
};
