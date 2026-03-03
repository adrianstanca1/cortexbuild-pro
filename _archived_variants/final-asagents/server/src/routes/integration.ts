/**
 * Unified Integration Routes
 * Provides endpoints for cross-backend communication, health checks, and API gateway
 */

import express from 'express';
import { unifiedIntegration } from '../services/UnifiedIntegrationService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/integration/health/unified
 * Comprehensive health check across all services
 */
router.get('/health/unified', async (req, res) => {
  try {
    const health = await unifiedIntegration.getUnifiedHealth();
    
    const statusCode = health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 207 : 503;
    
    res.status(statusCode).json({
      success: health.overall !== 'unhealthy',
      data: health,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get unified health status');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health status',
      message: error.message,
    });
  }
});

/**
 * GET /api/integration/status
 * Get integration service status including circuit breakers
 */
router.get('/status', (req, res) => {
  try {
    const circuitBreakers = unifiedIntegration.getCircuitBreakerStatus();
    const configs = unifiedIntegration.getConfigurations();

    res.json({
      success: true,
      data: {
        circuitBreakers,
        configurations: configs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get integration status');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve integration status',
      message: error.message,
    });
  }
});

/**
 * POST /api/integration/circuit-breaker/reset
 * Manually reset circuit breaker for a backend
 */
router.post('/circuit-breaker/reset', (req, res) => {
  try {
    const { backend } = req.body;

    if (!backend || !['java', 'nodejs'].includes(backend)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backend. Must be "java" or "nodejs"',
      });
    }

    unifiedIntegration.manualResetCircuitBreaker(backend as 'java' | 'nodejs');

    res.json({
      success: true,
      message: `Circuit breaker reset for ${backend} backend`,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to reset circuit breaker');
    res.status(500).json({
      success: false,
      error: 'Failed to reset circuit breaker',
      message: error.message,
    });
  }
});

/**
 * POST /api/integration/route
 * Route request to appropriate backend with automatic failover
 */
router.all('/route/*', async (req, res) => {
  try {
    const path = req.originalUrl.replace('/api/integration/route', '');
    const method = req.method as 'GET' | 'POST' | 'PUT' | 'DELETE';
    const data = req.body;
    const headers = req.headers;

    logger.info(`Routing request: ${method} ${path}`);

    const result = await unifiedIntegration.routeRequest(
      path,
      method,
      data,
      headers
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to route request');
    res.status(500).json({
      success: false,
      error: 'Failed to route request',
      message: error.message,
    });
  }
});

/**
 * POST /api/integration/aggregate
 * Aggregate data from both backends
 */
router.post('/aggregate', async (req, res) => {
  try {
    const { javaPath, nodePath } = req.body;

    if (!javaPath || !nodePath) {
      return res.status(400).json({
        success: false,
        error: 'Both javaPath and nodePath are required',
      });
    }

    const result = await unifiedIntegration.aggregateData(javaPath, nodePath);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to aggregate data');
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate data',
      message: error.message,
    });
  }
});

/**
 * POST /api/integration/broadcast
 * Broadcast request to both backends
 */
router.post('/broadcast', async (req, res) => {
  try {
    const { path, method, data } = req.body;

    if (!path || !method) {
      return res.status(400).json({
        success: false,
        error: 'Path and method are required',
      });
    }

    if (!['POST', 'PUT', 'DELETE'].includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Method must be POST, PUT, or DELETE',
      });
    }

    const result = await unifiedIntegration.broadcast(path, method, data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to broadcast request');
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast request',
      message: error.message,
    });
  }
});

/**
 * GET /api/integration/java/*
 * Forward request to Java backend
 */
router.all('/java/*', async (req, res) => {
  try {
    const path = req.originalUrl.replace('/api/integration/java', '');
    const method = req.method as 'GET' | 'POST' | 'PUT' | 'DELETE';
    const data = req.body;
    const headers = req.headers;

    logger.info(`Forwarding to Java: ${method} ${path}`);

    const result = await unifiedIntegration.forwardToJava(
      path,
      method,
      data,
      headers
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to forward to Java backend');
    res.status(500).json({
      success: false,
      error: 'Failed to forward to Java backend',
      message: error.message,
    });
  }
});

/**
 * GET /api/integration/node/*
 * Forward request to Node.js backend (useful for external access)
 */
router.all('/node/*', async (req, res) => {
  try {
    const path = req.originalUrl.replace('/api/integration/node', '');
    const method = req.method as 'GET' | 'POST' | 'PUT' | 'DELETE';
    const data = req.body;
    const headers = req.headers;

    logger.info(`Forwarding to Node.js: ${method} ${path}`);

    const result = await unifiedIntegration.forwardToNode(
      path,
      method,
      data,
      headers
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to forward to Node.js backend');
    res.status(500).json({
      success: false,
      error: 'Failed to forward to Node.js backend',
      message: error.message,
    });
  }
});

export default router;
