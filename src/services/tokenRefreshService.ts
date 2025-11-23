import { supabase } from '../lib/supabase';

import { refreshTokenIfNeeded } from './oauthApi';

interface TokenRefreshConfig {
  userId: string;
  provider: 'spotify' | 'x' | 'linkedin';
  onRefresh?: (newToken: string) => void;
  onError?: (error: Error) => void;
}

class TokenRefreshService {
  private intervals: Map<string, number> = new Map();

  startAutoRefresh(config: TokenRefreshConfig): void {
    const key = `${config.provider}-${config.userId}`;

    if (this.intervals.has(key)) {
      console.log(`Auto-refresh already active for ${key}`);
      return;
    }

    const checkAndRefresh = async () => {
      try {
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', config.userId)
          .eq('integration_type', config.provider)
          .eq('is_active', true)
          .maybeSingle();

        if (!integration) {
          console.log(`No active integration found for ${key}, stopping auto-refresh`);
          this.stopAutoRefresh(config.provider, config.userId);
          return;
        }

        const expiresAt = integration.token_expires_at
          ? new Date(integration.token_expires_at)
          : null;

        if (!expiresAt) {
          return;
        }

        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const tenMinutes = 10 * 60 * 1000;

        if (timeUntilExpiry < tenMinutes && timeUntilExpiry > 0) {
          console.log(`Token expiring soon for ${key}, refreshing...`);
          const newToken = await refreshTokenIfNeeded(integration, config.provider);

          if (config.onRefresh) {
            config.onRefresh(newToken);
          }

          console.log(`✅ Token refreshed for ${key}`);
        }
      } catch (error) {
        console.error(`Failed to refresh token for ${key}:`, error);
        if (config.onError) {
          config.onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };

    checkAndRefresh();

    const intervalId = window.setInterval(checkAndRefresh, 5 * 60 * 1000);
    this.intervals.set(key, intervalId);
    console.log(`Started auto-refresh for ${key}`);
  }

  stopAutoRefresh(provider: string, userId: string): void {
    const key = `${provider}-${userId}`;
    const intervalId = this.intervals.get(key);

    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
      console.log(`Stopped auto-refresh for ${key}`);
    }
  }

  stopAll(): void {
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.intervals.clear();
    console.log('Stopped all auto-refresh intervals');
  }
}

export const tokenRefreshService = new TokenRefreshService();
