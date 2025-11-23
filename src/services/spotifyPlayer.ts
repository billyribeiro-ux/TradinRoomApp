// src/services/spotifyPlayer.ts

import { spotifySdkManager } from './spotifySdkManager';
// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 13 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


// Add type declarations for Spotify Web Playback SDK
interface SpotifyWebPlaybackPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (data: unknown) => void): void;
  removeListener(event: string): void;
  getCurrentState(): Promise<SpotifyPlayerState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  activateElement(): Promise<void>;
}

interface SpotifyPlayerState {
  context: {
    uri: string;
    metadata: Record<string, unknown>;
  };
  disallows: {
    pausing: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    previous_tracks: SpotifyTrack[];
    next_tracks: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  uri: string;
  id: string;
  type: string;
  media_type: string;
  name: string;
  is_playable: boolean;
  album: {
    uri: string;
    name: string;
    images: Array<{ url: string }>;
  };
  artists: Array<{ uri: string; name: string }>;
}

interface SpotifyConstructor {
  Player: new (options: {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }) => SpotifyWebPlaybackPlayer;
}

declare global {
  interface Window {
    Spotify?: SpotifyConstructor;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

// Singleton instance
let playerInstance: SpotifyPlayer | undefined  = undefined;

export class SpotifyPlayer {
  private player: SpotifyWebPlaybackPlayer | undefined  = undefined;
  private deviceId: string | undefined  = undefined;
  private accessToken: string | undefined  = undefined;
  private initializationInProgress = false;

  // Private constructor to enforce singleton
  private constructor() {
    // Ensure flags are initialized; statement prevents empty-function lint error
    this.initializationInProgress = false;
  }

  /**
   * Get singleton instance of SpotifyPlayer
   * @returns {SpotifyPlayer} The singleton player instance
   */
  public static getInstance(): SpotifyPlayer {
    if (!playerInstance) {
      console.log('[SpotifyPlayer] Creating new singleton instance');
      playerInstance = new SpotifyPlayer();
    } else {
      console.log('[SpotifyPlayer] Reusing existing singleton instance');
    }
    return playerInstance;
  }

  /**
   * Check if player is already initialized
   * @returns {boolean} True if player is initialized with device ID
   */
  public isInitialized(): boolean {
    return this.player !== undefined && this.deviceId !== undefined;
  }

  async initialize(accessToken: string): Promise<string> {
    // If already initialized with the same token, return existing device ID
    if (this.isInitialized() && this.accessToken === accessToken) {
      console.log('[SpotifyPlayer] Already initialized, returning existing device ID:', this.deviceId);
      return this.deviceId!;
    }

    if (this.initializationInProgress) {
      throw new Error('Initialization already in progress');
    }

    this.initializationInProgress = true;
    this.accessToken = accessToken;

    try {
      return await this.initializeWithTimeout(accessToken);
    } finally {
      this.initializationInProgress = false;
    }
  }

  /**
   * Initialize player with timeout
   * @param accessToken Spotify access token
   * @returns Promise that resolves with device ID
   */
  private async initializeWithTimeout(accessToken: string): Promise<string> {
    const initPromise = this.initializePlayer(accessToken);

    // Timeout with proper cleanup - 20 seconds for slower connections
    let timeoutId: number;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('Spotify Web Player initialization timeout (20s)'));
      }, 20000);
    });

    try {
      const result = await Promise.race([initPromise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  /**
   * Load Spotify SDK using SDK Manager
   * @returns {Promise<void>} Resolves when SDK is ready
   */
  private async loadSDK(): Promise<void> {
    console.log('🔄 [SpotifyPlayer] Ensuring SDK is loaded...');

    try {
      // Use SDK manager to load SDK with retry logic
      await spotifySdkManager.initialize();

      if (!window.Spotify) {
        throw new Error('Spotify SDK not available - browser may be blocking it');
      }

      console.log('✅ [SpotifyPlayer] SDK ready');
    } catch (error) {
      console.error('❌ [SpotifyPlayer] SDK loading failed - falling back to API-only mode');
      console.error('💡 Users can still control Spotify via external devices (phone/computer)');
      throw new Error('Spotify SDK not available after initialization. Please use Spotify on your phone/computer instead - we\'ll control it remotely.');
    }
  }

  private async initializePlayer(accessToken: string): Promise<string> {
    // Avoid async executor pattern (no-async-promise-executor rule)
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await this.loadSDK();
          console.log('🎵 [SpotifyPlayer] SDK ready, creating player instance...');
          this.createPlayer(accessToken, resolve, reject);
        } catch (sdkErr) {
          console.error('❌ [SpotifyPlayer] SDK loading failed:', sdkErr);
          reject(sdkErr);
        }
      })();
    });
  }

  private createPlayer(
    accessToken: string,
    resolve: (deviceId: string) => void,
    reject: (error: unknown) => void
  ) {
    try {
      console.log('🎵 Creating Spotify Player instance...');

      if (!window.Spotify) {
        throw new Error('Spotify SDK not loaded');
      }
      
      this.player = new window.Spotify.Player({
        name: 'Social Media App Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5
      });

      let hasResolved = false;

      // Error handling
      this.player.addListener('initialization_error', (data: unknown) => {
        const message = (data as { message: string }).message;
        console.error('❌ Spotify Player - Initialization error:', message);
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error(`Initialization error: ${message}`));
        }
      });

      this.player.addListener('authentication_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('❌ Spotify Player - Authentication error:', message);
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error(`Authentication error: ${message}`));
        }
      });

      this.player.addListener('account_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('❌ Spotify Player - Account error:', message);
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error(`Account error: ${message}`));
        }
      });

      this.player.addListener('playback_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('❌ Spotify Player - Playback error:', message);
      });

      // Ready
      this.player.addListener('ready', (data: unknown) => {
        const { device_id } = data as { device_id: string };
        console.log('✅ Spotify Web Player ready with Device ID:', device_id);
        this.deviceId = device_id;
        if (!hasResolved) {
          hasResolved = true;
          resolve(device_id);
        }
      });

      // Not Ready
      this.player.addListener('not_ready', (data: unknown) => {
        const { device_id } = data as { device_id: string };
        console.log('⚠️ Spotify Player - Device has gone offline:', device_id);
      });

      // Player state changes
      this.player.addListener('player_state_changed', (state: unknown) => {
        if (!state) return;
        console.log('🎵 Spotify Player - State changed');
      });

      // Connect to the player
      console.log('🔌 Connecting to Spotify Web Player...');
      this.player.connect().then((success: boolean) => {
        if (success) {
          console.log('✅ Spotify Web Player connected successfully');
        } else {
          console.error('❌ Spotify Web Player connection failed');
          if (!hasResolved) {
            hasResolved = true;
            reject(new Error('Failed to connect to Spotify player'));
          }
        }
      }).catch((error: unknown) => {
        console.error('❌ Spotify Web Player connection error:', error);
        if (!hasResolved) {
          hasResolved = true;
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ Failed to create Spotify Player:', error);
      reject(error);
    }
  }

  getDeviceId(): string | undefined {
    return this.deviceId;
  }

  async togglePlay() {
    if (this.player) {
      await this.player.togglePlay();
    }
  }

  async pause() {
    if (this.player) {
      await this.player.pause();
    }
  }

  async resume() {
    if (this.player) {
      await this.player.resume();
    }
  }

  async nextTrack() {
    if (this.player) {
      await this.player.nextTrack();
    }
  }

  async previousTrack() {
    if (this.player) {
      await this.player.previousTrack();
    }
  }

  async setVolume(volume: number) {
    if (this.player) {
      await this.player.setVolume(volume / 100);
    }
  }

  async getCurrentState(): Promise<SpotifyPlayerState | null | undefined> {
    if (this.player) {
      return await this.player.getCurrentState();
    }
    return undefined;
  }

  disconnect() {
    if (this.player) {
      this.player.disconnect();
      this.player = undefined;
    }
  }

  // Reset singleton instance (for complete cleanup on disconnect)
  public static resetInstance() {
    console.log('[SpotifyPlayer] Resetting singleton instance');
    if (playerInstance) {
      playerInstance.disconnect();
      playerInstance  = undefined;
    }
  }

  isConnected(): boolean {
    return this.player !== undefined && this.deviceId !== undefined;
  }
}