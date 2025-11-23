/**
 * GLOBAL ERROR HANDLERS - Microsoft Production Standard
 * ============================================================================
 * Catches unhandled errors and promise rejections
 * Prevents silent failures
 * Logs errors for monitoring
 * ============================================================================
 */

/**
 * Initialize global error handlers
 * Call this once at application startup
 */
export function initializeGlobalErrorHandlers(): void {
  // Handle uncaught errors
  window.addEventListener('error', (event: ErrorEvent) => {
    console.error('🚨 Uncaught Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Prevent default browser error handling
    // event.preventDefault();

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // logErrorToService({
      //   type: 'uncaught_error',
      //   message: event.message,
      //   stack: event.error?.stack,
      //   filename: event.filename,
      //   line: event.lineno,
      //   column: event.colno
      // });
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    console.error('🚨 Unhandled Promise Rejection:', {
      reason: event.reason,
      promise: event.promise
    });

    // Prevent default browser handling
    // event.preventDefault();

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // logErrorToService({
      //   type: 'unhandled_rejection',
      //   reason: event.reason?.toString(),
      //   stack: event.reason?.stack
      // });
    }
  });

  // Handle console errors (optional - for tracking console.error calls)
  if (import.meta.env.PROD) {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      // Log to monitoring service
      // logErrorToService({
      //   type: 'console_error',
      //   message: args.map(arg => String(arg)).join(' ')
      // });
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };
  }

  console.log('✅ Global error handlers initialized');
}

/**
 * Safe async wrapper - catches errors in async functions
 */
export function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  return fn().catch((error: Error) => {
    console.error('Async operation failed:', error);
    return fallback;
  });
}

/**
 * Safe function wrapper - catches errors in sync functions
 */
export function safe<T>(
  fn: () => T,
  fallback?: T
): T | undefined {
  try {
    return fn();
  } catch (error) {
    console.error('Operation failed:', error);
    return fallback;
  }
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i);
        console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export default {
  initializeGlobalErrorHandlers,
  safeAsync,
  safe,
  retryAsync
};
