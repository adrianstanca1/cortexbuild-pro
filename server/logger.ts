/**
 * Structured Logging
 * JSON format logging with correlation IDs and request tracing
 */

import { v4 as uuidv4 } from 'uuid';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface LoggerOptions {
  service: string;
  level?: LogLevel;
  prettyPrint?: boolean;
}

class Logger {
  private service: string;
  private minLevel: LogLevel;
  private prettyPrint: boolean;
  private correlationId?: string;
  private traceId?: string;
  private spanId?: string;

  private levelOrder: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(options: LoggerOptions) {
    this.service = options.service;
    this.minLevel = options.level || LogLevel.INFO;
    this.prettyPrint = options.prettyPrint || false;
  }

  /**
   * Set correlation context
   */
  setContext(context: {
    correlationId?: string;
    traceId?: string;
    spanId?: string;
    userId?: string;
    organizationId?: string;
  }): void {
    this.correlationId = context.correlationId;
    this.traceId = context.traceId;
    this.spanId = context.spanId;
  }

  /**
   * Generate new correlation ID
   */
  static generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Generate new trace ID
   */
  static generateTraceId(): string {
    return uuidv4().replace(/-/g, '');
  }

  /**
   * Create log entry
   */
  private createEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      correlationId: this.correlationId,
      traceId: this.traceId,
      spanId: this.spanId,
      ...metadata,
    };
  }

  /**
   * Format and output log
   */
  private output(entry: LogEntry): void {
    if (this.levelOrder[entry.level] < this.levelOrder[this.minLevel]) {
      return;
    }

    const output = this.prettyPrint ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry(LogLevel.DEBUG, message, metadata));
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry(LogLevel.INFO, message, metadata));
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry(LogLevel.WARN, message, metadata));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.ERROR, message, {
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as NodeJS.ErrnoException).code,
      } : undefined,
      ...metadata,
    });
    this.output(entry);
  }

  /**
   * Log HTTP request
   */
  logRequest(req: {
    method: string;
    path: string;
    headers: Record<string, string>;
    user?: { id: string };
  }, duration?: number): void {
    this.info('HTTP request', {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      duration,
      userAgent: req.headers['user-agent'],
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: {
    method: string;
    path: string;
  }, res: {
    statusCode: number;
  }, duration: number): void {
    const level = res.statusCode >= 500 ? LogLevel.ERROR :
                  res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.output(this.createEntry(level, 'HTTP response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    }));
  }

  /**
   * Log database query
   */
  logQuery(query: string, params?: unknown[], duration?: number): void {
    this.debug('Database query', {
      query,
      params,
      duration,
    });
  }

  /**
   * Log cache operation
   */
  logCache(operation: 'hit' | 'miss', key: string, duration?: number): void {
    this.debug('Cache operation', {
      operation,
      key,
      duration,
    });
  }

  /**
   * Log audit event
   */
  logAudit(action: string, resource: string, userId: string, details?: Record<string, unknown>): void {
    this.info('Audit event', {
      action,
      resource,
      userId,
      audit: true,
      ...details,
    });
  }
}

/**
 * Create logger instance
 */
export function createLogger(service: string, options?: { level?: LogLevel; prettyPrint?: boolean }): Logger {
  return new Logger({
    service,
    level: options?.level,
    prettyPrint: options?.prettyPrint,
  });
}

/**
 * Express logging middleware
 */
export function loggingMiddleware(logger: Logger) {
  return (req: any, res: any, next: () => void): void => {
    const start = Date.now();
    const correlationId = Logger.generateCorrelationId();
    const traceId = Logger.generateTraceId();
    
    // Set context
    logger.setContext({
      correlationId,
      traceId,
    });
    
    // Add to request for downstream use
    req.correlationId = correlationId;
    req.traceId = traceId;
    
    // Log request
    logger.logRequest({
      method: req.method,
      path: req.path,
      headers: req.headers,
      user: req.user,
    });
    
    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.logResponse(
        { method: req.method, path: req.path },
        { statusCode: res.statusCode },
        duration
      );
    });
    
    next();
  };
}

/**
 * Request tracing middleware (for distributed tracing)
 */
export function tracingMiddleware(logger: Logger) {
  return (req: any, res: any, next: () => void): void => {
    // Extract trace context from headers (W3C Trace Context)
    const traceparent = req.headers['traceparent'];
    if (traceparent) {
      const parts = traceparent.split('-');
      logger.setContext({
        traceId: parts[1],
        spanId: parts[2],
      });
    }
    
    next();
  };
}

/**
 * Audit logger for security events
 */
export function createAuditLogger(service: string): Logger {
  return createLogger(service, { level: LogLevel.INFO });
}
