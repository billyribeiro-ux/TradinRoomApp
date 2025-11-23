// ============================================================================
// MICROSOFT PRODUCTION LOGGING - Enterprise Standard
// ============================================================================

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

class ProductionLogger {
  private minLevel: LogLevel;
  private environment: string;

  constructor() {
    this.environment = import.meta.env.MODE || 'development';
    this.minLevel = this.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();

    // Send to Azure Application Insights in production
    if (this.environment === 'production' && window.appInsights) {
      window.appInsights.trackTrace({
        message,
        severity: level,
        properties: context,
      });
    }

    // Console output in development
    if (this.environment === 'development') {
      const emoji = {
        DEBUG: '🔍',
        INFO: 'ℹ️',
        WARN: '⚠️',
        ERROR: '❌',
        CRITICAL: '🔥',
      }[level];

      console.log(`${emoji} [${timestamp}] ${level}:`, message, context || '');
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatMessage('DEBUG', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage('INFO', message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.formatMessage('WARN', message, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : String(error),
      };
      this.formatMessage('ERROR', message, errorContext);
    }
  }

  critical(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
    };
    this.formatMessage('CRITICAL', message, errorContext);

    // Always send critical errors to monitoring
    if (window.appInsights) {
      window.appInsights.trackException({
        exception: error instanceof Error ? error : new Error(String(error)),
        severityLevel: 4,
        properties: context,
      });
    }
  }
}

// Singleton instance
export const logger = new ProductionLogger();

// Microsoft Pattern: Typed logging helpers
export const log = {
  debug: (msg: string, ctx?: LogContext) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: LogContext) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error | unknown, ctx?: LogContext) => logger.error(msg, err, ctx),
  critical: (msg: string, err?: Error | unknown, ctx?: LogContext) => logger.critical(msg, err, ctx),
};
