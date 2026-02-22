import { Request, Response, NextFunction } from 'express';
import { getConnectionStats } from '../socket.js';
import { messageQueue, heartbeatMonitor } from '../services/websocketQueue.js';
import { databaseHealthService } from '../services/databaseHealthService.js';
import { logger } from '../utils/logger.js';
import os from 'os';

/**
 * Get comprehensive system status
 */
export const getSystemStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get WebSocket stats
        const wsStats = getConnectionStats();
        const queueStats = messageQueue.getStats();
        const heartbeatStats = heartbeatMonitor.getStats();

        // Get database health
        const dbHealth = await databaseHealthService.checkHealth();

        // Get system metrics
        const systemMetrics = {
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
            },
            cpu: {
                loadAverage: os.loadavg(),
                cores: os.cpus().length
            },
            platform: os.platform(),
            nodeVersion: process.version
        };

        res.json({
            status: 'operational',
            timestamp: new Date().toISOString(),
            websocket: {
                ...wsStats,
                queue: queueStats,
                heartbeat: heartbeatStats
            },
            database: dbHealth,
            system: systemMetrics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get WebSocket connection details
 */
export const getWebSocketStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const wsStats = getConnectionStats();
        const queueStats = messageQueue.getStats();
        const heartbeatStats = heartbeatMonitor.getStats();

        res.json({
            success: true,
            data: {
                connections: wsStats,
                messageQueue: queueStats,
                heartbeat: heartbeatStats,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get database connection status
 */
export const getDatabaseStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dbHealth = await databaseHealthService.checkHealth();

        res.json({
            success: true,
            data: dbHealth
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isConnected = await databaseHealthService.testConnection();

        res.json({
            success: isConnected,
            message: isConnected ? 'Database connection successful' : 'Database connection failed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get API metrics
 */
export const getApiMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = (req as any).metrics || {};

        res.json({
            success: true,
            data: {
                requests: metrics,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};
