// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// Centralized Spotify type definitions
// All Spotify-related interfaces should be defined here to avoid duplication

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string; id: string }[];
    album: {
      name: string;
      images: { url: string; height: number; width: number }[];
    };
    duration_ms: number;
    uri: string;
  }
  
  export interface SpotifyPlaylist {
    id: string;
    name: string;
    images: { url: string }[];
    tracks: { total: number };
    uri: string;
    owner: { display_name: string };
  }
  
  export interface CurrentlyPlaying {
    item: SpotifyTrack | undefined;
    is_playing: boolean;
    progress_ms: number;
    device: {
      id: string;
      name: string;
      type: string;
      volume_percent: number;
    } | null;
    shuffle_state: boolean;
    repeat_state: 'off' | 'track' | 'context';
    context: {
      type: string;
      uri: string;
    } | null;
  }
  
  export interface SpotifyUserProfile {
    id: string;
    display_name: string;
    email: string;
    product: 'free' | 'premium' | 'open';
    images: { url: string }[];
  }
  
  export interface SpotifyDevice {
    id: string;
    name: string;
    type: string;
    is_active: boolean;
    volume_percent: number;
  }
  
  export interface SpotifyError {
    message: string;
    type: 'auth' | 'premium' | 'device' | 'network' | 'config' | 'browser_blocked' | 'unknown';
    userMessage: string;
    actionable?: string;
  }