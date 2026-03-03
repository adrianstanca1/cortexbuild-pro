// Environment configuration with validation and production optimization

// Helper function for environment variable access
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Browser environment with Vite
  if (typeof window !== 'undefined' && (window as any).VITE_ENV) {
    return (window as any).VITE_ENV[key] || fallback;
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  // Vite import.meta.env fallback (only works in proper Vite context)
  if (typeof globalThis !== 'undefined' && (globalThis as any).import && (globalThis as any).import.meta) {
    return (globalThis as any).import.meta.env[key] || fallback;
  }
  return fallback;
};

// Environment validation
const validateEnvironment = (): void => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const env = getCurrentEnvironment();

  // Production validations
  if (env.isProduction) {
    if (!env.gemini.apiKey) {
      warnings.push('GEMINI_API_KEY not set - AI features will be disabled');
    }
    
    if (env.features.allowMockFallback) {
      warnings.push('Mock fallback enabled in production - consider disabling');
    }
    
    if (!env.oauth.google.clientId && !env.oauth.github.clientId) {
      warnings.push('No OAuth providers configured');
    }
  }

  // Critical validations for all environments
  if (!env.apiUrl) {
    errors.push('API URL is required');
  }

  // Report validation results
  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid environment configuration');
  }

  if (warnings.length > 0 && env.isDevelopment) {
    console.warn('⚠️ Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (env.isDevelopment) {
    console.log('✅ Environment configuration validated');
  }
};

export interface Environment {
  name: string;
  apiUrl: string;
  authUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  monitoring: {
    enabled: boolean;
    sentryDsn?: string;
    analyticsId?: string;
  };
  oauth: {
    google: {
      clientId: string;
      enabled: boolean;
    };
    github: {
      clientId: string;
      enabled: boolean;
    };
    oauthIo: {
      publicKey: string;
      enabled: boolean;
    };
  };
  features: {
    allowMockFallback: boolean;
    useSupabase: boolean;
    enablePwa: boolean;
    enableServiceWorker: boolean;
  };
  gemini: {
    apiKey: string;
    browserKey: string;
    enabled: boolean;
  };
}

export interface EnvironmentShape extends Environment {
  timestamp?: string;
  [key: string]: any;
}

const environments: Record<string, Environment> = {
  development: {
    name: 'development',
    // Use mock API if VITE_USE_MOCK_API is true, otherwise use configured backend
    apiUrl: getEnvVar('VITE_USE_MOCK_API') === 'true' ? '' : (getEnvVar('VITE_API_BASE_URL') || 'http://localhost:5001/api'),
    authUrl: getEnvVar('VITE_USE_MOCK_API') === 'true' ? '' : (getEnvVar('VITE_API_BASE_URL').replace('/api', '/auth') || 'http://localhost:5001/auth'),
    isDevelopment: true,
    isProduction: false,
    oauth: {
      google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID_NEW || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        enabled: !!(import.meta.env.VITE_GOOGLE_CLIENT_ID_NEW || import.meta.env.VITE_GOOGLE_CLIENT_ID),
      },
      github: {
        clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
        enabled: !!import.meta.env.VITE_GITHUB_CLIENT_ID,
      },
      oauthIo: {
        publicKey: import.meta.env.VITE_OAUTH_IO_PUBLIC_KEY || '',
        enabled: !!import.meta.env.VITE_OAUTH_IO_PUBLIC_KEY,
      },
    },
    features: {
      allowMockFallback: import.meta.env.VITE_ALLOW_MOCK_FALLBACK !== 'false',
      useSupabase: import.meta.env.VITE_USE_SUPABASE === 'true',
    },
    gemini: {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      browserKey: import.meta.env.VITE_GEMINI_BROWSER_KEY || '',
      enabled: !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_BROWSER_KEY),
    },
  },
  production: {
    name: 'production',
    apiUrl: '/api',
    authUrl: '/auth',
    isDevelopment: false,
    isProduction: true,
    oauth: {
      google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID_NEW || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        enabled: !!(import.meta.env.VITE_GOOGLE_CLIENT_ID_NEW || import.meta.env.VITE_GOOGLE_CLIENT_ID),
      },
      github: {
        clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
        enabled: !!import.meta.env.VITE_GITHUB_CLIENT_ID,
      },
      oauthIo: {
        publicKey: import.meta.env.VITE_OAUTH_IO_PUBLIC_KEY || '',
        enabled: !!import.meta.env.VITE_OAUTH_IO_PUBLIC_KEY,
      },
    },
    features: {
      allowMockFallback: import.meta.env.VITE_ALLOW_MOCK_FALLBACK !== 'false',
      useSupabase: import.meta.env.VITE_USE_SUPABASE === 'true',
    },
    gemini: {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      browserKey: import.meta.env.VITE_GEMINI_BROWSER_KEY || '',
      enabled: !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_BROWSER_KEY),
    },
  },
};

let currentEnvironment: Environment = environments.development;

export const getEnvironment = (): Environment => {
  return currentEnvironment;
};

export const refreshEnvironment = (): void => {
  const env = getEnvVar('MODE') || getEnvVar('NODE_ENV') || 'development';
  currentEnvironment = environments[env] || environments.development;
};

export const getEnvironmentSnapshot = (): EnvironmentShape => {
  return {
    ...currentEnvironment,
    timestamp: new Date().toISOString(),
  };
};

// Initialize environment
refreshEnvironment();