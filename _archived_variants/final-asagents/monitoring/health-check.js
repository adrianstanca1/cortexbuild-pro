#!/usr/bin/env node

/**
 * ASAgents Platform - Production Health Check Script
 * Monitors system health and sends alerts when issues are detected
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  services: [
    {
      name: 'Frontend',
      url: 'http://localhost:80/health',
      timeout: 5000,
      critical: true,
    },
    {
      name: 'Backend API',
      url: 'http://localhost:3001/api/health',
      timeout: 5000,
      critical: true,
    },
    {
      name: 'Database',
      check: 'docker exec asagents-platform_database_1 mysqladmin ping -h localhost',
      timeout: 5000,
      critical: true,
    },
    {
      name: 'Redis',
      check: 'docker exec asagents-platform_redis_1 redis-cli ping',
      timeout: 5000,
      critical: true,
    },
    {
      name: 'Prometheus',
      url: 'http://localhost:9090/-/healthy',
      timeout: 5000,
      critical: false,
    },
    {
      name: 'Grafana',
      url: 'http://localhost:3000/api/health',
      timeout: 5000,
      critical: false,
    },
  ],
  alerts: {
    webhook: process.env.SLACK_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    retryAttempts: 3,
    retryDelay: 30000, // 30 seconds
  },
  logging: {
    file: './logs/health-check.log',
    level: 'info',
  },
  thresholds: {
    cpu: 80, // CPU usage percentage
    memory: 85, // Memory usage percentage
    disk: 90, // Disk usage percentage
    responseTime: 5000, // Response time in milliseconds
  },
};

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to file
    fs.appendFileSync(this.logFile, logLine);
    
    // Write to console
    const colorMap = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      success: '\x1b[32m',
    };
    
    const color = colorMap[level] || '\x1b[0m';
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}\x1b[0m`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message, data) { this.log('error', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  info(message, data) { this.log('info', message, data); }
  success(message, data) { this.log('success', message, data); }
}

// Health checker class
class HealthChecker {
  constructor(config) {
    this.config = config;
    this.logger = new Logger(config.logging.file);
    this.failureCount = new Map();
  }

  // Check HTTP/HTTPS endpoint
  async checkHttpEndpoint(service) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(service.url);
      const client = url.protocol === 'https:' ? https : http;
      
      const request = client.get(service.url, {
        timeout: service.timeout,
      }, (response) => {
        const responseTime = Date.now() - startTime;
        const isHealthy = response.statusCode >= 200 && response.statusCode < 400;
        
        resolve({
          healthy: isHealthy,
          responseTime,
          statusCode: response.statusCode,
          error: null,
        });
      });

      request.on('error', (error) => {
        resolve({
          healthy: false,
          responseTime: Date.now() - startTime,
          statusCode: null,
          error: error.message,
        });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({
          healthy: false,
          responseTime: Date.now() - startTime,
          statusCode: null,
          error: 'Request timeout',
        });
      });
    });
  }

  // Check command execution
  async checkCommand(service) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      exec(service.check, { timeout: service.timeout }, (error, stdout, stderr) => {
        const responseTime = Date.now() - startTime;
        
        if (error) {
          resolve({
            healthy: false,
            responseTime,
            error: error.message,
            stdout,
            stderr,
          });
        } else {
          resolve({
            healthy: true,
            responseTime,
            error: null,
            stdout,
            stderr,
          });
        }
      });
    });
  }

  // Check system resources
  async checkSystemResources() {
    const results = {};

    try {
      // CPU usage
      const cpuUsage = await this.getCpuUsage();
      results.cpu = {
        usage: cpuUsage,
        healthy: cpuUsage < this.config.thresholds.cpu,
        threshold: this.config.thresholds.cpu,
      };

      // Memory usage
      const memoryUsage = await this.getMemoryUsage();
      results.memory = {
        usage: memoryUsage,
        healthy: memoryUsage < this.config.thresholds.memory,
        threshold: this.config.thresholds.memory,
      };

      // Disk usage
      const diskUsage = await this.getDiskUsage();
      results.disk = {
        usage: diskUsage,
        healthy: diskUsage < this.config.thresholds.disk,
        threshold: this.config.thresholds.disk,
      };

    } catch (error) {
      this.logger.error('Failed to check system resources', { error: error.message });
    }

    return results;
  }

  // Get CPU usage percentage
  getCpuUsage() {
    return new Promise((resolve, reject) => {
      exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F'%' '{print $1}'", (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseFloat(stdout.trim()));
        }
      });
    });
  }

  // Get memory usage percentage
  getMemoryUsage() {
    return new Promise((resolve, reject) => {
      exec("free | grep Mem | awk '{printf \"%.2f\", $3/$2 * 100.0}'", (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseFloat(stdout.trim()));
        }
      });
    });
  }

  // Get disk usage percentage
  getDiskUsage() {
    return new Promise((resolve, reject) => {
      exec("df -h / | awk 'NR==2 {print $5}' | sed 's/%//'", (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseFloat(stdout.trim()));
        }
      });
    });
  }

  // Send alert notification
  async sendAlert(service, result, attempt = 1) {
    const message = `🚨 ALERT: ${service.name} is unhealthy!\n` +
                   `Error: ${result.error}\n` +
                   `Response Time: ${result.responseTime}ms\n` +
                   `Attempt: ${attempt}/${this.config.alerts.retryAttempts}\n` +
                   `Time: ${new Date().toISOString()}`;

    try {
      // Send Slack notification
      if (this.config.alerts.webhook) {
        await this.sendSlackAlert(message);
      }

      // Send email notification (if configured)
      if (this.config.alerts.email) {
        await this.sendEmailAlert(service.name, message);
      }

      this.logger.info('Alert sent successfully', { service: service.name, attempt });
    } catch (error) {
      this.logger.error('Failed to send alert', { 
        service: service.name, 
        error: error.message 
      });
    }
  }

  // Send Slack alert
  async sendSlackAlert(message) {
    const payload = {
      text: message,
      username: 'ASAgents Health Monitor',
      icon_emoji: ':warning:',
    };

    const data = JSON.stringify(payload);
    const url = new URL(this.config.alerts.webhook);

    return new Promise((resolve, reject) => {
      const request = https.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      }, (response) => {
        if (response.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Slack API returned ${response.statusCode}`));
        }
      });

      request.on('error', reject);
      request.write(data);
      request.end();
    });
  }

  // Send email alert (placeholder - implement with your email service)
  async sendEmailAlert(serviceName, message) {
    // Implement email sending logic here
    // This could use nodemailer, SendGrid, AWS SES, etc.
    this.logger.info('Email alert would be sent', { serviceName, message });
  }

  // Check individual service
  async checkService(service) {
    let result;

    try {
      if (service.url) {
        result = await this.checkHttpEndpoint(service);
      } else if (service.check) {
        result = await this.checkCommand(service);
      } else {
        throw new Error('Service must have either url or check property');
      }

      // Track failure count
      if (!result.healthy) {
        const currentCount = this.failureCount.get(service.name) || 0;
        this.failureCount.set(service.name, currentCount + 1);

        // Send alert if critical service fails
        if (service.critical && currentCount < this.config.alerts.retryAttempts) {
          await this.sendAlert(service, result, currentCount + 1);
        }
      } else {
        // Reset failure count on success
        this.failureCount.set(service.name, 0);
      }

      return {
        service: service.name,
        healthy: result.healthy,
        responseTime: result.responseTime,
        critical: service.critical,
        error: result.error,
        statusCode: result.statusCode,
      };

    } catch (error) {
      this.logger.error(`Failed to check service ${service.name}`, { error: error.message });
      return {
        service: service.name,
        healthy: false,
        responseTime: null,
        critical: service.critical,
        error: error.message,
      };
    }
  }

  // Run complete health check
  async runHealthCheck() {
    this.logger.info('Starting health check...');
    
    const results = {
      timestamp: new Date().toISOString(),
      services: [],
      systemResources: {},
      summary: {
        total: this.config.services.length,
        healthy: 0,
        unhealthy: 0,
        critical: 0,
      },
    };

    // Check all services
    for (const service of this.config.services) {
      const result = await this.checkService(service);
      results.services.push(result);

      if (result.healthy) {
        results.summary.healthy++;
      } else {
        results.summary.unhealthy++;
        if (result.critical) {
          results.summary.critical++;
        }
      }
    }

    // Check system resources
    results.systemResources = await this.checkSystemResources();

    // Log results
    if (results.summary.critical > 0) {
      this.logger.error('Critical services are unhealthy!', results.summary);
    } else if (results.summary.unhealthy > 0) {
      this.logger.warn('Some services are unhealthy', results.summary);
    } else {
      this.logger.success('All services are healthy', results.summary);
    }

    return results;
  }
}

// Main execution
async function main() {
  const healthChecker = new HealthChecker(CONFIG);
  
  try {
    const results = await healthChecker.runHealthCheck();
    
    // Exit with error code if critical services are down
    if (results.summary.critical > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { HealthChecker, Logger };
