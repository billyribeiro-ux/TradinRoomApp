/**
 * Container Size Hook - Microsoft Enterprise Standards
 * =========================================================
 * Tracks container dimensions and provides responsive sizing
 * Used for responsive layouts and dynamic scaling
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseContainerSizeReturn<T extends HTMLElement> {
  readonly ref: React.RefObject<T>;
  readonly size: { w: number; h: number } | null;
}

export function useContainerSize<T extends HTMLElement>(): UseContainerSizeReturn<T> {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const updateSize = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const { width, height } = element.getBoundingClientRect();
    setSize({ w: width, h: height });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Initial size measurement
    updateSize();

    // Set up ResizeObserver for responsive tracking
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(element);

      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // Fallback for browsers without ResizeObserver
      const handleResize = () => {
        updateSize();
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [updateSize]);

  return {
    ref,
    size,
  };
}
