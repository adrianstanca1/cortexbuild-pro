/**
 * Development Utilities
 * Helpful functions for development and debugging
 */

import { validateConfiguration, logConfigValidation } from './configValidator';
import { checkHealth, comprehensiveHealthCheck } from '../services/health-check';
import { getErrorStats } from './apiErrorHandler';

/**
 * Run all diagnostic checks and log results
 */
export async function runDiagnostics() {
    console.group('🔍 CortexBuild Diagnostics');

    // 1. Configuration validation
    console.log('\n1️⃣ Configuration Check:');
    logConfigValidation();

    // 2. API Health Check
    console.log('\n2️⃣ API Health Check:');
    try {
        const health = await checkHealth();
        console.table({
            'Status': health.status,
            'API': health.services.api ? '✅' : '❌',
            'Database': health.services.database ? '✅' : '❌',
            'WebSocket': health.services.websocket ? '✅' : '❌',
            'Construction API': health.services.constructionApi ? '✅' : '❌',
            'Response Time': `${health.responseTime}ms`,
        });

        if (health.errors && health.errors.length > 0) {
            console.error('Errors:', health.errors);
        }
    } catch (error) {
        console.error('Health check failed:', error);
    }

    // 3. Error Statistics
    console.log('\n3️⃣ Error Statistics:');
    const errors = getErrorStats();
    if (errors.total > 0) {
        console.log(`Total Errors: ${errors.total}`);
        console.table(errors.byType);
        console.log('Recent Errors:', errors.lastErrors.slice(-5));
    } else {
        console.log('✅ No errors recorded');
    }

    console.groupEnd();
}

/**
 * Test all critical API endpoints
 */
export async function testEndpoints() {
    console.group('🧪 Endpoint Tests');

    const comprehensive = await comprehensiveHealthCheck();

    console.log(`API URL: ${comprehensive.details.apiUrl}`);
    console.log(`WebSocket URL: ${comprehensive.details.wsUrl}`);
    console.log('\nEndpoint Status:');
    console.table(
        Object.entries(comprehensive.details.endpoints).map(([endpoint, status]) => ({
            Endpoint: endpoint,
            Status: status ? '✅ Available' : '❌ Unavailable',
        }))
    );

    console.groupEnd();

    return comprehensive;
}

/**
 * Make these functions available in browser console for debugging
 */
if (typeof window !== 'undefined') {
    (window as any).cortexDiagnostics = {
        runDiagnostics,
        testEndpoints,
        checkHealth,
        validateConfig: validateConfiguration,
    };

    console.log(
        '%c🛠️ Development utilities loaded!',
        'color: #4F46E5; font-weight: bold; font-size: 14px;'
    );
    console.log(
        '%cRun window.cortexDiagnostics.runDiagnostics() to check system health',
        'color: #6B7280;'
    );
}

export default {
    runDiagnostics,
    testEndpoints,
};
