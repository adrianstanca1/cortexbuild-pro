/**
 * Uptime Monitoring
 * External and internal uptime checks
 */

import https from 'https';
import http from 'http';

export interface UptimeCheck {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  interval: number;
  timeout: number;
  expectedStatus?: number;
  expectedBody?: string | RegExp;
  headers?: Record<string, string>;
}

export interface UptimeResult {
  check: string;
  timestamp: string;
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  body?: string;
}

export interface UptimeStats {
  check: string;
  period: string;
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  lastCheck?: UptimeResult;
}

class UptimeMonitor {
  private checks: Map<string, UptimeCheck> = new Map();
  private results: Map<string, UptimeResult[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register uptime check
   */
  registerCheck(check: UptimeCheck): void {
    this.checks.set(check.name, check);
    this.results.set(check.name, []);
    this.startMonitoring(check);
  }

  /**
   * Start monitoring a check
   */
  private startMonitoring(check: UptimeCheck): void {
    const interval = setInterval(async () => {
      const result = await this.executeCheck(check);
      this.recordResult(check.name, result);
    }, check.interval);

    this.intervals.set(check.name, interval);
    
    // Run initial check
    this.executeCheck(check).then(result => {
      this.recordResult(check.name, result);
    });
  }

  /**
   * Execute single check
   */
  private executeCheck(check: UptimeCheck): Promise<UptimeResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = check.url.startsWith('https') ? https : http;
      
      const req = protocol.request(check.url, {
        method: check.method,
        headers: check.headers,
        timeout: check.timeout,
      }, (res) => {
        const responseTime = Date.now() - startTime;
        let body = '';
        
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const success = check.expectedStatus 
            ? res.statusCode === check.expectedStatus
            : res.statusCode >= 200 && res.statusCode < 400;
          
          const bodyMatch = check.expectedBody 
            ? typeof check.expectedBody === 'string'
              ? body.includes(check.expectedBody)
              : check.expectedBody.test(body)
            : true;
          
          resolve({
            check: check.name,
            timestamp: new Date().toISOString(),
            success: success && bodyMatch,
            statusCode: res.statusCode,
            responseTime,
            body: body.slice(0, 1000),
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          check: check.name,
          timestamp: new Date().toISOString(),
          success: false,
          responseTime: Date.now() - startTime,
          error: error.message,
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          check: check.name,
          timestamp: new Date().toISOString(),
          success: false,
          responseTime: Date.now() - startTime,
          error: 'Request timeout',
        });
      });
      
      req.end();
    });
  }

  /**
   * Record check result
   */
  private recordResult(checkName: string, result: UptimeResult): void {
    const results = this.results.get(checkName) || [];
    results.push(result);
    
    // Keep last 1000 results
    if (results.length > 1000) results.shift();
    this.results.set(checkName, results);
  }

  /**
   * Get uptime statistics
   */
  getStats(checkName: string, hours = 24): UptimeStats {
    const results = this.results.get(checkName) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const periodResults = results.filter(r => new Date(r.timestamp).getTime() > cutoff);
    
    const total = periodResults.length;
    const successful = periodResults.filter(r => r.success).length;
    const failed = total - successful;
    const uptime = total > 0 ? (successful / total) * 100 : 0;
    
    const responseTimes = periodResults
      .filter(r => r.responseTime)
      .map(r => r.responseTime);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p95ResponseTime = sorted[p95Index] || 0;
    
    const lastCheck = results[results.length - 1];
    
    return {
      check: checkName,
      period: `${hours}h`,
      uptime,
      totalChecks: total,
      successfulChecks: successful,
      failedChecks: failed,
      avgResponseTime,
      p95ResponseTime,
      lastCheck,
    };
  }

  /**
   * Get all stats
   */
  getAllStats(hours = 24): UptimeStats[] {
    return Array.from(this.checks.keys()).map(name => this.getStats(name, hours));
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(checkName: string): void {
    const interval = this.intervals.get(checkName);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(checkName);
    }
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

/**
 * Create uptime monitor
 */
export function createUptimeMonitor(): UptimeMonitor {
  return new UptimeMonitor();
}

/**
 * Default production checks
 */
export function setupProductionChecks(monitor: UptimeMonitor): void {
  // API health
  monitor.registerCheck({
    name: 'API Health',
    url: 'http://localhost:3001/api/health',
    method: 'GET',
    interval: 30000, // 30 seconds
    timeout: 5000,
    expectedStatus: 200,
  });
  
  // Extended health
  monitor.registerCheck({
    name: 'API Extended Health',
    url: 'http://localhost:3001/api/health/extended',
    method: 'GET',
    interval: 60000, // 1 minute
    timeout: 10000,
    expectedStatus: 200,
  });
  
  // Readiness probe
  monitor.registerCheck({
    name: 'API Readiness',
    url: 'http://localhost:3001/api/ready',
    method: 'GET',
    interval: 10000, // 10 seconds
    timeout: 5000,
    expectedStatus: 200,
  });
  
  // Liveness probe
  monitor.registerCheck({
    name: 'API Liveness',
    url: 'http://localhost:3001/api/live',
    method: 'GET',
    interval: 10000, // 10 seconds
    timeout: 5000,
    expectedStatus: 200,
  });
  
  // Frontend
  monitor.registerCheck({
    name: 'Frontend',
    url: 'http://localhost:3002',
    method: 'HEAD',
    interval: 30000,
    timeout: 5000,
    expectedStatus: 200,
  });
  
  // Metrics endpoint
  monitor.registerCheck({
    name: 'Metrics Endpoint',
    url: 'http://localhost:3001/api/metrics',
    method: 'GET',
    interval: 60000,
    timeout: 5000,
    expectedStatus: 200,
  });
}

/**
 * Express route for uptime stats
 */
export function uptimeStatsHandler(monitor: UptimeMonitor) {
  return (req: any, res: any): void => {
    const hours = parseInt(req.query.hours) || 24;
    const stats = monitor.getAllStats(hours);
    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  };
}
