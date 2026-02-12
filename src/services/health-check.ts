import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    services: {
        api: boolean;
        database: boolean;
        websocket?: boolean;
        constructionApi?: boolean;
    };
    responseTime?: number;
    errors?: string[];
}

export async function checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const services = {
        api: false,
        database: false,
        websocket: false,
        constructionApi: false,
    };

    try {
        // Check main API health endpoint
        const response = await axios.get(`${API_URL}/api/v1/health`, {
            timeout: 5000,
        });

        services.api = true;
        services.database = response.data.database === 'connected';

        if (!services.database) {
            errors.push('Database connection failed');
        }
    } catch (error) {
        services.api = false;
        if (axios.isAxiosError(error)) {
            errors.push(`API Health Check Failed: ${error.message}`);
        } else {
            errors.push('API Health Check Failed: Unknown error');
        }
    }

    // Check Construction API endpoints
    try {
        const constructionResponse = await axios.get(
            `${API_URL}/construction/inspections`,
            {
                timeout: 3000,
                validateStatus: (status) => status === 401 || status === 200, // 401 means endpoint exists but needs auth
            }
        );
        services.constructionApi = [200, 401].includes(constructionResponse.status);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            services.constructionApi = true; // Endpoint exists, just needs auth
        } else {
            services.constructionApi = false;
            errors.push('Construction API endpoints unreachable');
        }
    }

    // Check WebSocket availability (basic check)
    try {
        if (WS_URL && typeof WebSocket !== 'undefined') {
            // We'll just check if WebSocket is available, not actually connect
            services.websocket = true;
        }
    } catch (error) {
        services.websocket = false;
        errors.push('WebSocket not available');
    }

    const responseTime = Date.now() - startTime;

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (services.api && services.database) {
        status = 'healthy';
    } else if (services.api) {
        status = 'degraded';
    } else {
        status = 'unhealthy';
    }

    return {
        status,
        timestamp: new Date().toISOString(),
        services,
        responseTime,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Comprehensive health check with detailed diagnostics
 */
export async function comprehensiveHealthCheck(): Promise<{
    overall: HealthCheckResult;
    details: {
        apiUrl: string;
        wsUrl: string;
        endpoints: Record<string, boolean>;
    };
}> {
    const overall = await checkHealth();

    // Test additional endpoints
    const endpoints: Record<string, boolean> = {};

    const testEndpoints = [
        '/api/v1/health',
        '/api/v1/projects',
        '/construction/inspections',
        '/construction/change-orders',
    ];

    for (const endpoint of testEndpoints) {
        try {
            const response = await axios.get(`${API_URL}${endpoint}`, {
                timeout: 2000,
                validateStatus: () => true, // Accept any status
            });
            endpoints[endpoint] = response.status < 500;
        } catch {
            endpoints[endpoint] = false;
        }
    }

    return {
        overall,
        details: {
            apiUrl: API_URL,
            wsUrl: WS_URL,
            endpoints,
        },
    };
}

// Legacy function for backward compatibility
export async function runHealthCheck() {
    const result = await checkHealth();
    console.table({
        'API Status': result.status,
        'API Connected': result.services.api ? 'Yes' : 'No',
        'Database Connected': result.services.database ? 'Yes' : 'No',
        'WebSocket Available': result.services.websocket ? 'Yes' : 'No',
        'Response Time': `${result.responseTime}ms`,
    });

    if (result.errors && result.errors.length > 0) {
        console.warn('Health check issues:', result.errors);
    }

    return result;
}
