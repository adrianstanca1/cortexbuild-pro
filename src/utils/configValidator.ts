/**
 * Configuration Validator
 * Validates all required environment variables and configuration settings
 */

interface ConfigValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    config: {
        apiUrl: string;
        wsUrl: string;
        environment: string;
    };
}

export function validateConfiguration(): ConfigValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    const wsUrl = import.meta.env.VITE_WS_URL;
    const mode = import.meta.env.MODE;

    // Validate API URL
    if (!apiUrl) {
        errors.push('VITE_API_URL is not defined');
    } else if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        errors.push('VITE_API_URL must start with http:// or https://');
    }

    // Validate WebSocket URL
    if (!wsUrl) {
        warnings.push('VITE_WS_URL is not defined - real-time features may not work');
    } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        errors.push('VITE_WS_URL must start with ws:// or wss://');
    }

    // Production-specific checks
    if (mode === 'production') {
        if (apiUrl?.startsWith('http://localhost')) {
            warnings.push('Using localhost API URL in production mode');
        }
        if (apiUrl && !apiUrl.startsWith('https://')) {
            warnings.push('API URL should use HTTPS in production');
        }
        if (wsUrl && !wsUrl.startsWith('wss://')) {
            warnings.push('WebSocket URL should use WSS in production');
        }
    }

    const isValid = errors.length === 0;

    return {
        isValid,
        errors,
        warnings,
        config: {
            apiUrl: apiUrl || '',
            wsUrl: wsUrl || '',
            environment: mode || 'development',
        },
    };
}

/**
 * Log configuration validation results to console
 */
export function logConfigValidation(): void {
    const validation = validateConfiguration();

    console.group('🔧 Configuration Validation');
    console.log('Environment:', validation.config.environment);
    console.log('API URL:', validation.config.apiUrl || '❌ Not configured');
    console.log('WebSocket URL:', validation.config.wsUrl || '⚠️ Not configured');

    if (validation.errors.length > 0) {
        console.group('❌ Errors');
        validation.errors.forEach((error) => console.error(error));
        console.groupEnd();
    }

    if (validation.warnings.length > 0) {
        console.group('⚠️ Warnings');
        validation.warnings.forEach((warning) => console.warn(warning));
        console.groupEnd();
    }

    if (validation.isValid && validation.warnings.length === 0) {
        console.log('✅ Configuration is valid');
    }

    console.groupEnd();
}

/**
 * Throw error if configuration is invalid (use in development)
 */
export function enforceValidConfiguration(): void {
    const validation = validateConfiguration();

    if (!validation.isValid) {
        throw new Error(
            `Invalid configuration:\n${validation.errors.join('\n')}`
        );
    }
}

export default {
    validateConfiguration,
    logConfigValidation,
    enforceValidConfiguration,
};
