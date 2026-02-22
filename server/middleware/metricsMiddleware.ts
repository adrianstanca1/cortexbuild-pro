import type { Request, Response, NextFunction } from 'express';

/**
 * Metrics Middleware
 * Tracks request metrics for monitoring and performance analysis
 */

interface RequestMetrics {
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    timestamp: string;
    userAgent?: string;
    ip?: string;
}

interface AggregatedMetrics {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsPerEndpoint: { [key: string]: number };
    slowRequests: RequestMetrics[];
    errors: RequestMetrics[];
    lastUpdated: string;
}

const metrics: RequestMetrics[] = [];
const SLOW_REQUEST_THRESHOLD = 500; // ms
const MAX_STORED_METRICS = 1000;

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Capture original end function
    const originalEnd = res.end;

    // Override end function to capture metrics
    res.end = function (...args: any[]) {
        const responseTime = Date.now() - start;

        const metric: RequestMetrics = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime,
            timestamp: new Date().toISOString(),
            userAgent: req.get('user-agent'),
            ip: req.ip || req.connection.remoteAddress
        };

        // Store metric
        metrics.push(metric);

        // Keep only recent metrics
        if (metrics.length > MAX_STORED_METRICS) {
            metrics.shift();
        }

        // Log slow requests
        if (responseTime > SLOW_REQUEST_THRESHOLD) {
            console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
        }

        // Log errors
        if (res.statusCode >= 400) {
            console.error(`❌ Error: ${req.method} ${req.path} - ${res.statusCode}`);
        }

        // Call original end
        return originalEnd.apply(res, args);
    };

    next();
}

export function getMetrics(): AggregatedMetrics {
    const now = new Date().toISOString();

    if (metrics.length === 0) {
        return {
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
            requestsPerEndpoint: {},
            slowRequests: [],
            errors: [],
            lastUpdated: now
        };
    }

    const totalRequests = metrics.length;
    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalRequests;
    const errors = metrics.filter(m => m.statusCode >= 400);
    const errorRate = (errors.length / totalRequests) * 100;
    const slowRequests = metrics.filter(m => m.responseTime > SLOW_REQUEST_THRESHOLD);

    // Count requests per endpoint
    const requestsPerEndpoint: { [key: string]: number } = {};
    metrics.forEach(m => {
        const key = `${m.method} ${m.path}`;
        requestsPerEndpoint[key] = (requestsPerEndpoint[key] || 0) + 1;
    });

    return {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerEndpoint,
        slowRequests: slowRequests.slice(-10), // Last 10 slow requests
        errors: errors.slice(-10), // Last 10 errors
        lastUpdated: now
    };
}

export function resetMetrics() {
    metrics.length = 0;
}
