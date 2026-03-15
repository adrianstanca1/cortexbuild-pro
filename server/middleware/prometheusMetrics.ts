// Prometheus metrics middleware
// Note: prom-client is an optional dependency. If not installed, metrics will be disabled.

let Registry: any, Counter: any, Histogram: any, Gauge: any, collectDefaultMetrics: any;
let promClientAvailable = false;

try {
    const promClient = require('prom-client');
    Registry = promClient.Registry;
    Counter = promClient.Counter;
    Histogram = promClient.Histogram;
    Gauge = promClient.Gauge;
    collectDefaultMetrics = promClient.collectDefaultMetrics;
    promClientAvailable = true;
} catch (e) {
    // prom-client not installed - metrics will be no-ops
    console.warn('prom-client not installed. Prometheus metrics disabled.');
}

// Create a registry (or a mock if prom-client is not available)
let register: any;
let httpRequestsTotal: any;
let httpRequestDuration: any;
let activeConnections: any;
let dbQueryDuration: any;
let activeUsers: any;
let activeProjects: any;
let apiErrorsTotal: any;

if (promClientAvailable) {
    register = new Registry();
    collectDefaultMetrics({ register });

    httpRequestsTotal = new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'path', 'status'],
        registers: [register]
    });

    httpRequestDuration = new Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'path', 'status'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
        registers: [register]
    });

    activeConnections = new Gauge({
        name: 'http_active_connections',
        help: 'Number of active HTTP connections',
        registers: [register]
    });

    dbQueryDuration = new Histogram({
        name: 'db_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        labelNames: ['query_type', 'table'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
        registers: [register]
    });

    activeUsers = new Gauge({
        name: 'cortexbuild_active_users',
        help: 'Number of currently active users',
        registers: [register]
    });

    activeProjects = new Gauge({
        name: 'cortexbuild_active_projects',
        help: 'Number of active projects',
        registers: [register]
    });

    apiErrorsTotal = new Counter({
        name: 'cortexbuild_api_errors_total',
        help: 'Total number of API errors',
        labelNames: ['endpoint', 'error_code'],
        registers: [register]
    });
} else {
    // No-op implementations
    const noopFn = () => {};
    const noopObj = { inc: noopFn, dec: noopFn, observe: noopFn, get: () => Promise.resolve({}) };
    register = { metrics: () => Promise.resolve(''), getSingleMetric: () => null };
    httpRequestsTotal = noopObj;
    httpRequestDuration = { observe: noopFn, get: () => Promise.resolve({}) };
    activeConnections = noopObj;
    dbQueryDuration = { observe: noopFn, get: () => Promise.resolve({}) };
    activeUsers = noopObj;
    activeProjects = noopObj;
    apiErrorsTotal = noopObj;
}

// Middleware to track requests
export function prometheusMiddleware(req: any, res: any, next: any) {
    if (!promClientAvailable) {
        return next();
    }

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
export async function getPrometheusMetrics(): Promise<string> {
    if (!promClientAvailable) {
        return '# prom-client not installed\n';
    }
    return register.metrics();
}

// Get metrics as JSON
export async function getPrometheusMetricsJSON() {
    if (!promClientAvailable) {
        return {
            http: { requests_total: {}, request_duration_seconds: {}, active_connections: {} },
            business: { active_users: {}, active_projects: {}, api_errors_total: {} },
            available: false
        };
    }
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
        },
        available: true
    };
}

export { register, httpRequestsTotal, httpRequestDuration, activeConnections, dbQueryDuration, activeUsers, activeProjects, apiErrorsTotal };