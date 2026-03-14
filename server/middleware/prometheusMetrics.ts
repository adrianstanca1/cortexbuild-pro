import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Prometheus registry
export const register = new Registry();

// Collect default Node.js metrics
collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register]
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [register]
});

// Active connections
export const activeConnections = new Gauge({
    name: 'http_active_connections',
    help: 'Number of active HTTP connections',
    registers: [register]
});

// Database metrics
export const dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register]
});

// Business metrics
export const activeUsers = new Gauge({
    name: 'cortexbuild_active_users',
    help: 'Number of currently active users',
    registers: [register]
});

export const activeProjects = new Gauge({
    name: 'cortexbuild_active_projects',
    help: 'Number of active projects',
    registers: [register]
});

export const apiErrorsTotal = new Counter({
    name: 'cortexbuild_api_errors_total',
    help: 'Total number of API errors',
    labelNames: ['endpoint', 'error_code'],
    registers: [register]
});

// Middleware to track requests
export function prometheusMiddleware(req: any, res: any, next: any) {
    const start = Date.now();
    
    // Increment active connections
    activeConnections.inc();
    
    // Capture original end function
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
        const duration = (Date.now() - start) / 1000;
        const path = req.route ? req.route.path : req.path;
        const labels = { 
            method: req.method, 
            path: path, 
            status: res.statusCode.toString() 
        };
        
        // Track request
        httpRequestsTotal.inc(labels);
        httpRequestDuration.observe(labels, duration);
        
        // Track errors
        if (res.statusCode >= 400) {
            apiErrorsTotal.inc({ endpoint: path, error_code: res.statusCode.toString() });
        }
        
        // Decrement active connections
        activeConnections.dec();
        
        return originalEnd.apply(res, args);
    };
    
    next();
}

// Get metrics in Prometheus format
export async function getPrometheusMetrics() {
    return register.metrics();
}

// Get metrics as JSON
export async function getPrometheusMetricsJSON() {
    return {
        http: {
            requests_total: await httpRequestsTotal.get(),
            request_duration_seconds: await httpRequestDuration.get(),
            active_connections: await activeConnections.get()
        },
        business: {
            active_users: await activeUsers.get(),
            active_projects: await activeProjects.get(),
            api_errors_total: await apiErrorsTotal.get()
        }
    };
}