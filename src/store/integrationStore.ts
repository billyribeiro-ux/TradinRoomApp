import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Integration {
  id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  display_name?: string;
  avatar_url?: string;
  user_id: string;
}

interface IntegrationState {
  connections: Integration[];
  isLoading: boolean;
  loadConnections: (userId: string) => Promise<void>;
  addConnection: (connection: Integration) => void;
  removeConnection: (provider: string) => void;
  getConnection: (provider: string) => Integration | undefined;
  isConnected: (provider: string) => boolean;
}

export const useIntegrationStore = create<IntegrationState>()(
  persist(
    (set, get) => ({
      connections: [],
      isLoading: false,

      loadConnections: async (userId: string) => {
        set({ isLoading: true });
        try {
          const { supabase } = await import('../lib/supabase');
          const { data, error } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', userId);

          if (error) throw error;
          const connections: Integration[] = (data || []).map((item: any) => ({
            id: item.id,
            provider: item.integration_type,
            access_token: item.access_token,
            refresh_token: item.refresh_token || undefined,
            expires_at: item.token_expires_at || undefined,
            display_name: undefined,
            avatar_url: undefined,
            user_id: item.user_id
          }));
          set({ connections, isLoading: false });
        } catch (error) {
          console.error('[IntegrationStore] Failed to load connections:', error);
          set({ isLoading: false });
        }
      },

      addConnection: (connection) => {
        set((state) => ({
          connections: [...state.connections.filter(c => c.provider !== connection.provider), connection]
        }));
      },

      removeConnection: (provider) => {
        set((state) => ({
          connections: state.connections.filter(c => c.provider !== provider)
        }));
      },

      getConnection: (provider) => {
        return get().connections.find(c => c.provider === provider);
      },

      isConnected: (provider) => {
        return get().connections.some(c => c.provider === provider);
      },
    }),
    {
      name: 'integration-storage',
    }
  )
);
