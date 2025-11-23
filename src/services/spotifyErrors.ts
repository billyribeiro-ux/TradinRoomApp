import type { SpotifyError } from './spotify/types';

// Re-export for backward compatibility
export type { SpotifyError };

export function parseSpotifyError(error: unknown): SpotifyError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorLower = errorMessage.toLowerCase();

  // Browser blocked Web Playback SDK (CSP, permissions, etc.)
  if (errorLower.includes('spotify sdk') || 
      errorLower.includes('web playback') || 
      errorLower.includes('sdk not available') ||
      errorLower.includes('content security policy') ||
      errorLower.includes('csp') ||
      errorLower.includes('refused to load')) {
    return {
      message: errorMessage,
      type: 'browser_blocked',
      userMessage: 'Browser Blocked Web Player',
      actionable: 'Web Player blocked by browser security. Use Spotify on your phone/computer instead - API will control it remotely.'
    };
  }

  if (errorLower.includes('premium')) {
    return {
      message: errorMessage,
      type: 'premium',
      userMessage: 'Spotify Premium Required',
      actionable: 'Web Player requires Premium. Use external Spotify app (desktop/mobile) instead.'
    };
  }

  if (errorLower.includes('no_active_device') || errorLower.includes('device not found') || errorLower.includes('404')) {
    return {
      message: errorMessage,
      type: 'device',
      userMessage: 'No Active Spotify Device',
      actionable: 'Open Spotify on your phone, computer, or at open.spotify.com and start playing.'
    };
  }

  if (errorLower.includes('403') || errorLower.includes('forbidden') || errorLower.includes('scope')) {
    return {
      message: errorMessage,
      type: 'auth',
      userMessage: 'Permission Denied',
      actionable: 'Please reconnect Spotify to grant required permissions.'
    };
  }

  if (errorLower.includes('401') || errorLower.includes('unauthorized') || errorLower.includes('token')) {
    return {
      message: errorMessage,
      type: 'auth',
      userMessage: 'Authentication Failed',
      actionable: 'Please reconnect your Spotify account.'
    };
  }

  if (errorLower.includes('client_id') || errorLower.includes('not configured') || errorLower.includes('configuration')) {
    return {
      message: errorMessage,
      type: 'config',
      userMessage: 'Spotify Not Configured',
      actionable: 'Contact administrator to set up Spotify integration.'
    };
  }

  if (errorLower.includes('timeout') || errorLower.includes('network') || errorLower.includes('fetch failed')) {
    return {
      message: errorMessage,
      type: 'network',
      userMessage: 'Network Error',
      actionable: 'Check your internet connection and try again.'
    };
  }

  if (errorLower.includes('rate limit')) {
    return {
      message: errorMessage,
      type: 'network',
      userMessage: 'Rate Limit Exceeded',
      actionable: 'Please wait a moment and try again.'
    };
  }

  return {
    message: errorMessage,
    type: 'unknown',
    userMessage: 'Spotify Error',
    actionable: 'Please try again. If the problem persists, reconnect Spotify.'
  };
}

export function getErrorToastMessage(error: unknown): string {
  const parsed = parseSpotifyError(error);
  return `${parsed.userMessage}: ${parsed.actionable}`;
}
