// ============================================================================
// DEBUG UTILITIES - Diagnostic Logging
// ============================================================================
// Toggle with DEBUG_WHITEBOARD environment variable or localStorage
// ============================================================================

const DEBUG_KEY = 'DEBUG_WHITEBOARD';

export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return (
      localStorage.getItem(DEBUG_KEY) === 'true' ||
      process.env.DEBUG_WHITEBOARD === 'true'
    );
  } catch {
    return false;
  }
}

export function enableDebug(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DEBUG_KEY, 'true');
      console.log('🎨 Whiteboard debug logging enabled');
    } catch {
      // localStorage not available
    }
  }
}

export function disableDebug(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(DEBUG_KEY);
      console.log('🎨 Whiteboard debug logging disabled');
    } catch {
      // localStorage not available
    }
  }
}

export function debugLog(category: string, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;
  
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  console.debug(`[WB:${category}] ${timestamp} ${message}`, data || '');
}

// Specific debug loggers
export const debug = {
  pointer: (event: string, data?: unknown) => debugLog('POINTER', event, data),
  text: (event: string, data?: unknown) => debugLog('TEXT', event, data),
  emoji: (event: string, data?: unknown) => debugLog('EMOJI', event, data),
  render: (event: string, data?: unknown) => debugLog('RENDER', event, data),
  state: (event: string, data?: unknown) => debugLog('STATE', event, data),
  toolbar: (event: string, data?: unknown) => debugLog('TOOLBAR', event, data),
  compositor: (event: string, data?: unknown) => debugLog('COMPOSITOR', event, data),
  undo: (event: string, data?: unknown) => debugLog('UNDO', event, data),
};

// Expose to window for easy toggling
declare global {
  interface Window {
    whiteboardDebug?: {
      enable: () => void;
      disable: () => void;
      isEnabled: () => boolean;
    };
  }
}

if (typeof window !== 'undefined') {
  (window as Window).whiteboardDebug = {
    enable: enableDebug,
    disable: disableDebug,
    isEnabled: isDebugEnabled,
  };
}
