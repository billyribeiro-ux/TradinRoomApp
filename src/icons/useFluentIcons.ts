import type React from 'react';
import * as fluentIcons from './fluentIcons';

type FluentIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type FluentIconsModule = Record<string, FluentIconComponent>;

// Resolved once at module load from the curated `fluentIcons` barrel, so only
// the glyphs the app references are bundled — instead of dynamically importing
// the entire ~15MB `@fluentui/react-icons` package at runtime.
const icons = fluentIcons as unknown as FluentIconsModule;

/**
 * useFluentIcons
 * Returns the curated map of FluentUI icon components, keyed by export name.
 * Consumers look icons up by name (e.g. `fi?.Settings24Regular`) and already
 * guard for missing entries, so any glyph not present in the curated set
 * degrades gracefully to the caller's local fallback — identical to the prior
 * "still loading / not available" behaviour, but without the runtime import.
 */
export function useFluentIcons(): FluentIconsModule {
  return icons;
}
