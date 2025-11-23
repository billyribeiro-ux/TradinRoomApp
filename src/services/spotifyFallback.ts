// ============================================================================
// SPOTIFY WEB PLAYER FALLBACK - Microsoft Enterprise Standard
// ============================================================================
// Handles graceful degradation when browser blocks Web Playback SDK

import { logger } from '../utils/productionLogger';

// Create scoped logger for Spotify fallback
const log = logger.scope('SpotifyFallback');

export type SpotifyMode = 'web_player' | 'api_only' | 'unknown';

interface SpotifyCapabilities {
  mode: SpotifyMode;
  canUseWebPlayer: boolean;
  canUseAPI: boolean;
  reason?: string;
}

class SpotifyFallbackManager {
  private capabilities: SpotifyCapabilities = {
    mode: 'unknown',
    canUseWebPlayer: false,
    canUseAPI: true, // API always available
  };

  /**
   * Detect if Web Playback SDK is available and allowed by browser
   */
  public async detectCapabilities(): Promise<SpotifyCapabilities> {
    log.info('Detecting Spotify capabilities', { component: 'SpotifyFallback' });

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.capabilities = {
        mode: 'api_only',
        canUseWebPlayer: false,
        canUseAPI: true,
        reason: 'Server-side environment',
      };
      return this.capabilities;
    }

    // Check for browser restrictions
    const restrictions = this.checkBrowserRestrictions();
    if (restrictions) {
      this.capabilities = {
        mode: 'api_only',
        canUseWebPlayer: false,
        canUseAPI: true,
        reason: restrictions,
      };
      log.warn('Web Player unavailable, using API-only mode', {
        reason: restrictions,
      });
      return this.capabilities;
    }

    // Try to detect if SDK can load
    const canLoadSDK = await this.canLoadWebPlaybackSDK();
    
    this.capabilities = {
      mode: canLoadSDK ? 'web_player' : 'api_only',
      canUseWebPlayer: canLoadSDK,
      canUseAPI: true,
      reason: canLoadSDK ? undefined : 'SDK blocked or unavailable',
    };

    log.info('Spotify capabilities detected', { 
      mode: this.capabilities.mode,
      canUseWebPlayer: this.capabilities.canUseWebPlayer,
      canUseAPI: this.capabilities.canUseAPI,
    });
    return this.capabilities;
  }

  /**
   * Check for known browser restrictions
   */
  private checkBrowserRestrictions(): string | null {
    // Check for strict CSP
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (meta) {
      const content = meta.getAttribute('content') || '';
      if (!content.includes('sdk.scdn.co')) {
        return 'Content Security Policy blocks Spotify SDK';
      }
    }

    // Check for known restrictive browsers
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Firefox with strict tracking protection
    if (userAgent.includes('firefox')) {
      log.debug('Firefox detected - may have tracking protection');
    }

    // Safari with ITP (Intelligent Tracking Prevention)
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      log.debug('Safari detected - may have ITP restrictions');
    }

    return null;
  }

  /**
   * Test if Web Playback SDK can actually load
   */
  private async canLoadWebPlaybackSDK(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if SDK is already loaded
      if ((window as Window & { Spotify?: unknown }).Spotify) {
        resolve(true);
        return;
      }

      // Try loading SDK script
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

      const timeout = setTimeout(() => {
        script.remove();
        resolve(false);
      }, 5000);

      script.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        log.warn('Spotify SDK failed to load - browser may be blocking it');
        resolve(false);
      };

      // Don't actually append it if we're just testing
      // This prevents multiple SDK loads
      if (!document.getElementById('spotify-sdk')) {
        document.head.appendChild(script);
      } else {
        clearTimeout(timeout);
        resolve(true);
      }
    });
  }

  /**
   * Get current capabilities
   */
  public getCapabilities(): SpotifyCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if Web Player is available
   */
  public canUseWebPlayer(): boolean {
    return this.capabilities.canUseWebPlayer;
  }

  /**
   * Check if API is available (always true)
   */
  public canUseAPI(): boolean {
    return this.capabilities.canUseAPI;
  }

  /**
   * Get user-friendly message about current mode
   */
  public getUserMessage(): string {
    switch (this.capabilities.mode) {
      case 'web_player':
        return 'Using Spotify Web Player in browser';
      case 'api_only':
        return 'Controlling your Spotify devices remotely (Web Player unavailable)';
      default:
        return 'Checking Spotify compatibility...';
    }
  }

  /**
   * Get recommended action for user
   */
  public getRecommendedAction(): string {
    if (this.capabilities.mode === 'api_only') {
      return 'Open Spotify on your phone, computer, or at open.spotify.com to control playback';
    }
    return 'You can use the web player or control external Spotify devices';
  }
}

// Singleton instance
export const spotifyFallback = new SpotifyFallbackManager();

// Export for use in components
export const useSpotifyMode = () => {
  return {
    canUseWebPlayer: spotifyFallback.canUseWebPlayer(),
    canUseAPI: spotifyFallback.canUseAPI(),
    mode: spotifyFallback.getCapabilities().mode,
    message: spotifyFallback.getUserMessage(),
    action: spotifyFallback.getRecommendedAction(),
  };
};
