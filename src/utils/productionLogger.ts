/**
 * Production Logger - Microsoft Enterprise Pattern
 * Optimized logging that respects environment and reduces production noise
 * 
 * Features:
 * - Automatic environment detection
 * - Log level filtering
 * - Performance-optimized (no-op in production for debug/info)
 * - Type-safe log methods
 * - Structured logging support
 */

interface LogContext {
  [key: string]: unknown;
}

class ProductionLogger {
  private isDev = import.meta.env.DEV;

  /**
   * Debug logs - Only in development
   * Completely removed in production builds
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      if (context) {
        console.debug(`[DEBUG] ${message}`, context);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }

  /**
   * Info logs - Only in development
   * Completely removed in production builds
   */
  info(message: string, context?: LogContext): void {
    if (this.isDev) {
      if (context) {
        console.info(`[INFO] ${message}`, context);
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  }

  /**
   * Warning logs - Always logged
   * Important for catching potential issues
   */
  warn(message: string, context?: LogContext): void {
    if (context) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Error logs - Always logged
   * Critical for debugging production issues
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorInfo = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...context }
      : { error, ...context };

    console.error(`[ERROR] ${message}`, errorInfo);
  }

  /**
   * Performance measurement - Only in development
   */
  time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }

  /**
   * Performance measurement end - Only in development
   */
  timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }

  /**
   * Group logs - Only in development
   */
  group(label: string): void {
    if (this.isDev) {
      console.group(label);
    }
  }

  /**
   * End group - Only in development
   */
  groupEnd(): void {
    if (this.isDev) {
      console.groupEnd();
    }
  }

  /**
   * Table display - Only in development
   */
  table(data: unknown): void {
    if (this.isDev) {
      console.table(data);
    }
  }

  /**
   * Create a scoped logger with prefix
   */
  scope(prefix: string) {
    return {
      debug: (message: string, context?: LogContext) => 
        this.debug(`[${prefix}] ${message}`, context),
      info: (message: string, context?: LogContext) => 
        this.info(`[${prefix}] ${message}`, context),
      warn: (message: string, context?: LogContext) => 
        this.warn(`[${prefix}] ${message}`, context),
      error: (message: string, error?: Error | unknown, context?: LogContext) => 
        this.error(`[${prefix}] ${message}`, error, context),
    };
  }
}

// Singleton instance
export const logger = new ProductionLogger();

// Convenience exports for common scopes
export const apiLogger = logger.scope('API');
export const dbLogger = logger.scope('Database');
export const authLogger = logger.scope('Auth');
export const cacheLogger = logger.scope('Cache');
export const realtimeLogger = logger.scope('Realtime');

export default logger;
