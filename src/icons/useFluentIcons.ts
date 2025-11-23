import { useEffect, useState } from 'react';
import type React from 'react';

type FluentIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type FluentIconsModule = Record<string, FluentIconComponent>;

/**
 * useFluentIcons
 * Lazy-loads @fluentui/react-icons at runtime to keep initial bundle lean
 * and provides a resilient fallback when certain icons are not available.
 * Returns the module object or null while loading.
 */
export function useFluentIcons() {
  const [mod, setMod] = useState<FluentIconsModule | null>(null);

  useEffect(() => {
    let mounted = true;
    import('@fluentui/react-icons')
      .then((m) => {
        if (!mounted) return;
        setMod(m as unknown as FluentIconsModule);
      })
      .catch(() => {
        // Silently ignore; callers should use local fallbacks
      });
    return () => {
      mounted = false;
    };
  }, []);

  return mod;
}
