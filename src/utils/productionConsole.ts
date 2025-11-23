// ============================================================================
// MICROSOFT ENTERPRISE CONSOLE OVERRIDE
// Production-grade console management - Silent in production, verbose in dev
// ============================================================================

/**
 * Microsoft Pattern: Override console methods in production
 * - Development: All console methods work normally
 * - Production: Only errors and warnings are logged
 * - Performance: Zero overhead from debug/info/log statements
 */
export function initializeProductionConsole(): void {
  // TEMPORARILY DISABLED - Need to see errors for debugging
  return;
  
  // Override in both production AND development for clean console
  // Comment out the return below to enable in dev mode too
  // if (!import.meta.env.PROD) {
  //   return;
  // }

  // Store original methods for critical logging
  const originalError = console.error;
  const originalWarn = console.warn;

  // Create no-op function for silenced methods
  const noop = () => { /* noop */ return undefined; };

  // Override non-critical methods with no-op
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.trace = noop;
  console.table = noop;
  console.group = noop;
  console.groupCollapsed = noop;
  console.groupEnd = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.timeLog = noop;
  console.count = noop;
  console.countReset = noop;
  console.dir = noop;
  console.dirxml = noop;

  // MICROSOFT GRADE: Aggressive filtering - only show CRITICAL errors
  console.error = (...args: Parameters<typeof console.error>) => {
    const message = String(args[0] || '');
    
    // Filter out ALL non-critical errors (Microsoft standard)
    if (
      message.includes('Download the React DevTools') ||
      message.includes('AudioContext') ||
      message.includes('user gesture') ||
      message.includes('autoplay') ||
      message.includes('DevTools') ||
      message.includes('development') ||
      message.includes('Warning:') ||
      message.includes('[HMR]') ||
      message.includes('[Vite]') ||
      message.includes('LiveKit') ||
      message.includes('Spotify') ||
      message.includes('OAuth') ||
      message.includes('GoTrueClient') ||
      message.includes('Supabase') ||
      message.includes('lock acquired') ||
      message.includes('lock released') ||
      message.includes('session from storage') ||
      message.includes('_acquireLock') ||
      message.includes('_useSession') ||
      message.includes('INITIAL_SESSION') ||
      message.includes('[AuthStore]') ||
      message.includes('[Environment]') ||
      message.includes('[APP]') ||
      message.includes('[RoomStore]') ||
      message.includes('[ThemeStore]') ||
      message.includes('preconnect') ||
      message.includes('initialization') ||
      message.includes('Preloading') ||
      message.includes('SDK')
    ) {
      return;
    }
    
    // Only log if it's a REAL error (has Error object or stack trace)
    if (args[0] instanceof Error || message.includes('Error:') || message.includes('Failed')) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args: Parameters<typeof console.warn>) => {
    const message = String(args[0] || '');
    
    // MICROSOFT GRADE: Filter out ALL warnings in production
    if (
      message.includes('AudioContext') ||
      message.includes('user gesture') ||
      message.includes('autoplay') ||
      message.includes('DevTools') ||
      message.includes('development') ||
      message.includes('[HMR]') ||
      message.includes('[Vite]') ||
      message.includes('LiveKit') ||
      message.includes('Spotify') ||
      message.includes('OAuth') ||
      message.includes('GoTrueClient') ||
      message.includes('Supabase')
    ) {
      return;
    }
    
    // Only log CRITICAL warnings
    if (message.includes('CRITICAL') || message.includes('FATAL')) {
      originalWarn.apply(console, args);
    }
  };

  // Silent initialization - no logs at all
  // Microsoft products don't announce themselves in the console
}

/**
 * Microsoft Pattern: Create a production-safe logger
 * Use this instead of console.log in your code
 */
export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  // Performance monitoring (dev only)
  time: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(label);
    }
  },
  
  // Group logging (dev only)
  group: (label: string) => {
    if (import.meta.env.DEV) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  },
};

export default logger;
