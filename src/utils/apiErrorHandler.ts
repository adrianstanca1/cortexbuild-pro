// Global API Error Handler
// This module provides enhanced error handling for API calls

import toast from 'react-hot-toast';

// Error statistics for monitoring
const errorStats = {
    total: 0,
    byType: {} as Record<number, number>,
    lastErrors: [] as Array<{ timestamp: string; status: number; message: string }>,
};

// Store the original fetch
const originalFetch = window.fetch;

// Helper to log errors for debugging
function logError(status: number, message: string, url: string) {
    const timestamp = new Date().toISOString();

    // Update statistics
    errorStats.total++;
    errorStats.byType[status] = (errorStats.byType[status] || 0) + 1;
    errorStats.lastErrors.push({ timestamp, status, message });

    // Keep only last 50 errors
    if (errorStats.lastErrors.length > 50) {
        errorStats.lastErrors.shift();
    }

    console.error(`[API Error ${status}] ${message}`, {
        url,
        timestamp,
        stats: errorStats,
    });
}

// Enhanced fetch with error handling
window.fetch = async (...args) => {
    try {
        const response = await originalFetch(...args);
        const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : (args[0] as URL).href);

        // Handle authentication errors
        if (response.status === 401) {
            logError(401, 'Unauthorized - Session expired', url);

            // Show user-friendly message
            toast.error('Your session has expired. Please log in again.');

            // Clear session data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();

            // Redirect to login after a short delay
            setTimeout(() => {
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }, 1500);

            return response;
        }

        // Handle permission errors
        if (response.status === 403) {
            logError(403, 'Forbidden - Insufficient permissions', url);

            // Show user-friendly message
            toast.error("You don't have permission to access this resource.");

            return response;
        }

        // Handle not found errors
        if (response.status === 404) {
            logError(404, 'Resource not found', url);
            // Don't show toast for 404s, let components handle it
            return response;
        }

        // Handle server errors
        if (response.status >= 500) {
            logError(response.status, `Server error: ${response.statusText}`, url);
            toast.error('Server error. Please try again later.');
        }

        return response;
    } catch (error) {
        // Handle network errors
        const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : (args[0] as URL).href);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logError(0, `Network error: ${errorMessage}`, url);
        toast.error('Network error. Please check your connection.');
        throw error;
    }
};

// Export error stats for monitoring/debugging
export function getErrorStats() {
    return { ...errorStats };
}

// Reset error stats (useful for testing)
export function resetErrorStats() {
    errorStats.total = 0;
    errorStats.byType = {};
    errorStats.lastErrors = [];
}

console.log('✅ Enhanced global API error handler initialized');
