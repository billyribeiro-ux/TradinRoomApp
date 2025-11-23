/**
 * errors.ts
 * ------------------------------------------------------------
 * Custom error classes for the application
 * Microsoft-standard error handling with context and error codes
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  code: string;
  context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication-related errors
 * Thrown when user is not authenticated or session is invalid
 */
export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', context);
  }
}

/**
 * Database operation errors
 * Thrown when Supabase queries fail
 */
export class DatabaseError extends AppError {
  originalError?: unknown;

  constructor(message: string, originalError?: unknown, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context);
    this.originalError = originalError;
  }
}

/**
 * Row Level Security (RLS) policy errors
 * Thrown when RLS policies deny access to resources
 */
export class RLSError extends AppError {
  table: string;
  operation: string;

  constructor(
    message: string,
    table: string,
    operation: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'RLS_ERROR', context);
    this.table = table;
    this.operation = operation;
  }
}

/**
 * Network/API errors
 * Thrown when external API calls fail
 */
export class NetworkError extends AppError {
  status?: number;
  statusText?: string;

  constructor(
    message: string,
    status?: number,
    statusText?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', context);
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Configuration errors
 * Thrown when required environment variables or config are missing
 */
export class ConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', context);
  }
}

/**
 * Validation errors
 * Thrown when data validation fails
 */
export class ValidationError extends AppError {
  field?: string;

  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.field = field;
  }
}
