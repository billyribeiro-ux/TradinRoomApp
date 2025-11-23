/**
 * Production-safe logger
 * Microsoft L70+ Distinguished Principal Engineer
 * 
 * Replaces console.log with environment-aware logging
 */

const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment || isTest) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment || isTest) {
      console.warn(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment || isTest) {
      console.info(...args);
    }
  },
  
  table: (data: any) => {
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
