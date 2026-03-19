/**
 * Prometheus Metrics
 * Production monitoring metrics for SRE observability
 */

import { Request, Response } from 'express';
import { pool } from '../database.js';
import { redisClient } from '../config/redis.js';

// Metric storage
interface MetricLabels {
  [key: string]: string;
}

interface MetricData {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  values: Array<{
    value: number;
    labels?: MetricLabels;
    timestamp?: number;
  }>;
}

class MetricsRegistry {
  private metrics: Map<string, MetricData> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private requestLatencies: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private dbLatencies: number[] = [];
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  /**
   * Record HTTP request
   */
  recordRequest(method: string, path: string, status: string, latencyMs: number): void {
    const key = `${method}:${path}:${status}`;
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);
    
    // Store latency for percentile calculation
    const latencies = this.requestLatencies.get(key) || [];
    latencies.push(latencyMs);
    if (latencies.length > 1000) latencies.shift(); // Keep last 1000
    this.requestLatencies.set(key, latencies);
  }

  /**
   * Record error
   */
  recordError(method: string, path: string, statusCode: string): void {
    const key = `${method}:${path}:${statusCode}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  /**
   * Record database query latency
   */
  recordDBLatency(latencyMs: number): void {
    this.dbLatencies.push(latencyMs);
    if (this.dbLatencies.length > 1000) this.dbLatencies.shift();
  }

  /**
   * Record cache operation
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get CPU usage
   */
  private getCPUUsage(): { user: number; system: number } {
    const usage = process.cpuUsage();
    return {
      user: usage.user,
      system: usage.system,
    };
  }

  /**
   * Generate Prometheus format metrics
   */
  async getMetrics(): Promise<string> {
    let output = '';
    
    // Request rate (RPS)
    output += '# HELP http_requests_total Total HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [key, value] of this.requestCounts.entries()) {
      const [method, path, status] = key.split(':');
      output += `http_requests_total{method="${method}",path="${path}",status="${status}"} ${value}\n`;
    }
    
    // Response latency percentiles
    output += '# HELP http_request_duration_seconds HTTP request latency in seconds\n';
    output += '# TYPE http_request_duration_seconds summary\n';
    for (const [key, latencies] of this.requestLatencies.entries()) {
      const [method, path, status] = key.split(':');
      const p50 = this.percentile(latencies, 50) / 1000;
      const p95 = this.percentile(latencies, 95) / 1000;
      const p99 = this.percentile(latencies, 99) / 1000;
      output += `http_request_duration_seconds{method="${method}",path="${path}",status="${status}",quantile="0.5"} ${p50}\n`;
      output += `http_request_duration_seconds{method="${method}",path="${path}",status="${status}",quantile="0.95"} ${p95}\n`;
      output += `http_request_duration_seconds{method="${method}",path="${path}",status="${status}",quantile="0.99"} ${p99}\n`;
    }
    
    // Error rate
    output += '# HELP http_errors_total Total HTTP errors\n';
    output += '# TYPE http_errors_total counter\n';
    for (const [key, value] of this.errorCounts.entries()) {
      const [method, path, status] = key.split(':');
      output += `http_errors_total{method="${method}",path="${path}",status="${status}"} ${value}\n`;
    }
    
    // Database query latency
    output += '# HELP db_query_duration_seconds Database query latency in seconds\n';
    output += '# TYPE db_query_duration_seconds summary\n';
    const dbP50 = this.percentile(this.dbLatencies, 50) / 1000;
    const dbP95 = this.percentile(this.dbLatencies, 95) / 1000;
    const dbP99 = this.percentile(this.dbLatencies, 99) / 1000;
    output += `db_query_duration_seconds{quantile="0.5"} ${dbP50}\n`;
    output += `db_query_duration_seconds{quantile="0.95"} ${dbP95}\n`;
    output += `db_query_duration_seconds{quantile="0.99"} ${dbP99}\n`;
    
    // Cache hit rate
    const cacheTotal = this.cacheHits + this.cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? this.cacheHits / cacheTotal : 0;
    output += '# HELP cache_hit_ratio Cache hit ratio\n';
    output += '# TYPE cache_hit_ratio gauge\n';
    output += `cache_hit_ratio ${cacheHitRate}\n`;
    output += '# HELP cache_hits_total Total cache hits\n';
    output += '# TYPE cache_hits_total counter\n';
    output += `cache_hits_total ${this.cacheHits}\n`;
    output += '# HELP cache_misses_total Total cache misses\n';
    output += '# TYPE cache_misses_total counter\n';
    output += `cache_misses_total ${this.cacheMisses}\n`;
    
    // Memory usage
    const memory = this.getMemoryUsage();
    output += '# HELP process_resident_memory_bytes Resident memory size in bytes\n';
    output += '# TYPE process_resident_memory_bytes gauge\n';
    output += `process_resident_memory_bytes ${memory.rss}\n`;
    output += '# HELP process_heap_bytes Process heap size in bytes\n';
    output += '# TYPE process_heap_bytes gauge\n';
    output += `process_heap_bytes ${memory.heapUsed}\n`;
    output += '# HELP process_heap_total_bytes Process heap total in bytes\n';
    output += '# TYPE process_heap_total_bytes gauge\n';
    output += `process_heap_total_bytes ${memory.heapTotal}\n`;
    
    // CPU usage
    const cpu = this.getCPUUsage();
    output += '# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds\n';
    output += '# TYPE process_cpu_seconds_total counter\n';
    output += `process_cpu_seconds_total ${(cpu.user + cpu.system) / 1000000}\n`;
    
    // Queue depth (if available)
    output += '# HELP queue_depth Current queue depth\n';
    output += '# TYPE queue_depth gauge\n';
    output += `queue_depth 0\n`; // Placeholder - integrate with actual queue
    
    // Uptime
    output += '# HELP process_start_time_seconds Start time of the process since unix epoch in seconds\n';
    output += '# TYPE process_start_time_seconds gauge\n';
    output += `process_start_time_seconds ${Math.floor(Date.now() / 1000 - Math.floor(process.uptime()))}\n`;
    
    // Node.js version
    output += '# HELP nodejs_version_info Node.js version info\n';
    output += '# TYPE nodejs_version_info gauge\n';
    output += `nodejs_version_info{version="${process.version}"} 1\n`;
    
    return output;
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJSON(): Promise<Record<string, unknown>> {
    const memory = this.getMemoryUsage();
    const cpu = this.getCPUUsage();
    const cacheTotal = this.cacheHits + this.cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? this.cacheHits / cacheTotal : 0;
    
    return {
      timestamp: new Date().toISOString(),
      http: {
        totalRequests: Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0),
        totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
      },
      latency: {
        p50: this.percentile(Array.from(this.requestLatencies.values()).flat(), 50),
        p95: this.percentile(Array.from(this.requestLatencies.values()).flat(), 95),
        p99: this.percentile(Array.from(this.requestLatencies.values()).flat(), 99),
      },
      database: {
        queryLatencyP50: this.percentile(this.dbLatencies, 50),
        queryLatencyP95: this.percentile(this.dbLatencies, 95),
        queryLatencyP99: this.percentile(this.dbLatencies, 99),
      },
      cache: {
        hitRate: cacheHitRate,
        hits: this.cacheHits,
        misses: this.cacheMisses,
      },
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
      },
      cpu: {
        user: cpu.user,
        system: cpu.system,
      },
      uptime: process.uptime(),
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.requestCounts.clear();
    this.requestLatencies.clear();
    this.errorCounts.clear();
    this.dbLatencies = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// Singleton instance
export const metricsRegistry = new MetricsRegistry();

/**
 * GET /api/metrics - Prometheus format metrics
 */
export async function getPrometheusMetrics(req: Request, res: Response): Promise<void> {
  const metrics = await metricsRegistry.getMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
}

/**
 * GET /api/metrics/json - JSON format metrics
 */
export async function getMetricsJSON(req: Request, res: Response): Promise<void> {
  const metrics = await metricsRegistry.getMetricsJSON();
  res.json(metrics);
}

/**
 * Middleware to record request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: () => void): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode.toString();
    
    metricsRegistry.recordRequest(req.method, req.route?.path || req.path, statusCode, duration);
    
    // Record errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      metricsRegistry.recordError(req.method, req.route?.path || req.path, statusCode);
    }
  });
  
  next();
}
