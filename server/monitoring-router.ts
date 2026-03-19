/**
 * Monitoring Router
 * Express routes for health, metrics, and status
 */

import { Router } from 'express';
import {
  basicHealth,
  extendedHealth,
  readinessProbe,
  livenessProbe,
} from './health.js';
import {
  getPrometheusMetrics,
  getMetricsJSON,
  metricsMiddleware,
} from './metrics.js';
import {
  uptimeStatsHandler,
  createUptimeMonitor,
  setupProductionChecks,
} from './uptime.js';
import {
  statusPageHandler,
  createStatusData,
  getDefaultServices,
} from './status-page.js';
import { loggingMiddleware, createLogger } from './logger.js';

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableUptime: boolean;
  enableStatusPage: boolean;
  prettyPrint: boolean;
}

/**
 * Create monitoring router
 */
export function createMonitoringRouter(config: MonitoringConfig = {
  enableMetrics: true,
  enableUptime: true,
  enableStatusPage: true,
  prettyPrint: process.env.NODE_ENV !== 'production',
}): Router {
  const router = Router();
  
  // Apply logging middleware
  const logger = createLogger('monitoring', {
    prettyPrint: config.prettyPrint,
  });
  router.use(loggingMiddleware(logger));

  // Apply metrics middleware
  if (config.enableMetrics) {
    router.use(metricsMiddleware);
  }

  // Health endpoints
  router.get('/api/health', basicHealth);
  router.get('/api/health/extended', extendedHealth);
  router.get('/api/ready', readinessProbe);
  router.get('/api/live', livenessProbe);

  // Metrics endpoints
  if (config.enableMetrics) {
    router.get('/api/metrics', getPrometheusMetrics);
    router.get('/api/metrics/json', getMetricsJSON);
  }

  // Uptime stats
  if (config.enableUptime) {
    const monitor = createUptimeMonitor();
    setupProductionChecks(monitor);
    router.get('/api/uptime', uptimeStatsHandler(monitor));
  }

  // Status page
  if (config.enableStatusPage) {
    router.get('/api/status', statusPageHandler(() => {
      return createStatusData(getDefaultServices());
    }));
    
    // HTML status page
    router.get('/status', statusPageHandler(() => {
      return createStatusData(getDefaultServices());
    }));
  }

  return router;
}

/**
 * Get all monitoring endpoints
 */
export function getMonitoringEndpoints(): string[] {
  return [
    'GET /api/health - Basic health check',
    'GET /api/health/extended - Extended health with DB, Redis, S3',
    'GET /api/ready - Readiness probe',
    'GET /api/live - Liveness probe',
    'GET /api/metrics - Prometheus metrics',
    'GET /api/metrics/json - JSON metrics',
    'GET /api/uptime - Uptime statistics',
    'GET /api/status - Status page JSON',
    'GET /status - Status page HTML',
  ];
}
