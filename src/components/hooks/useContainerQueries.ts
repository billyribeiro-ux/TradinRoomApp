import type { MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useContainerQueries<T extends HTMLElement>() {
  const ref = useRef<T>(null) as MutableRefObject<T | undefined>;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [bp, setBp] = useState<BreakpointKey>('lg');

  useEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      const w = Math.round(cr.width);
      const h = Math.round(cr.height);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      // map to tailwind-like breakpoints
      const next =
        w >= 1536 ? '2xl' :
        w >= 1280 ? 'xl' :
        w >= 1024 ? 'lg' :
        w >= 768 ? 'md' :
        w >= 640 ? 'sm' : 'xs';
      setBp((prev) => (prev === next ? prev : next));
      // write CSS vars so CSS can react without rerenders
      const root = el; // scope to the container
      root.style.setProperty('--container-w', `${w}px`);
      root.style.setProperty('--container-h', `${h}px`);
      root.style.setProperty('--bp', next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size, bp };
}

