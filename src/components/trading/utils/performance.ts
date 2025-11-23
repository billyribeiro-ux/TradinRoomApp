/**
 * Performance Utilities - Microsoft Enterprise Standards
 * =========================================================
 * Performance monitoring and optimization utilities
 * Provides metrics collection and performance analysis
 */

import { performance } from 'perf_hooks';

import { loggerFactory } from '../../infrastructure';

export interface PerformanceMetrics {
  readonly renderTime: number;
  readonly memoryUsage: number;
  readonly componentCount: number;
  readonly reRenderCount: number;
}

export interface PerformanceMonitor {
  readonly startMeasure: (name: string) => void;
  readonly endMeasure: (name: string) => number;
  readonly getMetrics: () => PerformanceMetrics;
  readonly reset: () => void;
}

/**
 * Creates a performance monitor for React components
 */
export function createPerformanceMonitor(componentName: string): PerformanceMonitor {
  const logger = loggerFactory.create('PerformanceMonitor');
  const measures = new Map<string, number>();
  let renderCount = 0;
  let componentCount = 0;

  const startMeasure = (name: string): void => {
    if (import.meta.env.DEV) {
      const markName = `${componentName}-${name}-start`;
      performance.mark(markName);
    }
  };

  const endMeasure = (name: string): number => {
    if (!import.meta.env.DEV) return 0;

    try {
      const startMark = `${componentName}-${name}-start`;
      const endMark = `${componentName}-${name}-end`;
      const measureName = `${componentName}-${name}`;

      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      const measure = performance.getEntriesByName(measureName, 'measure')[0];
      const duration = measure?.duration || 0;

      measures.set(name, duration);
      
      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);

      return duration;
    } catch (error) {
      logger.warn(`Failed to measure ${name}: ${error}`);
      return 0;
    }
  };

  const getMetrics = (): PerformanceMetrics => {
    const renderTime = measures.get('render') || 0;
    const memoryUsage = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;

    return {
      renderTime,
      memoryUsage,
      componentCount,
      reRenderCount: renderCount,
    };
  };

  const reset = (): void => {
    measures.clear();
    renderCount = 0;
    componentCount = 0;
  };

  return {
    startMeasure,
    endMeasure,
    getMetrics,
    reset,
  };
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: Array<unknown>) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: Array<unknown>) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization utility with size limit
 */
export function createMemoCache<T>(maxSize: number = 100) {
  const cache = new Map<string, { value: T; timestamp: number }>();
  
  const get = (key: string): T | undefined => {
    const entry = cache.get(key);
    if (!entry) return undefined;
    
    // Return value if found
    return entry.value;
  };

  const set = (key: string, value: T): void => {
    // Remove oldest entry if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    cache.set(key, { value, timestamp: Date.now() });
  };

  const clear = (): void => {
    cache.clear();
  };

  const size = (): number => {
    return cache.size;
  };

  return { get, set, clear, size };
}

/**
 * Performance-optimized event listener manager
 */
export class EventListenerManager {
  private listeners = new Map<Element, Map<string, EventListener>>();

  add(
    element: Element,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }

    const elementListeners = this.listeners.get(element)!;
    
    // Remove existing listener for the same event
    if (elementListeners.has(event)) {
      element.removeEventListener(event, elementListeners.get(event)!);
    }

    element.addEventListener(event, listener, options);
    elementListeners.set(event, listener);
  }

  remove(element: Element, event: string): void {
    const elementListeners = this.listeners.get(element);
    if (!elementListeners) return;

    const listener = elementListeners.get(event);
    if (listener) {
      element.removeEventListener(event, listener);
      elementListeners.delete(event);
    }

    if (elementListeners.size === 0) {
      this.listeners.delete(element);
    }
  }

  removeAll(): void {
    this.listeners.forEach((elementListeners, element) => {
      elementListeners.forEach((listener, event) => {
        element.removeEventListener(event, listener);
      });
    });
    this.listeners.clear();
  }

  size(): number {
    return this.listeners.size;
  }
}
