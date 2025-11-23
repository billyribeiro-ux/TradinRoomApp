/**
 * Monitoring - Web Vitals and Performance Tracking
 * Tracks Core Web Vitals and performance metrics for production
 */

import type { Metric } from 'web-vitals';

export type WebVitalsMetric = Metric;

/**
 * Log Web Vitals to console (development) or analytics service (production)
 */
export const logWebVitals = (metric: WebVitalsMetric): void => {
  if (import.meta.env.DEV) {
    console.log('📊 Web Vital:', metric);
  } else {
    // In production, you would send this to your analytics service
    // Example: sendToAnalytics(metric);
    console.log('📊 Web Vital (Production):', metric);
  }
};

/**
 * Initialize Web Vitals tracking
 */
export const initializeWebVitals = (): void => {
  if (typeof window !== 'undefined') {
    // Dynamic import of web-vitals library
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      // Register listeners for core web vitals
      onCLS(logWebVitals);
      onINP(logWebVitals);
      onFCP(logWebVitals);
      onLCP(logWebVitals);
      onTTFB(logWebVitals);
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error);
    });
  }
};

export default {
  logWebVitals,
  initializeWebVitals,
};
