import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { BackupService } from '../services/backupService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Get database health metrics
 */
export const getDatabaseHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();

        // Get table sizes
        // Get table names cross-compatibly
        const dbType = db.getType();
        const tableQuery = dbType === 'mysql'
            ? "SELECT table_name as name FROM information_schema.tables WHERE table_schema = DATABASE()"
            : dbType === 'postgres'
                ? "SELECT tablename as name FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
                : "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";

        const tables = await db.all(tableQuery);

        const tableSizes = await Promise.all(
            tables.map(async (table: { name: string }) => {
                try {
                    const quoteChar = dbType === 'mysql' ? '`' : '"';
                    const count = await db.get(`SELECT COUNT(*) as count FROM ${quoteChar}${table.name}${quoteChar}`);
                    return {
                        name: table.name,
                        rowCount: count?.count || 0
                    };
                } catch (err) {
                    logger.warn(`Could not get row count for table ${table.name}:`, err);
                    return { name: table.name, rowCount: 0, error: true };
                }
            })
        );

        // Get database file size (SQLite specific)
        let dbSize = 0;
        try {
            const dbTypeEnv = process.env.DATABASE_TYPE || 'sqlite';
            if (dbTypeEnv === 'sqlite') {
                const dbPath = './cortexbuild.db';
                if (fs.existsSync(dbPath)) {
                    const stats = fs.statSync(dbPath);
                    dbSize = stats.size;
                }
            }
        } catch (e) {
            logger.warn('Could not get database file size:', e);
        }

        // Test query performance
        const start = Date.now();
        await db.get('SELECT 1');
        const queryLatency = Date.now() - start;

        res.json({
            status: 'healthy',
            tables: tableSizes,
            totalTables: tables.length,
            databaseSize: dbSize,
            databaseSizeMB: (dbSize / 1024 / 1024).toFixed(2),
            queryLatency: `${queryLatency}ms`,
            type: dbType,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        logger.error('Database health check failed:', e);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve database health metrics',
            error: (e as Error).message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Create database backup
 */
export const createDatabaseBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const backup = await BackupService.createBackup();
        logger.info(`Database backup created: ${backup.path}`);

        res.json({
            success: true,
            backup
        });
    } catch (e) {
        next(e);
    }
};

/**
 * List available backups
 */
export const listBackups = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const backups = BackupService.listBackups();
        res.json({ backups });
    } catch (e) {
        next(e);
    }
};

/**
 * Download a backup file
 */
export const downloadBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Expects filename as ID
        const filePath = BackupService.getBackupPath(id);
        res.download(filePath, id);
    } catch (e) {
        next(e);
    }
};

/**
 * Cleanup old data
 */
export const cleanupDatabase = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, daysToKeep = 90 } = req.body;
        const db = getDb();

        // Validate daysToKeep to prevent issues
        const safeDays = Math.min(Math.max(1, parseInt(String(daysToKeep)) || 90), 3650); // Max 10 years

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - safeDays);

        let result;

        switch (type) {
            case 'audit_logs':
                result = await db.run(
                    'DELETE FROM audit_logs WHERE createdAt < ?',
                    [cutoffDate.toISOString()]
                );
                break;
            case 'system_events':
                result = await db.run(
                    'DELETE FROM system_events WHERE createdAt < ? AND isRead = 1',
                    [cutoffDate.toISOString()]
                );
                break;
            case 'old_notifications':
                result = await db.run(
                    'DELETE FROM notifications WHERE createdAt < ?',
                    [cutoffDate.toISOString()]
                );
                break;
            default:
                return res.status(400).json({ error: 'Invalid cleanup type' });
        }

        logger.info(`Database cleanup: ${type}, deleted ${result.changes} rows`);

        res.json({
            success: true,
            type,
            deletedRows: result.changes || 0,
            cutoffDate: cutoffDate.toISOString()
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Get live system metrics
 */
export const getLiveMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();

        // Get active connections (simulated - would need WebSocket tracking)
        const activeConnections = 0; // Placeholder

        // Get recent error count
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const recentErrors = await db.get(`
            SELECT COUNT(*) as count 
            FROM audit_logs 
            WHERE (action LIKE '%error%' OR action LIKE '%failed%')
            AND createdAt > ?
        `, [oneHourAgo]);

        // System resource usage
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

        res.json({
            activeConnections,
            recentErrors: recentErrors?.count || 0,
            cpu: {
                usage: cpuUsage.toFixed(2),
                cores: os.cpus().length
            },
            memory: {
                usage: memoryUsage.toFixed(2),
                total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB'
            },
            uptime: os.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        next(e);
    }
};
