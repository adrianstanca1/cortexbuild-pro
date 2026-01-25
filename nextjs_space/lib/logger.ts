/**
 * Structured Logging Implementation
 * 
 * Provides structured logging with correlation IDs, levels, and contexts
 * Outputs JSON in production for log aggregation systems
 */

import { randomUUID } from 'crypto';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  projectId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  metadata?: Record<string, any>;
}

class Logger {
  private defaultContext: LogContext = {};
  private isProduction = process.env.NODE_ENV === 'production';
  private minLevel: LogLevel = process.env.LOG_LEVEL as LogLevel || LogLevel.INFO;
  
  private levelPriority: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.FATAL]: 4,
  };
  
  /**
   * Set default context for all logs
   */
  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }
  
  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger();
    child.defaultContext = { ...this.defaultContext, ...context };
    child.isProduction = this.isProduction;
    child.minLevel = this.minLevel;
    return child;
  }
  
  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }
  
  /**
   * Format and output log entry
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }
    
    const logEntry: LogEntry = {
      ...entry,
      context: { ...this.defaultContext, ...entry.context },
    };
    
    if (this.isProduction) {
      // JSON output for production log aggregation
      console.log(JSON.stringify(logEntry));
    } else {
      // Human-readable output for development
      const timestamp = new Date(logEntry.timestamp).toISOString();
      const level = logEntry.level.toUpperCase().padEnd(5);
      const message = logEntry.message;
      const contextStr = logEntry.context ? ` ${JSON.stringify(logEntry.context)}` : '';
      const errorStr = logEntry.error ? ` ERROR: ${logEntry.error.message}` : '';
      const durationStr = logEntry.duration ? ` (${logEntry.duration}ms)` : '';
      
      const colorMap: Record<LogLevel, string> = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.FATAL]: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';
      const color = colorMap[entry.level];
      
      console.log(`${color}[${timestamp}] ${level}${reset} ${message}${contextStr}${errorStr}${durationStr}`);
      
      if (logEntry.error?.stack && entry.level !== LogLevel.INFO) {
        console.log(logEntry.error.stack);
      }
    }
  }
  
  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      metadata,
    });
  }
  
  /**
   * Log info message
   */
  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      metadata,
    });
  }
  
  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      metadata,
    });
  }
  
  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext, metadata?: Record<string, any>): void {
    const errorInfo = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    } : undefined;
    
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      error: errorInfo,
      context,
      metadata,
    });
  }
  
  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext, metadata?: Record<string, any>): void {
    const errorInfo = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    } : undefined;
    
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      message,
      error: errorInfo,
      context,
      metadata,
    });
  }
  
  /**
   * Log request start
   */
  logRequest(method: string, path: string, context?: LogContext): void {
    this.info('Request started', {
      ...context,
      method,
      path,
    });
  }
  
  /**
   * Log request completion
   */
  logResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log({
      timestamp: new Date().toISOString(),
      level,
      message: 'Request completed',
      context: {
        ...context,
        method,
        path,
        statusCode,
      },
      duration,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Generate correlation ID for request tracking
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Extract request context for logging
 */
export function extractRequestContext(request: Request, userId?: string, organizationId?: string): LogContext {
  const url = new URL(request.url);
  
  return {
    requestId: generateRequestId(),
    userId,
    organizationId,
    method: request.method,
    path: url.pathname,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

/**
 * Create request logger with context
 */
export function createRequestLogger(request: Request, userId?: string, organizationId?: string): Logger {
  const context = extractRequestContext(request, userId, organizationId);
  return logger.child(context);
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
    'sessionId',
  ];
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some(k => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Performance timer for measuring operation duration
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;
  private logger: Logger;
  
  constructor(label: string, logger: Logger = logger) {
    this.label = label;
    this.logger = logger;
    this.startTime = performance.now();
    this.logger.debug(`${label} started`);
  }
  
  /**
   * End timer and log duration
   */
  end(context?: LogContext): number {
    const duration = Math.round(performance.now() - this.startTime);
    this.logger.info(`${this.label} completed`, context, { duration });
    return duration;
  }
}
