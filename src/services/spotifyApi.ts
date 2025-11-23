// src/services/spotifyApi.ts
import { supabase } from '../lib/supabase';

import { refreshTokenIfNeeded } from './oauthApi';
import type {
// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 8 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

  SpotifyTrack,
  SpotifyPlaylist,
  CurrentlyPlaying,
  SpotifyUserProfile,
  /* ORIGINAL CODE START — reason: SpotifyDevice interface unused causing TS6196 error
     Date: 2025-01-21 21:20:00
  */
  // SpotifyDevice
  /* ORIGINAL CODE END */
} from './spotify/types';

// FIX NOTE – TS6196 unused interface corrected: Comment out unused interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const SpotifyDevice  = undefined; /* UNUSED INTERFACE – preserved for reference */

// Re-export types for backward compatibility
export type {
  SpotifyTrack,
  SpotifyPlaylist,
  CurrentlyPlaying,
  SpotifyUserProfile
};

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

class SpotifyApiService {
  // Token refresh mutex - prevents concurrent token refresh requests
  private tokenRefreshPromise: Promise<string> | undefined  = undefined;
  private lastTokenRefreshTime = 0;
  private cachedToken: string | undefined  = undefined;
  private readonly CACHE_EXPIRATION_MS = 50 * 60 * 1000; // 50 minutes (tokens expire in 60 min)

  /**
   * Get a valid access token with mutex lock to prevent concurrent refreshes
   * @param userId User ID to get token for
   * @returns Valid access token
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    // If refresh is already in progress, wait for it
    if (this.tokenRefreshPromise) {
      console.log('🔒 [SpotifyAPI] Token refresh in progress, waiting for completion...');
      return this.tokenRefreshPromise;
    }

    // If we have a cached token from recent refresh and it hasn't expired, use it
    const now = Date.now();
    if (this.cachedToken && now - this.lastTokenRefreshTime < this.CACHE_EXPIRATION_MS) {
      console.log('✅ [SpotifyAPI] Using cached token from recent refresh');
      return this.cachedToken;
    }

    // Start token refresh with mutex lock
    console.log('🔄 [SpotifyAPI] Starting token refresh...');

    this.tokenRefreshPromise = (async () => {
      try {
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', userId)
          .eq('integration_type', 'spotify')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (!integration) {
          throw new Error('Spotify not connected. Please connect your Spotify account.');
        }

        const token = await refreshTokenIfNeeded(integration, 'spotify');

        // Cache the token
        this.cachedToken = token;
        this.lastTokenRefreshTime = Date.now();

        console.log('✅ [SpotifyAPI] Token refresh complete');
        return token;
      } catch (error) {
        console.error('❌ [SpotifyAPI] Token refresh failed:', error);
        // Clear cached token on failure
        this.invalidateCache();
        throw error;
      } finally {
        // Clear the promise after completion (success or failure)
        this.tokenRefreshPromise  = undefined;
      }
    })();

    return this.tokenRefreshPromise;
  }

  private async fetchSpotify(
    userId: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const accessToken = await this.getValidAccessToken(userId);

    return fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Support AbortController for canceling in-flight requests
      signal: options.signal,
    });
  }

  async getUserPlaylists(userId: string): Promise<SpotifyPlaylist[]> {
    const response = await this.fetchSpotify(userId, '/me/playlists?limit=50');
    
    if (!response.ok) {
      throw new Error('Failed to fetch playlists');
    }

    const data = await response.json();
    return data.items;
  }

  async getCurrentlyPlaying(userId: string): Promise<CurrentlyPlaying | undefined> {
    const response = await this.fetchSpotify(userId, '/me/player');
    
    if (response.status === 204) {
      return undefined;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch currently playing');
    }

    return response.json();
  }

  async getSavedTracks(userId: string, limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.fetchSpotify(userId, `/me/tracks?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch saved tracks');
    }

    const data = await response.json();
    return data.items.map((item: Record<string, unknown>) => item.track);
  }

  async getRecentlyPlayed(userId: string, limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.fetchSpotify(userId, `/me/player/recently-played?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recently played');
    }

    const data = await response.json();
    return data.items.map((item: Record<string, unknown>) => item.track);
  }

  async getTopTracks(userId: string, limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.fetchSpotify(userId, `/me/top/tracks?limit=${limit}&time_range=short_term`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch top tracks');
    }

    const data = await response.json();
    return data.items;
  }

  // 🔧 UPDATED: Added deviceId parameter
  async play(userId: string, contextUri?: string, uris?: string[], deviceId?: string): Promise<void> {
    const body: Record<string, unknown> = {};
    
    if (contextUri) {
      body.context_uri = contextUri;
    } else if (uris) {
      body.uris = uris;
    }

    // Add device_id to the URL if provided
    const endpoint = deviceId
      ? `/me/player/play?device_id=${deviceId}`
      : '/me/player/play';

    const response = await this.fetchSpotify(userId, endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.text();
      throw new Error(`Failed to play: ${error}`);
    }
  }

  async pause(userId: string, deviceId?: string): Promise<void> {
    const endpoint = deviceId
      ? `/me/player/pause?device_id=${deviceId}`
      : '/me/player/pause';

    const response = await this.fetchSpotify(userId, endpoint, {
      method: 'PUT',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to pause');
    }
  }

  async skipNext(userId: string, deviceId?: string): Promise<void> {
    const endpoint = deviceId
      ? `/me/player/next?device_id=${deviceId}`
      : '/me/player/next';

    const response = await this.fetchSpotify(userId, endpoint, {
      method: 'POST',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to skip to next');
    }
  }

  async skipPrevious(userId: string, deviceId?: string): Promise<void> {
    const endpoint = deviceId
      ? `/me/player/previous?device_id=${deviceId}`
      : '/me/player/previous';

    const response = await this.fetchSpotify(userId, endpoint, {
      method: 'POST',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to skip to previous');
    }
  }

  async setVolume(userId: string, volumePercent: number, deviceId?: string): Promise<void> {
    let endpoint = `/me/player/volume?volume_percent=${volumePercent}`;
    if (deviceId) {
      endpoint += `&device_id=${deviceId}`;
    }

    const response = await this.fetchSpotify(userId, endpoint, {
      method: 'PUT',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to set volume');
    }
  }

  async setShuffle(userId: string, state: boolean, deviceId?: string): Promise<void> {
    let endpoint = `/me/player/shuffle?state=${state}`;
    if (deviceId) {
      endpoint += `&device_id=${deviceId}`;
    }

    const response = await this.fetchSpotify(userId, endpoint, {
      method: 'PUT',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to toggle shuffle');
    }
  }

  async setRepeatMode(userId: string, state: 'off' | 'track' | 'context', deviceId?: string): Promise<void> {
    let endpoint = `/me/player/repeat?state=${state}`;
    if (deviceId) {
      endpoint += `&device_id=${deviceId}`;
    }

    const response = await this.fetchSpotify(userId, endpoint, {
      method: 'PUT',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to set repeat mode');
    }
  }

  async search(userId: string, query: string): Promise<Record<string, unknown>> {
    const response = await this.fetchSpotify(
      userId,
      `/search?q=${encodeURIComponent(query)}&type=track,album,playlist&limit=20`
    );

    if (!response.ok) {
      throw new Error('Failed to search');
    }

    return response.json();
  }

  async getPlaylistTracks(userId: string, playlistId: string): Promise<SpotifyTrack[]> {
    const response = await this.fetchSpotify(userId, `/playlists/${playlistId}/tracks?limit=50`);

    if (!response.ok) {
      throw new Error('Failed to fetch playlist tracks');
    }

    const data = await response.json();
    return data.items.map((item: Record<string, unknown>) => item.track).filter((track: unknown) => track !== undefined);
  }

  async transferPlayback(userId: string, deviceId: string): Promise<void> {
    const response = await this.fetchSpotify(userId, '/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false
      }),
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.text();
      throw new Error(`Failed to transfer playback: ${error}`);
    }
  }

  async getAvailableDevices(userId: string): Promise<Array<Record<string, unknown>>> {
    const response = await this.fetchSpotify(userId, '/me/player/devices');

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const data = await response.json();
    return data.devices || [];
  }

  async getUserProfile(userId: string): Promise<SpotifyUserProfile> {
    const response = await this.fetchSpotify(userId, '/me');

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  async checkPremiumStatus(userId: string): Promise<{ hasPremium: boolean; product: string }> {
    try {
      const profile = await this.getUserProfile(userId);
      return {
        hasPremium: profile.product === 'premium',
        product: profile.product
      };
    } catch (error) {
      console.error('Failed to check Premium status:', error);
      throw error;
    }
  }

  /**
   * Invalidate cached access token
   * Call this when disconnecting or when token becomes invalid
   */
  invalidateCache(): void {
    console.log('🗑️ [SpotifyAPI] Invalidating token cache');
    this.cachedToken  = undefined;
    this.lastTokenRefreshTime = 0;
    this.tokenRefreshPromise  = undefined;
  }

  /**
   * Force refresh token by clearing cache and getting new token
   * @param userId User ID to refresh token for
   */
  async forceRefreshToken(userId: string): Promise<string> {
    console.log('🔄 [SpotifyAPI] Forcing token refresh');
    this.invalidateCache();
    return this.getValidAccessToken(userId);
  }
}

export const spotifyApi = new SpotifyApiService();