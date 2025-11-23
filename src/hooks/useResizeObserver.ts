import { useState, useLayoutEffect } from 'react';

/**
 * A hook that observes the size of an HTML element.
 * @param ref A React ref to the element to observe.
 * @returns The width and height of the observed element.
 */
export function useResizeObserver(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      // We only care about the first (and only) entry
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(element);

    // Set initial size
    const { width, height } = element.getBoundingClientRect();
    setSize({ width, height });

    return () => observer.disconnect();
  }, [ref]); // Only re-run if the ref itself changes

  return size;
}
