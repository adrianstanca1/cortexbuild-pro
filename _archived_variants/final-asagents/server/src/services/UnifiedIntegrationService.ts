/**
 * Unified Integration Service
 * Integrates Java Backend (Port 4001), Node.js Backend (Port 5001), and Frontend
 * Provides unified routing, health checks, failover, and cross-backend communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger.js';

interface BackendConfig {
  name: string;
  baseURL: string;
  port: number;
  enabled: boolean;
  timeout: number;
  retries: number;
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  capabilities?: string[];
  details?: any;
}

interface UnifiedHealthResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    mysql: ServiceHealth;
    nodejs: ServiceHealth;
    java: ServiceHealth;
    frontend: ServiceHealth;
  };
  systemInfo: {
    environment: string;
    version: string;
    uptime: number;
  };
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class UnifiedIntegrationService {
  private javaClient!: AxiosInstance;
  private nodeClient!: AxiosInstance;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly CIRCUIT_BREAKER_RESET_TIMEOUT = 300000; // 5 minutes

  private javaConfig: BackendConfig = {
    name: 'Java Backend',
    baseURL: process.env.JAVA_BACKEND_URL || 'http://localhost:4001',
    port: 4001,
    enabled: true,
    timeout: 10000,
    retries: 3,
  };

  private nodeConfig: BackendConfig = {
    name: 'Node.js Backend',
    baseURL: process.env.NODE_BACKEND_URL || 'http://localhost:5001',
    port: 5001,
    enabled: true,
    timeout: 10000,
    retries: 3,
  };

  constructor() {
    this.initializeClients();
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize HTTP clients for backend communication
   */
  private initializeClients(): void {
    this.javaClient = axios.create({
      baseURL: this.javaConfig.baseURL,
      timeout: this.javaConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.nodeClient = axios.create({
      baseURL: this.nodeConfig.baseURL,
      timeout: this.nodeConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptors for logging
    this.javaClient.interceptors.request.use((config: any) => {
      logger.debug(`[Java Backend] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.nodeClient.interceptors.request.use((config: any) => {
      logger.debug(`[Node.js Backend] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptors for error handling
    this.javaClient.interceptors.response.use(
      (response: any) => response,
      (error: any) => this.handleBackendError('java', error)
    );

    this.nodeClient.interceptors.response.use(
      (response: any) => response,
      (error: any) => this.handleBackendError('node', error)
    );
  }

  /**
   * Initialize circuit breakers for all backends
   */
  private initializeCircuitBreakers(): void {
    this.circuitBreakers.set('java', {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
    });

    this.circuitBreakers.set('nodejs', {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
    });
  }

  /**
   * Handle backend errors with circuit breaker pattern
   */
  private handleBackendError(backend: string, error: AxiosError): Promise<never> {
    const breaker = this.circuitBreakers.get(backend);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
        breaker.state = 'open';
        logger.warn(`Circuit breaker opened for ${backend} backend after ${breaker.failures} failures`);
        
        // Auto-reset circuit breaker after timeout
        setTimeout(() => {
          breaker.state = 'half-open';
          breaker.failures = 0;
          logger.info(`Circuit breaker for ${backend} backend moved to half-open state`);
        }, this.CIRCUIT_BREAKER_RESET_TIMEOUT);
      }
    }

    logger.error({ backend, error: error.message }, 'Backend request failed');
    return Promise.reject(error);
  }

  /**
   * Check if circuit breaker allows requests
   */
  private canMakeRequest(backend: string): boolean {
    const breaker = this.circuitBreakers.get(backend);
    if (!breaker) return true;

    if (breaker.state === 'open') {
      const timeSinceFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        breaker.state = 'half-open';
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Reset circuit breaker on successful request
   */
  private resetCircuitBreaker(backend: string): void {
    const breaker = this.circuitBreakers.get(backend);
    if (breaker && breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failures = 0;
      logger.info(`Circuit breaker closed for ${backend} backend`);
    }
  }

  /**
   * Check health of Java backend
   */
  async checkJavaHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!this.canMakeRequest('java')) {
        return {
          service: 'Java Backend',
          status: 'unhealthy',
          error: 'Circuit breaker open',
        };
      }

      const response = await this.javaClient.get('/api/enhanced/health');
      const responseTime = Date.now() - startTime;
      
      this.resetCircuitBreaker('java');

      return {
        service: 'Java Backend',
        status: 'healthy',
        responseTime,
        capabilities: response.data.javaBackend?.capabilities || [],
        details: response.data,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'Java Backend',
        status: 'unhealthy',
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Check health of Node.js backend
   */
  async checkNodeHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!this.canMakeRequest('nodejs')) {
        return {
          service: 'Node.js Backend',
          status: 'unhealthy',
          error: 'Circuit breaker open',
        };
      }

      const response = await this.nodeClient.get('/api/system/health');
      const responseTime = Date.now() - startTime;
      
      this.resetCircuitBreaker('nodejs');

      return {
        service: 'Node.js Backend',
        status: 'healthy',
        responseTime,
        details: response.data,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'Node.js Backend',
        status: 'unhealthy',
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Check health of MySQL database
   */
  async checkMySQLHealth(): Promise<ServiceHealth> {
    try {
      // Check MySQL through Node.js backend
      const response = await this.nodeClient.get('/api/system/health');
      
      return {
        service: 'MySQL Database',
        status: response.data.database === 'connected' ? 'healthy' : 'unhealthy',
        details: {
          connection: response.data.database,
        },
      };
    } catch (error: any) {
      return {
        service: 'MySQL Database',
        status: 'unknown',
        error: error.message,
      };
    }
  }

  /**
   * Check health of frontend
   */
  async checkFrontendHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const response = await axios.get('http://localhost', { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'React Frontend',
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'React Frontend',
        status: 'unhealthy',
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Get unified health status of all services
   */
  async getUnifiedHealth(): Promise<UnifiedHealthResponse> {
    const [mysql, nodejs, java, frontend] = await Promise.all([
      this.checkMySQLHealth(),
      this.checkNodeHealth(),
      this.checkJavaHealth(),
      this.checkFrontendHealth(),
    ]);

    // Determine overall status
    const services = { mysql, nodejs, java, frontend };
    const statuses = Object.values(services).map(s => s.status);
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (statuses.every(s => s === 'healthy')) {
      overall = 'healthy';
    } else if (statuses.some(s => s === 'unhealthy')) {
      overall = 'unhealthy';
    } else {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      services,
      systemInfo: {
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        uptime: process.uptime(),
      },
    };
  }

  /**
   * Forward request to Java backend with retry logic
   */
  async forwardToJava<T = any>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    headers?: any
  ): Promise<T> {
    if (!this.canMakeRequest('java')) {
      throw new Error('Java backend unavailable - circuit breaker open');
    }

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.javaConfig.retries; attempt++) {
      try {
        const response = await this.javaClient.request({
          url: path,
          method,
          data,
          headers,
        });
        
        this.resetCircuitBreaker('java');
        return response.data;
      } catch (error: any) {
        lastError = error;
        logger.warn(`Java backend request failed (attempt ${attempt}/${this.javaConfig.retries}): ${error.message}`);
        
        if (attempt < this.javaConfig.retries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Java backend request failed after retries');
  }

  /**
   * Forward request to Node.js backend with retry logic
   */
  async forwardToNode<T = any>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    headers?: any
  ): Promise<T> {
    if (!this.canMakeRequest('nodejs')) {
      throw new Error('Node.js backend unavailable - circuit breaker open');
    }

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.nodeConfig.retries; attempt++) {
      try {
        const response = await this.nodeClient.request({
          url: path,
          method,
          data,
          headers,
        });
        
        this.resetCircuitBreaker('nodejs');
        return response.data;
      } catch (error: any) {
        lastError = error;
        logger.warn(`Node.js backend request failed (attempt ${attempt}/${this.nodeConfig.retries}): ${error.message}`);
        
        if (attempt < this.nodeConfig.retries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Node.js backend request failed after retries');
  }

  /**
   * Route request to appropriate backend based on capabilities
   * Java backend: Analytics, Compliance, Reporting, Enterprise features
   * Node.js backend: CRUD operations, Real-time, Documents, Auth
   */
  async routeRequest<T = any>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    headers?: any
  ): Promise<T> {
    // Determine which backend to use based on path
    const javaRoutes = [
      '/api/enhanced/',
      '/api/multimodal/',
      '/api/analytics/',
      '/api/reporting/',
      '/api/compliance/',
    ];

    const shouldUseJava = javaRoutes.some(route => path.startsWith(route));

    try {
      if (shouldUseJava) {
        return await this.forwardToJava<T>(path, method, data, headers);
      } else {
        return await this.forwardToNode<T>(path, method, data, headers);
      }
    } catch (error: any) {
      logger.error({ path, method, error: error.message }, 'Primary backend failed, attempting fallback');
      
      // Attempt fallback to other backend
      if (shouldUseJava) {
        logger.warn('Falling back to Node.js backend');
        return await this.forwardToNode<T>(path, method, data, headers);
      } else {
        logger.warn('Falling back to Java backend');
        return await this.forwardToJava<T>(path, method, data, headers);
      }
    }
  }

  /**
   * Aggregate data from both backends
   */
  async aggregateData<T = any>(
    javaPath: string,
    nodePath: string,
    merger?: (javaData: any, nodeData: any) => T
  ): Promise<T> {
    const [javaData, nodeData] = await Promise.allSettled([
      this.forwardToJava(javaPath),
      this.forwardToNode(nodePath),
    ]);

    const javaResult = javaData.status === 'fulfilled' ? javaData.value : null;
    const nodeResult = nodeData.status === 'fulfilled' ? nodeData.value : null;

    if (merger) {
      return merger(javaResult, nodeResult);
    }

    return {
      java: javaResult,
      node: nodeResult,
    } as T;
  }

  /**
   * Broadcast request to both backends
   */
  async broadcast(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data?: any
  ): Promise<{ java: any; node: any }> {
    const [javaResult, nodeResult] = await Promise.allSettled([
      this.forwardToJava(path, method, data),
      this.forwardToNode(path, method, data),
    ]);

    return {
      java: javaResult.status === 'fulfilled' ? javaResult.value : { error: (javaResult as PromiseRejectedResult).reason?.message },
      node: nodeResult.status === 'fulfilled' ? nodeResult.value : { error: (nodeResult as PromiseRejectedResult).reason?.message },
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      java: this.circuitBreakers.get('java'),
      nodejs: this.circuitBreakers.get('nodejs'),
    };
  }

  /**
   * Manually reset circuit breaker
   */
  manualResetCircuitBreaker(backend: 'java' | 'nodejs'): void {
    const breaker = this.circuitBreakers.get(backend);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failures = 0;
      breaker.lastFailureTime = 0;
      logger.info(`Circuit breaker manually reset for ${backend} backend`);
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get backend configurations
   */
  getConfigurations() {
    return {
      java: this.javaConfig,
      node: this.nodeConfig,
    };
  }
}

// Export singleton instance
export const unifiedIntegration = new UnifiedIntegrationService();
