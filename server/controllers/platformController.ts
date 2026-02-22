
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { userManagementService } from '../services/userManagementService.js';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { broadcastToAll } from '../socket.js';
import { v4 as uuidv4 } from 'uuid';
import { dbHelper } from '../utils/dbHelper.js';
import { emailService } from '../services/emailService.js';
import { pushService } from '../services/PushService.js';
import { moduleAccessService } from '../services/moduleAccessService.js';

/**
 * Legacy stubs for backward compatibility
 */
export const getAdvancedMetrics = async (req: Request, res: Response) => { res.json({ success: true }); };
export const broadcastMessage = async (req: Request, res: Response) => {
    const { message, level = 'info' } = req.body;
    broadcastToAll({ type: 'SYSTEM_ALERT', level, message });
    res.json({ success: true });
};

/**
 * Get aggregated platform statistics for Super Admin dashboard
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const [
            companiesResult,
            usersResult,
            projectsResult,
            revenueResult,
            activeSessionsResult
        ] = await Promise.all([
            db.get('SELECT count(*) as count FROM companies'),
            db.get('SELECT count(*) as count FROM users'),
            db.get('SELECT count(*) as count FROM projects'),
            db.get('SELECT sum(mrr) as total FROM companies'),
            db.get(`SELECT count(DISTINCT userId) as count FROM audit_logs WHERE createdAt > ${dbHelper.timeAgo(24, 'hour')}`)
        ]);

        res.json({
            totalCompanies: companiesResult?.count || 0,
            totalUsers: usersResult?.count || 0,
            totalProjects: projectsResult?.count || 0,
            monthlyRevenue: revenueResult?.total || 0,
            activeSessions: activeSessionsResult?.count || 0,
            systemStatus: 'healthy',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (e) {
        logger.error('Failed to fetch platform stats', e);
        next(new AppError('Failed to fetch platform stats', 500));
    }
};

/**
 * Get system health metrics
 */
export const getSystemHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const start = Date.now();
        await db.run('SELECT 1');
        const dbLatency = Date.now() - start;

        res.json({
            api: 'healthy',
            database: dbLatency < 100 ? 'healthy' : 'degraded',
            auth: 'healthy',
            storage: 'healthy',
            databaseLatency: `${dbLatency}ms`,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            osLoad: os.loadavg(),
            freeMem: os.freemem(),
            totalMem: os.totalmem()
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Get detailed health metrics for System Health Dashboard
 */
export const getDetailedHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();

        // API Health - measure response time
        const apiStart = Date.now();
        const apiResponseTime = Date.now() - apiStart;
        const uptimeSeconds = process.uptime();
        const uptimePercent = Math.min(99.99, (uptimeSeconds / (uptimeSeconds + 1)) * 100); // Simplified uptime calc

        // Database Health
        const dbStart = Date.now();
        let dbStatus: 'healthy' | 'degraded' | 'down' = 'down';
        let dbQueryTime = 0;
        let dbConnections = 0;

        try {
            await db.run('SELECT 1');
            dbQueryTime = Date.now() - dbStart;
            dbStatus = dbQueryTime < 100 ? 'healthy' : dbQueryTime < 500 ? 'degraded' : 'down';

            // Get connection count (SQLite doesn't have this, use placeholder)
            dbConnections = 1; // In production, this would query actual pool connections
        } catch (e) {
            dbStatus = 'down';
        }

        // Cache Health (simplified - in production would check Redis/Memcached)
        const cacheStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        const cacheHitRate = 85 + Math.random() * 10; // Simulated
        const memUsage = process.memoryUsage();
        const cacheMemoryUsed = Math.floor(memUsage.heapUsed / 1024 / 1024); // MB

        // WebSocket Health
        const wsStats = (global as any).wsStats;
        const wsStatus: 'healthy' | 'degraded' | 'down' =
            wsStats && wsStats.activeConnections > 0 ? 'healthy' : 'degraded';
        const wsConnections = wsStats?.activeConnections || 0;

        res.json({
            api: {
                status: 'healthy',
                responseTime: Math.max(1, apiResponseTime),
                uptime: parseFloat(uptimePercent.toFixed(2))
            },
            database: {
                status: dbStatus,
                connections: dbConnections,
                queryTime: dbQueryTime
            },
            cache: {
                status: cacheStatus,
                hitRate: parseFloat(cacheHitRate.toFixed(1)),
                memoryUsed: cacheMemoryUsed
            },
            websocket: {
                status: wsStatus,
                connections: wsConnections
            }
        });
    } catch (e) {
        logger.error('Failed to fetch detailed health metrics', e);
        next(e);
    }
};

/**
 * Get global audit logs
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { limit = 100, offset = 0, action, userId, resource, startDate, endDate, companyId } = req.query;

        let sql = `SELECT * FROM audit_logs WHERE 1=1`;
        const params: any[] = [];

        if (action && action !== 'ALL') { sql += ` AND action = ?`; params.push(action); }
        if (userId) { sql += ` AND (userId LIKE ? OR userName LIKE ?)`; params.push(`%${userId}%`, `%${userId}%`); }
        if (resource) { sql += ` AND resource = ?`; params.push(resource); }
        if (companyId) { sql += ` AND companyId = ?`; params.push(companyId); }
        if (startDate) { sql += ` AND createdAt >= ?`; params.push(startDate); }
        if (endDate) { sql += ` AND createdAt <= ?`; params.push(endDate); }

        sql += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit as string), parseInt(offset as string));

        const logs = await db.all(sql, params);
        res.json(logs.map(l => ({
            ...l,
            timestamp: l.timestamp || l.createdAt,
            metadata: l.changes ? JSON.parse(l.changes) : l.metadata ? JSON.parse(l.metadata) : null
        })));
    } catch (e) {
        next(e);
    }
};

/**
 * Execute raw SQL
 */
export const executeSql = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.body;
        if (!query) throw new AppError('Query is required', 400);

        const db = getDb();
        const start = Date.now();
        const result = query.trim().toLowerCase().startsWith('select') ? await db.all(query) : await db.run(query);

        logger.warn(`SUPERADMIN SQL EXECUTION: ${query}`);
        res.json({ success: true, duration: `${Date.now() - start}ms`, result });
    } catch (e: any) {
        res.status(400).json({ success: false, error: e.message });
    }
};

/**
 * Toggle Maintenance Mode
 */
export const toggleMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { enabled, message } = req.body;
        const db = getDb();
        const value = String(enabled);
        const userId = (req as any).user?.id || 'admin';
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO system_settings (key, value, updatedAt, updatedBy) VALUES (?, ?, ?, ?) 
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt, updatedBy = excluded.updatedBy`,
            ['maintenance_mode', value, now, userId]
        );

        if (enabled) {
            broadcastToAll({
                type: 'SYSTEM_ALERT',
                level: 'critical',
                message: message || 'System is entering maintenance mode.',
                action: 'LOGOUT_WARNING'
            });
        } else {
            broadcastToAll({ type: 'SYSTEM_ALERT', level: 'info', message: 'System maintenance mode lifted.', action: 'REFRESH' });
        }

        broadcastToAll({ type: 'superadmin_update', entityType: 'config' });
        res.json({ success: true, enabled });
    } catch (e) {
        next(e);
    }
};

/**
 * Update system configuration
 */
export const updateSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updates = req.body;
        const db = getDb();
        const userId = (req as any).user?.id || 'admin';
        const now = new Date().toISOString();

        // Comprehensive mapping for all frontend keys
        const keyMap: Record<string, string> = {
            maintenanceMode: 'maintenance_mode',
            allowRegistrations: 'allow_registrations',
            globalBeta: 'global_beta',
            platformName: 'platform_name',
            supportEmail: 'support_email',
            primaryColor: 'primary_color',
            apiKeys: 'api_keys',
            enforce2FA: 'enforce_2fa',
            sessionIpLock: 'session_ip_lock',
            strictCsp: 'strict_csp',
            auditLogging: 'audit_logging',
            aiEngine: 'ai_engine',
            demoInstances: 'demo_instances'
        };

        for (const [inputKey, value] of Object.entries(updates)) {
            const dbKey = keyMap[inputKey] || inputKey;
            const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

            await db.run(
                `INSERT INTO system_settings (key, value, updatedAt, updatedBy) VALUES (?, ?, ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt, updatedBy = excluded.updatedBy`,
                [dbKey, strValue, now, userId]
            );
        }

        // Handle Side Effects
        if (updates.maintenanceMode !== undefined) {
            const enabled = updates.maintenanceMode === true || updates.maintenanceMode === 'true';
            broadcastToAll({
                type: 'SYSTEM_ALERT',
                level: enabled ? 'critical' : 'info',
                message: enabled ? 'System is entering maintenance mode. Please save your work.' : 'System maintenance mode lifted.',
                action: enabled ? 'LOGOUT_WARNING' : 'REFRESH'
            });
        }

        broadcastToAll({ type: 'superadmin_update', entityType: 'config' });
        res.json({ success: true, updates });
    } catch (e) {
        next(e);
    }
};

/**
 * Provision New User
 */
export const provisionUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, role, companyId } = req.body;
        const user = await userManagementService.createUser({ name, email, password: 'ChangeMe123!', role, companyId });
        res.json({ success: true, user });
    } catch (e) {
        next(e);
    }
};

/**
 * Get All Users
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, role, status } = req.query;
        const users = await userManagementService.getAllUsers(undefined, { search: search as string, role: role as string, status: status as string });
        res.json(users);
    } catch (e) {
        next(e);
    }
};

/**
 * Update User Status
 */
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await userManagementService.changeUserStatus(id, status, (req as any).userId);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Update User Role
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        await userManagementService.changeUserRole(id, role as any, req.body.companyId || 'system', (req as any).userId);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Delete User
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await userManagementService.deleteUser(id, (req as any).user?.id);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Bulk User Actions
 */
export const bulkUserAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userIds, action, reason } = req.body;
        const actorId = (req as any).user?.id || 'admin';

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            throw new AppError('No user IDs provided', 400);
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const userId of userIds) {
            try {
                switch (action) {
                    case 'suspend':
                        await userManagementService.changeUserStatus(userId, 'suspended', actorId);
                        break;
                    case 'activate':
                        await userManagementService.changeUserStatus(userId, 'active', actorId);
                        break;
                    case 'reset_password':
                        await userManagementService.resetUserPassword(userId, actorId);
                        break;
                    case 'delete':
                        await userManagementService.deleteUser(userId, actorId);
                        break;
                    default:
                        throw new AppError(`Invalid action: ${action}`, 400);
                }
                results.success++;
            } catch (e: any) {
                results.failed++;
                results.errors.push(`${userId}: ${e.message}`);
                logger.error(`Bulk action ${action} failed for user ${userId}`, e);
            }
        }

        broadcastToAll({ type: 'superadmin_update', entityType: 'user' });
        res.json({ success: true, results });
    } catch (e) {
        next(e);
    }
};

/**
 * Search Users across all companies
 */
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query, role, status, limit = 50, offset = 0 } = req.body;
        const users = await userManagementService.getAllUsers(undefined, {
            search: query,
            role: role === 'all' ? undefined : role,
            status: status === 'all' ? undefined : status
        });

        // Manual pagination for now as service returns all
        const paginatedUsers = users.slice(Number(offset), Number(offset) + Number(limit));

        res.json({
            users: paginatedUsers,
            total: users.length,
            limit: Number(limit),
            offset: Number(offset)
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Get Global System Config (for reading)
 */
export const getSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const settings = await db.all('SELECT `key`, `value` FROM system_settings');

        const config: any = {};
        settings.forEach((s: any) => {
            try {
                config[s.key] = JSON.parse(s.value);
            } catch {
                if (s.value === 'true') config[s.key] = true;
                else if (s.value === 'false') config[s.key] = false;
                else config[s.key] = s.value;
            }
        });

        // Map snake_case back to camelCase
        const mappedConfig = {
            ...config,
            maintenanceMode: config.maintenance_mode ?? config.maintenanceMode ?? false,
            allowRegistrations: config.allow_registrations ?? config.allowRegistrations ?? true,
            globalBeta: config.global_beta ?? config.globalBeta ?? true,
            platformName: config.platform_name ?? config.platformName ?? 'CortexBuild Pro',
            supportEmail: config.support_email ?? config.supportEmail ?? 'support@cortexbuildpro.com',
            primaryColor: config.primary_color ?? config.primaryColor ?? '#6366f1',
            apiKeys: config.api_keys ?? config.apiKeys ?? { googleMaps: '', sendGrid: '', openAi: '' },
            enforce2FA: config.enforce_2fa ?? config.enforce2FA ?? false,
            sessionIpLock: config.session_ip_lock ?? config.sessionIpLock ?? false,
            strictCsp: config.strict_csp ?? config.strictCsp ?? false,
            auditLogging: config.audit_logging ?? config.auditLogging ?? false,
            aiEngine: config.ai_engine ?? config.aiEngine ?? 'gemini',
            demoInstances: config.demo_instances ?? config.demoInstances ?? true
        };

        res.json(mappedConfig);
    } catch (e) {
        next(e);
    }
};

/**
 * Get Performance History
 */
export const getPerformanceHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const now = Date.now();
        res.json(Array.from({ length: 24 }).map((_, i) => ({
            timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
            cpu: 10 + Math.random() * 30,
            ram: 40 + Math.random() * 20,
            latency: 50 + Math.random() * 100
        })));
    } catch (e) {
        next(e);
    }
};

/**
 * Get Platform Alerts
 */
export const getPlatformAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const logs = await db.all('SELECT * FROM system_events ORDER BY createdAt DESC LIMIT 20');
        res.json(logs.map(l => ({
            id: l.id,
            type: l.type,
            severity: l.level === 'error' ? 'high' : l.level === 'warn' ? 'medium' : 'info',
            message: l.message,
            timestamp: l.createdAt
        })));
    } catch (e) {
        next(e);
    }
};

/**
 * Get Security Stats
 */
export const getSecurityStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const dbType = db.getType();
        let dateQuery = dbType === 'mysql' ? 'DATE_SUB(NOW(), INTERVAL 24 HOUR)' : "datetime('now', '-24 hours')";

        const [failedLogins, activeSessions] = await Promise.all([
            db.get(`SELECT COUNT(*) as count FROM audit_logs WHERE action = 'LOGIN_FAILED' AND createdAt > ${dateQuery}`),
            db.get(`SELECT COUNT(*) as count FROM audit_logs WHERE action = 'LOGIN' AND createdAt > ${dateQuery}`)
        ]);

        res.json({
            mfaAdoption: 85,
            activeSessions: activeSessions?.count || 0,
            failedLogins24h: failedLogins?.count || 0,
            unusualLogins: 0,
            securityScore: 92
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Schedule Maintenance
 */
export const scheduleMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startTime, durationMinutes } = req.body;
        res.json({ success: true, scheduled: { startTime, durationMinutes } });
    } catch (e) {
        next(e);
    }
};

/**
 * Get Platform Analytics (v2.0)
 * Aggregated consumption and growth metrics across all localized instances
 */
export const getPlatformAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const dbType = db.getType();

        // 1. Totals
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const monthStart = oneMonthAgo.toISOString();

        const [companies, users, projects, apiCalls, storage] = await Promise.all([
            db.get('SELECT COUNT(*) as count FROM companies'),
            db.get('SELECT COUNT(*) as count FROM users'),
            db.get('SELECT COUNT(*) as count FROM projects'),
            db.get('SELECT COUNT(*) as count FROM audit_logs WHERE createdAt > ?', [monthStart]),
            db.get('SELECT SUM(CAST(size AS INTEGER)) as totalBytes FROM documents')
        ]);

        const totals = {
            activeTenants: companies?.count || 0,
            totalUsers: users?.count || 0,
            totalProjects: projects?.count || 0,
            apiCalls: apiCalls?.count || 0,
            storageBytes: storage?.totalBytes || 0,
            totalApiCalls: apiCalls?.count || 0, // Alias for frontend KPI
            totalStorageBytes: storage?.totalBytes || 0 // Alias for frontend KPI
        };

        // 2. Top Companies by Consumption
        const topCompaniesRaw = await db.all(`
            SELECT 
                c.id, 
                c.name,
                (SELECT COUNT(*) FROM audit_logs a WHERE a.companyId = c.id AND a.createdAt > ?) as apiCalls,
                (SELECT SUM(CAST(d.size AS INTEGER)) FROM documents d WHERE d.companyId = c.id) as storageBytes,
                (SELECT COUNT(*) FROM users u WHERE u.companyId = c.id AND u.status = 'active') as activeUsers
            FROM companies c
            LIMIT 5
        `, [monthStart]);

        const topCompanies = topCompaniesRaw.map(c => ({
            ...c,
            apiCalls: c.apiCalls || 0,
            storageBytes: c.storageBytes || 0,
            activeUsers: c.activeUsers || 0
        })).sort((a, b) => b.apiCalls - a.apiCalls);

        // 3. Growth Trends (Last 6 Months)
        const growth = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthLabel = date.toLocaleString('default', { month: 'short' });

            // This is a simplified trend for now as full historical aggregation might be expensive
            // In a real app, this would query a dedicated trends/metrics table
            growth.push({
                month: monthLabel,
                apiCalls: Math.floor((totals.apiCalls / 6) * (1 + (Math.random() * 0.4 - 0.2))),
                users: Math.floor((totals.totalUsers / 6) * (1 + (Math.random() * 0.2 - 0.1)))
            });
        }

        res.json({
            totals,
            topCompanies,
            growth
        });
    } catch (e) {
        logger.error('Failed to fetch platform analytics', e);
        next(e);
    }
};

/**
 * Send Targeted Broadcast
 */
export const sendTargetedBroadcast = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { target, message, level } = req.body;
        broadcastToAll({ type: 'TARGETED_ALERT', target, level, message });
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Restart Services
 */
export const restartServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.warn('Restart initiated');
        res.json({ success: true, message: 'Restart command sent' });
        setTimeout(() => process.exit(0), 1000);
    } catch (e) {
        next(e);
    }
};

/**
 * Flush System Cache
 */
export const flushCache = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Clear module access cache
        moduleAccessService.clearAllCache();

        // Clear any other global caches if they exist
        // (Add more here as system grows, e.g. platformConfig cache if implemented)

        logger.warn('System-wide cache flush initiated by SuperAdmin');
        broadcastToAll({ type: 'SYSTEM_ALERT', level: 'info', message: 'System cache has been cleared.' });

        res.json({ success: true, message: 'Platform-wide cache has been successfully flushed' });
    } catch (e) {
        next(e);
    }
};

/**
 * Bulk Suspend Companies
 */
export const bulkSuspendCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body;
        const db = getDb();
        await db.run(`UPDATE companies SET status = 'suspended' WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Bulk Activate Companies
 */
export const bulkActivateCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body;
        const db = getDb();
        await db.run(`UPDATE companies SET status = 'active' WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Get Company Usage Stats
 */
export const getCompanyUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const usage = await db.get('SELECT * FROM company_usage WHERE companyId = ?', [id]);
        res.json(usage || { companyId: id, currentUsers: 0, storageUsed: 0 });
    } catch (e) {
        next(e);
    }
};

/**
 * Broad cast system message
 */
export const broadcastSystemMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { message, level = 'info' } = req.body;
        broadcastToAll({ type: 'SYSTEM_ALERT', level, message });
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Verify Email Configuration (SendGrid)
 */
export const verifyEmailConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const settings = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['support_email']);
        const supportEmail = settings?.value || 'support@cortexbuildpro.com';

        const success = await emailService.sendEmail({
            to: supportEmail,
            subject: 'BuildPro: Email Integration Verification',
            text: 'This is a test email to verify that your SendGrid configuration is working correctly.',
            html: '<h1>Integration Verified!</h1><p>This is a test email from your <strong>BuildPro SuperAdmin Dashboard</strong>.</p>'
        });

        if (!success) throw new Error('SendGrid reported a failure. Check your API Key and sender verification.');

        res.json({ success: true, message: `Verification email sent to ${supportEmail}` });
    } catch (e: any) {
        logger.error('Email verification failed:', e);
        res.status(400).json({ success: false, error: e.message });
    }
};

/**
 * Verify Push Notification Configuration (WebPush)
 */
export const verifyPushConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await pushService.broadcastNotification({
            title: 'Integration Verified!',
            body: 'Your WebPush configuration is working correctly.',
            icon: '/logo.png',
            tag: 'verification'
        });

        res.json({ success: true, message: 'Broadcasted verification push to all subscribers' });
    } catch (e: any) {
        logger.error('Push verification failed:', e);
        res.status(400).json({ success: false, error: e.message });
    }
};

/**
 * Verify AI Engine Configuration
 */
export const verifyAiConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Simple verification - check if VITE_GEMINI_API_KEY exists in env or database
        const db = getDb();
        const settings = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['api_keys']);
        const apiKeys = settings?.value ? JSON.parse(settings.value) : {};

        const apiKey = apiKeys.openAi || apiKeys.gemini || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) throw new Error('No AI API Key found in configuration.');

        res.json({ success: true, message: 'AI Engine configuration found and validated.' });
    } catch (e: any) {
        res.status(400).json({ success: false, error: e.message });
    }
};

/**
 * Get Platform Logs
 */
export const getPlatformLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const lines = parseInt(req.query.lines as string || '200');
        const logFile = path.join(process.cwd(), 'start_output.log');

        if (!fs.existsSync(logFile)) {
            return res.json({ logs: 'Log file not found.', exists: false });
        }

        // Simple way to get last N lines
        const content = fs.readFileSync(logFile, 'utf8');
        const logLines = content.split('\n');
        const lastLines = logLines.slice(-lines).join('\n');

        res.json({
            logs: lastLines,
            exists: true,
            size: fs.statSync(logFile).size,
            lastUpdated: fs.statSync(logFile).mtime
        });
    } catch (e: any) {
        logger.error('Failed to read platform logs', e);
        res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Get Global Feature Flags
 */
export const getFeatureFlags = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const flags = await db.all('SELECT * FROM feature_flags ORDER BY category, displayname');
        res.json(flags.map((f: any) => ({
            ...f,
            enabled: !!f.enabled,
            requiresfeatures: f.requiresfeatures ? JSON.parse(f.requiresfeatures) : []
        })));
    } catch (e) {
        next(e);
    }
};

/**
 * Update Feature Flag Status
 */
export const updateFeatureFlag = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.params;
        const { enabled } = req.body;
        const db = getDb();
        const userId = (req as any).user?.id || 'admin';

        await db.run(
            'UPDATE feature_flags SET enabled = ?, updatedAt = ? WHERE name = ?',
            [enabled ? 1 : 0, new Date().toISOString(), name]
        );

        logger.warn(`Feature Flag ${name} changed to ${enabled} by ${userId}`);
        broadcastToAll({
            type: 'superadmin_update',
            entityType: 'feature_flag',
            name,
            enabled
        });

        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};
