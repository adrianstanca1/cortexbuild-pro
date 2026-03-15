/**
 * Logger Utility
 *
 * Centralized logging with environment-aware output.
 * In production, logs are suppressed except for errors.
 * In development, all log levels are visible.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  /** Module/service name for context */
  module?: string;
  /** Enable timestamps */
  timestamp?: boolean;
}

class Logger {
  private module: string;
  private timestamp: boolean;
  private isDevelopment: boolean;

  constructor(options: LoggerOptions = {}) {
    this.module = options.module || "app";
    this.timestamp = options.timestamp ?? true;
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level.toUpperCase()}]`);
    parts.push(`[${this.module}]`);
    parts.push(message);

    return parts.join(" ");
  }

  /**
   * Debug-level logging - only shown in development
   * Use for detailed diagnostic information
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message), ...args);
    }
  }

  /**
   * Info-level logging - suppressed in production for noise reduction
   * Use for general operational information
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage("info", message), ...args);
    }
  }

  /**
   * Warning-level logging - shown in development and production
   * Use for recoverable issues that should be investigated
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage("warn", message), ...args);
  }

  /**
   * Error-level logging - always shown
   * Use for errors that affect functionality
   */
  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage("error", message), ...args);
  }
}

/**
 * Create a logger instance for a specific module
 * @example
 * const logger = createLogger('api-connections');
 * logger.info('Connection established');
 * logger.error('Failed to connect', error);
 */
export function createLogger(module: string): Logger {
  return new Logger({ module });
}

/**
 * Default logger instance for general use
 */
export const logger = new Logger();

export default logger;
