import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

interface DatabaseHealthMetrics {
    isHealthy: boolean;
    latencyMs: number;
    type: string;
    poolStats: any;
    errorCount: number;
    lastError?: { timestamp: Date; message: string };
    uptime: number;
}

class DatabaseHealthService {
    private errorCount = 0;
    private lastError?: { timestamp: Date; message: string };
    private startTime = Date.now();
    private healthCheckInterval?: NodeJS.Timeout;

    constructor() {
        this.startMonitoring();
    }

    private startMonitoring() {
        // Run health check every 30 seconds
        this.healthCheckInterval = setInterval(() => {
            this.checkHealth().catch(err => {
                logger.error('Database health check failed:', err);
            });
        }, 30000);
    }

    public async checkHealth(): Promise<DatabaseHealthMetrics> {
        const start = Date.now();
        let isHealthy = false;
        let latencyMs = 0;
        let type = 'unknown';
        let poolStats = {};

        try {
            const db = getDb();
            
            // Simple health check query
            await db.get('SELECT 1 as health_check');
            
            latencyMs = Date.now() - start;
            isHealthy = latencyMs < 5000; // Consider unhealthy if takes > 5s
            
            type = db.getType ? db.getType() : 'unknown';
            poolStats = db.getPoolStats ? db.getPoolStats() : {};

            if (!isHealthy) {
                logger.warn(`Database slow response: ${latencyMs}ms`);
            }
        } catch (error: any) {
            latencyMs = Date.now() - start;
            isHealthy = false;
            this.errorCount++;
            this.lastError = {
                timestamp: new Date(),
                message: error.message
            };
            logger.error('Database health check failed:', error);
        }

        return {
            isHealthy,
            latencyMs,
            type,
            poolStats,
            errorCount: this.errorCount,
            lastError: this.lastError,
            uptime: Math.floor((Date.now() - this.startTime) / 1000)
        };
    }

    public async testConnection(): Promise<boolean> {
        try {
            const db = getDb();
            await db.get('SELECT 1');
            return true;
        } catch (error) {
            logger.error('Database connection test failed:', error);
            return false;
        }
    }

    public getMetrics(): { errorCount: number; lastError?: any; uptime: number } {
        return {
            errorCount: this.errorCount,
            lastError: this.lastError,
            uptime: Math.floor((Date.now() - this.startTime) / 1000)
        };
    }

    public stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
}

export const databaseHealthService = new DatabaseHealthService();
