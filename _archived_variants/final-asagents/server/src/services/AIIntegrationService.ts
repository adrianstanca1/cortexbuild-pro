/**
 * AI Integration Service
 * Coordinates AI operations across Java and Node.js backends
 * Integrates Gemini AI, provides caching, and manages AI contexts
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

interface AIRequest {
  prompt: string;
  context?: any;
  modelType?: 'gemini' | 'multimodal' | 'enterprise';
  options?: {
    temperature?: number;
    maxTokens?: number;
    cache?: boolean;
  };
}

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
  backend?: 'java' | 'nodejs';
  processingTime?: number;
}

interface AICache {
  request: string;
  response: any;
  timestamp: number;
  expiresAt: number;
}

export class AIIntegrationService {
  private cache: Map<string, AICache> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly MAX_CACHE_SIZE = 100;

  private javaClient: AxiosInstance;
  private nodeClient: AxiosInstance;

  constructor() {
    this.javaClient = axios.create({
      baseURL: process.env.JAVA_BACKEND_URL || 'http://localhost:4001',
      timeout: 30000, // AI operations may take longer
      headers: { 'Content-Type': 'application/json' },
    });

    this.nodeClient = axios.create({
      baseURL: process.env.NODE_BACKEND_URL || 'http://localhost:5001',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Process AI request with intelligent routing
   * Java backend: Enterprise analysis, compliance, reporting
   * Node.js backend: Gemini AI, multimodal processing
   */
  async processAIRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Check cache first
    if (request.options?.cache !== false) {
      const cached = this.getCached(request);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          processingTime: Date.now() - startTime,
        };
      }
    }

    try {
      let result: any;
      let backend: 'java' | 'nodejs';

      // Route based on model type
      if (request.modelType === 'enterprise') {
        // Java backend for enterprise features
        result = await this.processWithJava(request);
        backend = 'java';
      } else {
        // Node.js backend for Gemini AI and multimodal
        result = await this.processWithNodeJS(request);
        backend = 'nodejs';
      }

      const response: AIResponse = {
        success: true,
        data: result,
        backend,
        processingTime: Date.now() - startTime,
        cached: false,
      };

      // Cache the result
      if (request.options?.cache !== false) {
        this.cacheResult(request, result);
      }

      return response;

    } catch (error: any) {
      logger.error({ error }, 'AI request processing failed');
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Process request with Java backend (enterprise AI features)
   */
  private async processWithJava(request: AIRequest): Promise<any> {
    try {
      const response = await this.javaClient.post('/api/enhanced/ai/process', {
        prompt: request.prompt,
        context: request.context,
        options: request.options,
      });
      return response.data;
    } catch (error: any) {
      logger.warn('Java AI processing failed, falling back to Node.js');
      return this.processWithNodeJS(request);
    }
  }

  /**
   * Process request with Node.js backend (Gemini AI)
   */
  private async processWithNodeJS(request: AIRequest): Promise<any> {
    try {
      const response = await this.nodeClient.post('/api/ai/gemini', {
        prompt: request.prompt,
        context: request.context,
        options: request.options,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Node.js AI processing failed: ${error.message}`);
    }
  }

  /**
   * Process multimodal content (images, documents, videos)
   * Always routes to Java backend with multimodal capabilities
   */
  async processMultimodal(
    file: Buffer | string,
    fileType: string,
    analysisType: 'full' | 'quick' | 'custom',
    customOptions?: any
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.javaClient.post(
        '/api/multimodal/upload',
        {
          file: file.toString('base64'),
          fileType,
          analysisType,
          options: customOptions,
        },
        { timeout: 60000 } // Longer timeout for multimodal processing
      );

      return {
        success: true,
        data: response.data,
        backend: 'java',
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      logger.error({ error }, 'Multimodal processing failed');
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate construction-specific insights
   * Aggregates data from both backends
   */
  async generateConstructionInsights(projectData: any): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Get insights from both backends in parallel
      const [javaInsights, nodeInsights] = await Promise.allSettled([
        this.javaClient.post('/api/enhanced/ai/construction-analysis', projectData),
        this.nodeClient.post('/api/ai/construction-insights', projectData),
      ]);

      const aggregated: any = {
        enterprise: javaInsights.status === 'fulfilled' ? javaInsights.value.data : null,
        ai: nodeInsights.status === 'fulfilled' ? nodeInsights.value.data : null,
      };

      return {
        success: true,
        data: aggregated,
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze document with AI (blueprints, contracts, reports)
   */
  async analyzeDocument(
    documentContent: string | Buffer,
    documentType: 'blueprint' | 'contract' | 'report' | 'invoice' | 'other',
    extractionRules?: string[]
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Use Java backend for document analysis (better OCR and processing)
      const response = await this.javaClient.post('/api/multimodal/analyze-document', {
        content: documentContent.toString('base64'),
        documentType,
        extractionRules,
      });

      return {
        success: true,
        data: response.data,
        backend: 'java',
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      logger.error({ error }, 'Document analysis failed');
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get AI-powered recommendations
   */
  async getRecommendations(
    category: 'safety' | 'cost' | 'timeline' | 'resources',
    context: any
  ): Promise<AIResponse> {
    const request: AIRequest = {
      prompt: `Generate ${category} recommendations based on the provided context`,
      context,
      modelType: 'gemini',
      options: { temperature: 0.7, cache: true },
    };

    return this.processAIRequest(request);
  }

  /**
   * Predict project outcomes using AI
   */
  async predictOutcomes(projectData: any): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Use Java backend for enterprise prediction models
      const response = await this.javaClient.post('/api/enhanced/ai/predict', projectData);

      return {
        success: true,
        data: response.data,
        backend: 'java',
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      logger.warn('Java prediction failed, trying Node.js fallback');
      
      // Fallback to Node.js Gemini AI
      const request: AIRequest = {
        prompt: `Predict project outcomes based on the following data: ${JSON.stringify(projectData)}`,
        modelType: 'gemini',
        options: { temperature: 0.5 },
      };

      return this.processAIRequest(request);
    }
  }

  /**
   * Generate reports with AI assistance
   */
  async generateReport(
    reportType: 'progress' | 'financial' | 'safety' | 'custom',
    data: any,
    template?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.javaClient.post('/api/enhanced/ai/generate-report', {
        reportType,
        data,
        template,
      });

      return {
        success: true,
        data: response.data,
        backend: 'java',
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Cache management
   */
  private getCacheKey(request: AIRequest): string {
    return JSON.stringify({
      prompt: request.prompt,
      context: request.context,
      modelType: request.modelType,
    });
  }

  private getCached(request: AIRequest): any | null {
    const key = this.getCacheKey(request);
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('AI response retrieved from cache');
      return cached.response;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  private cacheResult(request: AIRequest, response: any): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    const key = this.getCacheKey(request);
    const now = Date.now();
    
    this.cache.set(key, {
      request: key,
      response,
      timestamp: now,
      expiresAt: now + this.CACHE_TTL,
    });

    logger.debug('AI response cached');
  }

  /**
   * Clear AI cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('AI cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const valid = entries.filter(e => e.expiresAt > now).length;

    return {
      total: this.cache.size,
      valid,
      expired: this.cache.size - valid,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL,
    };
  }
}

// Export singleton instance
export const aiIntegration = new AIIntegrationService();
