// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Enhanced null eradication - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// Fixed: 2025-01-24 - Eradicated 13 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// src/services/spotifySdkManager.ts

/**
 * Spotify SDK Manager
 *
 * Enterprise-grade SDK loading and lifecycle management.
 * Implements Microsoft-style patterns:
 * - State machine with clear transitions
 * - Exponential backoff retry logic
 * - Comprehensive error handling and diagnostics
 * - Environment detection and capability negotiation
 */

export type SdkState =
  | 'not-loaded'
  | 'loading'
  | 'ready'
  | 'error'
  | 'unsupported';

// Spotify SDK window augmentation
interface SpotifySDKState {
  loaded?: boolean;
  loading?: boolean;
  loadTime?: string;
  error?: string;
}

interface SpotifySDKErrorDetail {
  error?: string;
  type?: string;
}

declare global {
  interface Window {
    __spotifySDK?: SpotifySDKState;
  }
  interface WindowEventMap {
    'spotify-sdk-ready': CustomEvent;
    'spotify-sdk-error': CustomEvent<SpotifySDKErrorDetail>;
  }
}

export type SdkErrorType =
  | 'network'
  | 'timeout'
  | 'csp-blocked'
  | 'environment-unsupported'
  | 'initialization-failed'
  | 'unknown';

export interface SdkStatus {
  state: SdkState;
  error: string | undefined;
  errorType: SdkErrorType | undefined;
  environment: 'browser' | 'webcontainer' | 'unknown';
  loadTime: number | undefined;
  retryCount: number;
  canRetry: boolean;
}

export interface SdkDiagnostics {
  sdkScriptPresent: boolean;
  sdkObjectAvailable: boolean;
  callbackDefined: boolean;
  environment: string;
  hostname: string;
  userAgent: string;
  loadAttempts: number;
  lastError: string | undefined;
  cspViolations: string[];
}

class SpotifySdkManager {
  private state: SdkState = 'not-loaded';
  private error?: string  = undefined;
  private errorType: SdkErrorType | undefined  = undefined;
  private loadTime: number | undefined  = undefined;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private listeners: Array<(status: SdkStatus) => void> = [];
  private initPromise: Promise<void> | undefined  = undefined;
  private cspViolations: string[] = [];
  private environmentLogged: boolean = false;
  private detectedEnvironment: 'browser' | 'webcontainer' | undefined  = undefined;

  constructor() {
    this.detectEnvironment();
    this.setupCspMonitoring();
    this.checkPreloadedSdk();
  }

  /**
   * Detect if running in WebContainer or restricted environment
   * CRITICAL: Only logs ONCE to prevent infinite console spam
   */
  private detectEnvironment(): 'browser' | 'webcontainer' {
    // Return cached result if already detected
    if (this.detectedEnvironment) {
      return this.detectedEnvironment;
    }

    const hostname = window.location.hostname;
    const isWebContainer =
      hostname.includes('stackblitz') ||
      hostname.includes('webcontainer') ||
      hostname.includes('local-credentialless') ||
      hostname.includes('bolt.new') ||
      hostname.includes('w-credentialless');

    // Log only once
    if (isWebContainer && !this.environmentLogged) {
      console.warn('⚠️ [SpotifySdkManager] WebContainer environment detected');
      this.environmentLogged = true;
    }

    this.detectedEnvironment = isWebContainer ? 'webcontainer' : 'browser';
    return this.detectedEnvironment;
  }

  /**
   * Monitor CSP violations
   */
  private setupCspMonitoring(): void {
    document.addEventListener('securitypolicyviolation', (e) => {
      if (e.blockedURI.includes('spotify') || e.blockedURI.includes('scdn.co')) {
        const violation = `CSP blocked: ${e.violatedDirective} - ${e.blockedURI}`;
        console.error('🚫 [SpotifySdkManager]', violation);
        this.cspViolations.push(violation);

        if (this.state === 'loading') {
          this.setState('error', 'Spotify SDK blocked by Content Security Policy', 'csp-blocked');
        }
      }
    });
  }

  /**
   * Check if SDK was preloaded in index.html
   */
  private checkPreloadedSdk(): void {
    if (window.__spotifySDK) {
      const sdkState = window.__spotifySDK;

      if (sdkState.loaded) {
        console.log('✅ [SpotifySdkManager] SDK already loaded');
        this.setState('ready');
        this.loadTime = sdkState.loadTime ? Number(sdkState.loadTime) : 0;
      } else if (sdkState.loading) {
        console.log('⏳ [SpotifySdkManager] SDK loading in progress');
        this.setState('loading');
        this.waitForSdkReady();
      } else if (sdkState.error) {
        console.error('❌ [SpotifySdkManager] SDK preload failed:', sdkState.error);
        this.setState('error', sdkState.error, 'initialization-failed');
      }
    }
  }

  /**
   * Wait for SDK to become ready (if loading via index.html)
   */
  private waitForSdkReady(): void {
    window.addEventListener('spotify-sdk-ready', () => {
      console.log('✅ [SpotifySdkManager] SDK ready event received');
      this.setState('ready');
      this.loadTime = window.__spotifySDK?.loadTime ? Number(window.__spotifySDK.loadTime) : undefined;
    }, { once: true });

    window.addEventListener('spotify-sdk-error', (event) => {
      console.error('❌ [SpotifySdkManager] SDK error event:', event.detail);
      const detail = event.detail || {};
      this.setState('error', (detail.error as string) || 'SDK load failed', (detail.type as SdkErrorType) || 'unknown');
    }, { once: true });
  }

  /**
   * Initialize SDK with retry logic and exponential backoff
   */
  public async initialize(): Promise<void> {
    // If already initializing, return existing promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // If already ready, resolve immediately
    if (this.state === 'ready' && window.Spotify) {
      return Promise.resolve();
    }

    // Create initialization promise
    this.initPromise = this.initializeWithRetry();
    return this.initPromise;
  }

  /**
   * Initialize with exponential backoff retry
   */
  private async initializeWithRetry(): Promise<void> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      this.retryCount = attempt;

      try {
        await this.attemptInitialization();
        return; // Success!
      } catch (error) {
        console.warn(`⚠️ [SpotifySdkManager] Attempt ${attempt + 1}/${this.maxRetries + 1} failed:`, error);

        // If max retries reached, throw error
        if (attempt === this.maxRetries) {
          const message = error instanceof Error ? error.message : 'SDK initialization failed';
          this.setState('error', message, 'initialization-failed');
          throw error;
        }

        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`⏳ [SpotifySdkManager] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Single initialization attempt
   */
  private async attemptInitialization(): Promise<void> {
    this.setState('loading');

    // Check if SDK is already available
    if (window.Spotify) {
      console.log('✅ [SpotifySdkManager] SDK already available');
      this.setState('ready');
      return;
    }

    // Check if preloaded SDK will become ready
    if (window.__spotifySDK?.loading) {
      console.log('⏳ [SpotifySdkManager] Waiting for preloaded SDK...');
      return this.waitForPreloadedSdk();
    }

    // If no preload, SDK loading failed
    throw new Error('Spotify SDK not available - preload may have failed');
  }

  /**
   * Wait for preloaded SDK with timeout
   */
  private waitForPreloadedSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SDK preload timeout (15s)'));
      }, 15000);

      const successHandler = () => {
        clearTimeout(timeout);
        window.removeEventListener('spotify-sdk-error', errorHandler);
        resolve();
      };

      const errorHandler = (event: CustomEvent<SpotifySDKErrorDetail>) => {
        clearTimeout(timeout);
        window.removeEventListener('spotify-sdk-ready', successHandler);
        reject(new Error(event.detail?.error || 'SDK load failed'));
      };

      window.addEventListener('spotify-sdk-ready', successHandler, { once: true });
      window.addEventListener('spotify-sdk-error', errorHandler, { once: true });
    });
  }

  /**
   * Check if SDK is ready to use
   */
  public isReady(): boolean {
    return this.state === 'ready' && !!window.Spotify;
  }

  /**
   * Check if Web Player is supported in current environment
   */
  public isSupported(): boolean {
    const env = this.detectEnvironment();

    // WebContainer environments often have CSP restrictions
    if (env === 'webcontainer') {
      return false;
    }

    // Check browser support
    if (!window.navigator.mediaDevices) {
      return false;
    }

    return true;
  }

  /**
   * Get current status
   */
  public getStatus(): SdkStatus {
    return {
      state: this.state,
      error: this.error,
      errorType: this.errorType,
      environment: this.detectEnvironment(),
      loadTime: this.loadTime,
      retryCount: this.retryCount,
      canRetry: this.retryCount < this.maxRetries && this.state === 'error'
    };
  }

  /**
   * Get diagnostics information
   */
  public getDiagnostics(): SdkDiagnostics {
    return {
      sdkScriptPresent: !!document.getElementById('spotify-sdk'),
      sdkObjectAvailable: !!window.Spotify,
      callbackDefined: typeof window.onSpotifyWebPlaybackSDKReady === 'function',
      environment: this.detectEnvironment(),
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
      loadAttempts: this.retryCount + 1,
      lastError: this.error,
      cspViolations: [...this.cspViolations]
    };
  }

  /**
   * Subscribe to status changes
   */
  public subscribe(listener: (status: SdkStatus) => void): () => void {
    this.listeners.push(listener);

    // Immediately call with current status
    listener(this.getStatus());

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Reset state (for reconnection attempts)
   */
  public reset(): void {
    this.state = 'not-loaded';
    this.error  = undefined;
    this.errorType  = undefined;
    this.retryCount = 0;
    this.initPromise  = undefined;
    this.notifyListeners();
  }

  /**
   * Internal: Update state and notify listeners
   */
  private setState(
    state: SdkState,
    error: string | undefined = undefined,
    errorType: SdkErrorType | undefined = undefined
  ): void {
    this.state = state;
    this.error = error;
    this.errorType = errorType;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[SpotifySdkManager] Listener error:', error);
      }
    });
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const spotifySdkManager = new SpotifySdkManager();
