// Enhanced Storage Configuration with AI Integration
// Multi-provider AI services, improved validation, and cost optimization

import { StorageConfig } from '../services/multimodalStorage';

// AI Service Providers Configuration
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'azure-openai';
  apiKey: string;
  baseUrl?: string;
  models: {
    text: string[];
    vision: string[];
    embedding: string[];
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  costPerToken: {
    input: number;
    output: number;
  };
  enabled: boolean;
}

export interface AIIntegratedStorageConfig extends StorageConfig {
  aiServices: {
    primary: AIServiceConfig;
    fallback: AIServiceConfig[];
    routing: {
      strategy: 'cost' | 'performance' | 'quality' | 'round-robin';
      costThreshold: number; // USD per 1K tokens
      performanceThreshold: number; // ms response time
    };
  };
  smartOptimization: {
    enabled: boolean;
    aiClassification: boolean;
    autoCompression: boolean;
    intelligentCaching: boolean;
    costOptimization: boolean;
  };
  validation: {
    strict: boolean;
    allowFallback: boolean;
    validateOnStartup: boolean;
  };
}

// Environment variable helpers with validation
const getRequiredEnvVar = (key: string): string => {
  const value = process.env?.[key] || (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]);
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

const getOptionalEnvVar = (key: string, fallback: string = ''): string => {
  return process.env?.[key] || (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) || fallback;
};

const getNumericEnvVar = (key: string, fallback: number): number => {
  const value = process.env?.[key] || (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]);
  return value ? parseInt(value, 10) : fallback;
};

const getBooleanEnvVar = (key: string, fallback: boolean = false): boolean => {
  const value = process.env?.[key] || (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]);
  return value ? value.toLowerCase() === 'true' : fallback;
};

// AI Service Configurations
const openAIConfig: AIServiceConfig = {
  provider: 'openai',
  apiKey: getOptionalEnvVar('OPENAI_API_KEY'),
  baseUrl: getOptionalEnvVar('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  models: {
    text: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    vision: ['gpt-4o', 'gpt-4o-mini'],
    embedding: ['text-embedding-3-large', 'text-embedding-3-small', 'text-embedding-ada-002']
  },
  rateLimits: {
    requestsPerMinute: getNumericEnvVar('OPENAI_RPM_LIMIT', 500),
    tokensPerMinute: getNumericEnvVar('OPENAI_TPM_LIMIT', 30000)
  },
  costPerToken: {
    input: 0.000005, // $5 per 1M tokens for GPT-4o
    output: 0.000015 // $15 per 1M tokens for GPT-4o
  },
  enabled: !!getOptionalEnvVar('OPENAI_API_KEY')
};

const claudeConfig: AIServiceConfig = {
  provider: 'anthropic',
  apiKey: getOptionalEnvVar('ANTHROPIC_API_KEY'),
  baseUrl: getOptionalEnvVar('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'),
  models: {
    text: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    vision: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    embedding: [] // Claude doesn't provide embeddings
  },
  rateLimits: {
    requestsPerMinute: getNumericEnvVar('ANTHROPIC_RPM_LIMIT', 50),
    tokensPerMinute: getNumericEnvVar('ANTHROPIC_TPM_LIMIT', 40000)
  },
  costPerToken: {
    input: 0.000003, // $3 per 1M tokens for Claude-3.5 Sonnet
    output: 0.000015 // $15 per 1M tokens for Claude-3.5 Sonnet
  },
  enabled: !!getOptionalEnvVar('ANTHROPIC_API_KEY')
};

const geminiConfig: AIServiceConfig = {
  provider: 'google',
  apiKey: getOptionalEnvVar('GEMINI_API_KEY') || getOptionalEnvVar('VITE_GEMINI_API_KEY'),
  baseUrl: getOptionalEnvVar('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
  models: {
    text: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    vision: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    embedding: ['text-embedding-004']
  },
  rateLimits: {
    requestsPerMinute: getNumericEnvVar('GEMINI_RPM_LIMIT', 60),
    tokensPerMinute: getNumericEnvVar('GEMINI_TPM_LIMIT', 32000)
  },
  costPerToken: {
    input: 0.000000125, // $0.125 per 1M tokens for Gemini 1.5 Flash
    output: 0.000000375 // $0.375 per 1M tokens for Gemini 1.5 Flash
  },
  enabled: !!(getOptionalEnvVar('GEMINI_API_KEY') || getOptionalEnvVar('VITE_GEMINI_API_KEY'))
};

// Enhanced Development Configuration
const enhancedDevelopmentConfig: AIIntegratedStorageConfig = {
  provider: 'local',
  encryption: false,
  compression: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  retentionDays: 30,
  cacheTTL: 1800, // 30 minutes
  aiServices: {
    primary: geminiConfig.enabled ? geminiConfig : openAIConfig,
    fallback: [openAIConfig, claudeConfig, geminiConfig].filter(config => config.enabled),
    routing: {
      strategy: 'cost',
      costThreshold: 0.01, // $0.01 per 1K tokens
      performanceThreshold: 5000 // 5 seconds
    }
  },
  smartOptimization: {
    enabled: true,
    aiClassification: true,
    autoCompression: true,
    intelligentCaching: true,
    costOptimization: true
  },
  validation: {
    strict: false,
    allowFallback: true,
    validateOnStartup: true
  }
};

// Enhanced Staging Configuration
const enhancedStagingConfig: AIIntegratedStorageConfig = {
  provider: 'gcp',
  bucket: getOptionalEnvVar('STAGING_STORAGE_BUCKET', 'multimodal-staging'),
  region: getOptionalEnvVar('STAGING_STORAGE_REGION', 'us-central1'),
  encryption: true,
  compression: true,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  retentionDays: 90,
  cacheTTL: 3600, // 1 hour
  aiServices: {
    primary: openAIConfig.enabled ? openAIConfig : geminiConfig,
    fallback: [geminiConfig, claudeConfig, openAIConfig].filter(config => config.enabled),
    routing: {
      strategy: 'performance',
      costThreshold: 0.02,
      performanceThreshold: 3000
    }
  },
  smartOptimization: {
    enabled: true,
    aiClassification: true,
    autoCompression: true,
    intelligentCaching: true,
    costOptimization: true
  },
  validation: {
    strict: true,
    allowFallback: true,
    validateOnStartup: true
  }
};

// Enhanced Production Configuration
const enhancedProductionConfig: AIIntegratedStorageConfig = {
  provider: 'gcp',
  bucket: getRequiredEnvVar('PRODUCTION_STORAGE_BUCKET'),
  region: getOptionalEnvVar('PRODUCTION_STORAGE_REGION', 'us-central1'),
  encryption: true,
  compression: true,
  maxFileSize: 500 * 1024 * 1024, // 500MB
  retentionDays: 365,
  cacheTTL: 7200, // 2 hours
  aiServices: {
    primary: openAIConfig.enabled ? openAIConfig : geminiConfig,
    fallback: [claudeConfig, geminiConfig, openAIConfig].filter(config => config.enabled),
    routing: {
      strategy: 'quality',
      costThreshold: 0.05,
      performanceThreshold: 2000
    }
  },
  smartOptimization: {
    enabled: true,
    aiClassification: true,
    autoCompression: true,
    intelligentCaching: true,
    costOptimization: true
  },
  validation: {
    strict: true,
    allowFallback: false,
    validateOnStartup: true
  }
};

// Configuration validation
export const validateStorageConfig = (config: AIIntegratedStorageConfig): void => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic storage validation
  if (!config.provider) {
    errors.push('Storage provider is required');
  }

  if (config.provider !== 'local' && !config.bucket) {
    errors.push('Bucket name is required for cloud storage providers');
  }

  // AI services validation
  if (!config.aiServices.primary.enabled) {
    warnings.push('Primary AI service is not enabled');
  }

  if (config.aiServices.fallback.length === 0) {
    warnings.push('No fallback AI services configured');
  }

  // Check API keys for enabled services
  [config.aiServices.primary, ...config.aiServices.fallback].forEach(service => {
    if (service.enabled && !service.apiKey) {
      errors.push(`API key missing for ${service.provider} service`);
    }
  });

  // Report validation results
  if (errors.length > 0) {
    console.error('❌ Storage Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    if (config.validation.strict) {
      throw new Error('Invalid storage configuration');
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Storage Configuration Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
};

// Environment configurations
export const enhancedStorageConfigs = {
  development: enhancedDevelopmentConfig,
  staging: enhancedStagingConfig,
  production: enhancedProductionConfig
};

// Get current enhanced configuration
export function getEnhancedStorageConfig(): AIIntegratedStorageConfig {
  const env = process.env.NODE_ENV || 'development';
  const config = enhancedStorageConfigs[env as keyof typeof enhancedStorageConfigs] || enhancedDevelopmentConfig;
  
  // Override with specific provider if requested
  const provider = getOptionalEnvVar('STORAGE_PROVIDER');
  if (provider && ['aws', 'azure', 'gcp', 'local'].includes(provider)) {
    config.provider = provider as any;
  }

  // Validate configuration if required
  if (config.validation.validateOnStartup) {
    validateStorageConfig(config);
  }

  return config;
}

// Cost tracking utilities
export const calculateAICost = (
  provider: string,
  inputTokens: number,
  outputTokens: number,
  config: AIServiceConfig
): number => {
  return (inputTokens * config.costPerToken.input) + (outputTokens * config.costPerToken.output);
};

// AI service selection utilities
export const selectOptimalAIService = (
  configs: AIServiceConfig[],
  strategy: 'cost' | 'performance' | 'quality' | 'round-robin',
  context?: {
    estimatedTokens?: number;
    requiresVision?: boolean;
    requiresEmbedding?: boolean;
  }
): AIServiceConfig | null => {
  const availableConfigs = configs.filter(config => config.enabled);
  
  if (availableConfigs.length === 0) {
    return null;
  }

  // Filter by capabilities if specified
  let filteredConfigs = availableConfigs;
  if (context?.requiresVision) {
    filteredConfigs = filteredConfigs.filter(config => config.models.vision.length > 0);
  }
  if (context?.requiresEmbedding) {
    filteredConfigs = filteredConfigs.filter(config => config.models.embedding.length > 0);
  }

  if (filteredConfigs.length === 0) {
    return availableConfigs[0]; // Fallback to any available service
  }

  switch (strategy) {
    case 'cost':
      return filteredConfigs.reduce((cheapest, current) => 
        current.costPerToken.input < cheapest.costPerToken.input ? current : cheapest
      );
    
    case 'performance':
      // Prefer services with higher rate limits
      return filteredConfigs.reduce((fastest, current) => 
        current.rateLimits.requestsPerMinute > fastest.rateLimits.requestsPerMinute ? current : fastest
      );
    
    case 'quality':
      // Prefer OpenAI GPT-4 > Claude > Gemini for quality
      const qualityOrder = ['openai', 'anthropic', 'google'];
      return filteredConfigs.sort((a, b) => 
        qualityOrder.indexOf(a.provider) - qualityOrder.indexOf(b.provider)
      )[0];
    
    case 'round-robin':
    default:
      // Simple round-robin selection
      const index = Math.floor(Math.random() * filteredConfigs.length);
      return filteredConfigs[index];
  }
};

// Export enhanced configurations
export {
  openAIConfig,
  claudeConfig,
  geminiConfig,
  enhancedDevelopmentConfig,
  enhancedStagingConfig,
  enhancedProductionConfig
};
