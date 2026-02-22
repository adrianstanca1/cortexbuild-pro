import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

export interface DatabaseMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    connectionUtilization: number;
    queryTime: number;
    slowQueries: Array<{ query: string; duration: number; timestamp: string }>;
}

export class DatabasePerformanceMonitor {
    private static slowQueries: Array<{ query: string; duration: number; timestamp: string }> = [];
    private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

    /**
     * Get database performance metrics
     */
    static async getMetrics(): Promise<DatabaseMetrics> {
        const db = getDb();
        const poolStats = db.getPoolStats ? db.getPoolStats() : null;

        return {
            totalConnections: poolStats?.totalConnections || 0,
            activeConnections: (poolStats?.totalConnections || 0) - (poolStats?.freeConnections || 0),
            idleConnections: poolStats?.freeConnections || 0,
            waitingClients: poolStats?.waitingClients || 0,
            connectionUtilization: poolStats
                ? ((poolStats.totalConnections - poolStats.freeConnections) / poolStats.totalConnections) * 100
                : 0,
            queryTime: this.getAverageQueryTime(),
            slowQueries: [...this.slowQueries]
        };
    }

    /**
     * Monitor query execution time
     */
    static async monitorQuery<T>(queryFn: () => Promise<T>, query: string): Promise<T> {
        const startTime = Date.now();
        try {
            const result = await queryFn();
            const duration = Date.now() - startTime;

            if (duration > this.SLOW_QUERY_THRESHOLD) {
                this.logSlowQuery(query, duration);
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Query failed after ${duration}ms: ${query}`, error);
            throw error;
        }
    }

    /**
     * Log slow query
     */
    private static logSlowQuery(query: string, duration: number): void {
        const slowQuery = {
            query: query.substring(0, 500), // Truncate for storage
            duration,
            timestamp: new Date().toISOString()
        };

        this.slowQueries.push(slowQuery);

        // Keep only last 100 slow queries
        if (this.slowQueries.length > 100) {
            this.slowQueries = this.slowQueries.slice(-100);
        }

        logger.warn(`Slow query detected: ${duration}ms - ${query.substring(0, 200)}...`);
    }

    /**
     * Get average query time
     */
    private static getAverageQueryTime(): number {
        if (this.slowQueries.length === 0) return 0;

        const totalTime = this.slowQueries.reduce((sum, query) => sum + query.duration, 0);
        return Math.round(totalTime / this.slowQueries.length);
    }

    /**
     * Clear old slow query logs
     */
    static clearSlowQueries(): void {
        this.slowQueries = [];
        logger.info('Slow query logs cleared');
    }

    /**
     * Analyze database performance and provide recommendations
     */
    static analyzePerformance(metrics: DatabaseMetrics): string[] {
        const recommendations: string[] = [];

        if (metrics.connectionUtilization > 80) {
            recommendations.push(
                'High connection utilization. Consider increasing pool size or optimizing query performance.'
            );
        }

        if (metrics.waitingClients > 10) {
            recommendations.push('Many clients waiting for connections. Database pool may be undersized.');
        }

        if (metrics.slowQueries.length > 50) {
            recommendations.push(
                'High number of slow queries detected. Review query performance and add missing indexes.'
            );
        }

        const avgSlowQueryTime =
            metrics.slowQueries.reduce((sum, q) => sum + q.duration, 0) / metrics.slowQueries.length;
        if (avgSlowQueryTime > 2000) {
            recommendations.push('Very slow average query time. Consider query optimization or database tuning.');
        }

        if (recommendations.length === 0) {
            recommendations.push('Database performance is optimal.');
        }

        return recommendations;
    }
}
