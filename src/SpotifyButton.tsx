/**
 * SpotifyButton.tsx
 * Last Updated: October 30, 2025 @ 19:30 PST
 * Changes: Synchronized button sizing with BrandHeader for consistent UI
 */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';

import { getOAuthConfig, disconnectOAuthProvider, connectOAuthProvider } from './services/oauthApi';
import { oauthService, type OAuthConfig } from './services/oauthService';
import { useAuthStore } from './store/authStore';
import { useIntegrationStore } from './store/integrationStore';
import { useToastStore } from './store/toastStore';

// Microsoft Design System - Match BrandHeader button sizes
const BUTTON_SIZES = {
  base: 'h-8 w-8',        // Mobile portrait
  sm: 'sm:h-9 sm:w-9',    // Mobile landscape
  md: 'md:h-10 md:w-10',  // Tablet
  lg: 'lg:h-11 lg:w-11',  // Desktop
  xl: 'xl:h-12 xl:w-12',  // Large desktop
};

const ICON_SIZES = {
  base: 'w-4 h-4',
  sm: 'sm:w-5 sm:h-5',
  md: 'md:w-5 md:h-5',
  lg: 'lg:w-6 lg:h-6',
  xl: 'xl:w-6 xl:h-6',
};

const getResponsiveButtonClasses = (): string => {
  return Object.values(BUTTON_SIZES).join(' ');
};

const getResponsiveIconClasses = (): string => {
  return Object.values(ICON_SIZES).join(' ');
};

export function SpotifyButton() {
  const user = useAuthStore(state => state.user);
  const { addToast } = useToastStore();
  const loadConnections = useIntegrationStore(state => state.loadConnections);
  const getConnection = useIntegrationStore(state => state.getConnection);
  const isConnected = useIntegrationStore(state => state.isConnected);
  const removeConnection = useIntegrationStore(state => state.removeConnection);

  const [isConnecting, setIsConnecting] = useState(false);
  const connection = getConnection('spotify');
  const connected = isConnected('spotify');

  useEffect(() => {
    if (user) {
      loadConnections(user.id);
    }
  }, [user, loadConnections]);

  const handleConnect = async () => {
    if (!user) {
      addToast('Please sign in to connect Spotify', 'warning');
      return;
    }

    setIsConnecting(true);
    try {
      const partialConfig = await getOAuthConfig('spotify');
      const fullConfig: OAuthConfig = {
        authUrl: 'https://accounts.spotify.com/authorize',
        clientId: partialConfig.clientId,
        redirectUri: partialConfig.redirectUri,
        scope: 'user-read-playback-state user-modify-playback-state user-read-currently-playing',
        provider: 'spotify' as const
      };
      await oauthService.authenticate(
        fullConfig,
        async (code: string) => {
          try {
            await connectOAuthProvider('spotify', code, user.id);
            useIntegrationStore.getState().addConnection({
              id: '',
              user_id: user.id,
              provider: 'spotify',
              access_token: '',
              refresh_token: undefined,
              expires_at: undefined,
              display_name: 'Spotify',
              avatar_url: undefined,
            });
            addToast('Spotify connected successfully!', 'success');
            await loadConnections(user.id);
          } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to connect Spotify', 'error');
          } finally {
            setIsConnecting(false);
          }
        },
        (error: string) => {
          addToast(error || 'Failed to connect to Spotify', 'error');
          setIsConnecting(false);
        }
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to connect Spotify', 'error');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await disconnectOAuthProvider('spotify', user.id);
      removeConnection('spotify');
      addToast('Spotify disconnected', 'info');
      await loadConnections(user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect Spotify';
      addToast(message, 'error');
    }
  };

  return (
    <button
      onClick={() => {
        if (connected && connection) {
          // Open player modal later
          return;
        }
        handleConnect();
      }}
      onContextMenu={(e) => {
        if (connected && connection) {
          e.preventDefault();
          handleDisconnect();
        }
      }}
      disabled={isConnecting}
      className={`${getResponsiveButtonClasses()} flex items-center justify-center rounded-lg transition-all focus:outline-none ${
        connected
          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50'
          : 'hover:bg-slate-700/50 text-white'
      } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={connected ? 'Spotify Connected' : 'Connect to Spotify'}
    >
      {isConnecting ? (
        <span className={`${getResponsiveIconClasses()} inline-block rounded-full border-2 border-white/40 border-t-white animate-spin`} />
      ) : (
        <FontAwesomeIcon icon={["fab", "spotify"]} className={getResponsiveIconClasses()} />
      )}
    </button>
  );
}

