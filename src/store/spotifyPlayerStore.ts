import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlayerStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface CurrentlyPlaying {
  is_playing: boolean;
  item?: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      images: Array<{ url: string }>;
    };
    duration_ms: number;
  };
  progress_ms: number;
  device: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface SpotifyPlayerState {
  currentPlayback: CurrentlyPlaying | undefined;
  playerStatus: PlayerStatus;
  playerError: string | undefined;
  pollInterval: ReturnType<typeof setInterval> | undefined;
  startPolling: (userId: string) => void;
  stopPolling: () => void;
  setCurrentPlayback: (playback: CurrentlyPlaying | undefined) => void;
  setPlayerStatus: (status: PlayerStatus) => void;
  setPlayerError: (error: string | undefined) => void;
}

export const useSpotifyPlayerStore = create<SpotifyPlayerState>()(
  persist(
    (set, get) => ({
      currentPlayback: undefined,
      playerStatus: 'idle',
      playerError: undefined,
      pollInterval: undefined,

      startPolling: async (userId: string) => {
        // Clean up any existing interval first
        const { pollInterval } = get();
        if (pollInterval) {
          clearInterval(pollInterval);
          set({ pollInterval: undefined });
        }

        const interval = setInterval(async () => {
          try {
            const { spotifyApi } = await import('../services/spotifyApi');
            const playback = await spotifyApi.getCurrentlyPlaying(userId);
            set({ currentPlayback: playback || undefined });
          } catch (error) {
            console.error('[SpotifyPlayerStore] Polling error:', error);
          }
        }, 2000);

        set({ pollInterval: interval });
      },

      stopPolling: () => {
        const { pollInterval } = get();
        if (pollInterval) {
          clearInterval(pollInterval);
          set({ pollInterval: undefined });
        }
      },

      setCurrentPlayback: (playback) => set({ currentPlayback: playback }),
      setPlayerStatus: (status) => set({ playerStatus: status }),
      setPlayerError: (error) => set({ playerError: error }),
    }),
    {
      name: 'spotify-player-storage',
    }
  )
);
