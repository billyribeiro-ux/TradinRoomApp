// src/utils/cacheManager.ts
/**
 * Microsoft/Fluent-style cache manager for theme and state resets.
 * Provides granular control over Zustand stores, CSS vars, and IndexedDB.
 */

declare global {
  interface Window {
    useThemeStore?: {
      getState?: () => { resetTheme?: () => void };
    };
    showToast?: (message: string, type?: string) => void;
  }
}

export async function clearMicrosoftCache(
  target: string,
  options: {
    resetStores?: boolean;
    resetCSSVars?: boolean;
    autoReload?: boolean;
    showToasts?: boolean;
  } = {}
) {
  const {
    resetStores = false,
    resetCSSVars = true,
    autoReload = false,
    showToasts = false,
  } = options;

  console.log(`[cacheManager] 🔄 Clearing cache for: ${target}`);

  try {
    // 🧹 Clear IndexedDB (Fluent data caches)
    if (window.indexedDB) {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
      console.log('[cacheManager] IndexedDB cleared.');
    }

    // 🧹 Clear localStorage (theme + settings) BUT PRESERVE AUTH
    // CRITICAL: Save auth token before clearing
    const authKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') && key.includes('-auth-token')
    );
    const savedAuthData: Record<string, string> = {};
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) savedAuthData[key] = value;
    });
    
    // Clear everything
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore auth tokens
    Object.entries(savedAuthData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('[cacheManager] Local/session storage cleared (auth preserved).');

    // 🧹 Reset CSS variables (Fluent tokens)
    if (resetCSSVars) {
      const root = document.documentElement;
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-bg');
      root.style.removeProperty('--theme-font');
      console.log('[cacheManager] CSS variables reset.');
    }

    // 🧹 Optionally reload Zustand stores
    if (resetStores && window.useThemeStore) {
      const store = window.useThemeStore.getState?.();
      if (store?.resetTheme) store.resetTheme();
      console.log('[cacheManager] Zustand theme store reset.');
    }

    if (showToasts && window.showToast) {
      window.showToast('Cache cleared successfully.', 'success');
    }

    if (autoReload) {
      console.log('[cacheManager] Auto reloading...');
      window.location.reload();
    }
  } catch (err) {
    console.error('[cacheManager] ❌ Failed to clear cache:', err);
  }
}
