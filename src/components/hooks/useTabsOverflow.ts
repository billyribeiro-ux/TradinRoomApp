import { useEffect, useRef, useState } from 'react';

export function useTabsOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 4);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener('resize', check);
    check();
    return () => { 
      ro.disconnect(); 
      window.removeEventListener('resize', check); 
    };
  }, []);

  return { ref, overflowing };
}

