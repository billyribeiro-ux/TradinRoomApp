/** Shared utility — SSOT. Do not duplicate logic elsewhere. */

/**
 * Applies CSS custom properties to the document root.
 * SSR-safe: no-ops when running on server.
 * 
 * @param vars - Object mapping CSS variable names to values
 * @example
 * applyCssVars({
 *   '--theme-primary': '#2563eb',
 *   '--theme-font': 'Inter, sans-serif'
 * })
 */
export function applyCssVars(vars: Record<string, string>): void {
  // SSR guard
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}
