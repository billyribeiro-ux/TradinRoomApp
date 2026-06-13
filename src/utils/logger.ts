/**
 * Production-safe logger
 * Microsoft L70+ Distinguished Principal Engineer
 * 
 * Replaces console.log with environment-aware logging
 */

const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment || isTest) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors
    console.error(...args);
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment || isTest) {
      console.warn(...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment || isTest) {
      console.info(...args);
    }
  },

  table: (data: unknown) => {
    if (isDevelopment) {
      console.table(data);
    }
  },
  
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

// Export as default for easy migration
export default logger;
